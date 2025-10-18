using GaleriePhotos.Data;
using GaleriePhotos.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;
using FaceAiSharp;
using FaceAiSharp.Extensions;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Pgvector;
using SixLabors.ImageSharp.Processing;
using Pgvector.EntityFrameworkCore;

namespace GaleriePhotos.Services
{
    public class FaceDetectionService
    {
        private readonly ApplicationDbContext applicationDbContext;
        private readonly ILogger<FaceDetectionService> logger;
        private readonly DataService dataService;
        private static readonly IFaceDetector faceDetector = FaceAiSharpBundleFactory.CreateFaceDetectorWithLandmarks();
        private static readonly IFaceEmbeddingsGenerator faceEmbeddingsGenerator = FaceAiSharpBundleFactory.CreateFaceEmbeddingsGenerator();

        private readonly PhotoService photoService;

        public FaceDetectionService(
            ApplicationDbContext applicationDbContext,
            ILogger<FaceDetectionService> logger,
            DataService dataService,
            PhotoService photoService)
        {
            this.applicationDbContext = applicationDbContext;
            this.logger = logger;
            this.dataService = dataService;
            this.photoService = photoService;
        }

        public async Task<bool> ProcessPhotoAsync(Photo photo)
        {
            try
            {
                logger.LogInformation("Processing photo {PhotoId} for face detection", photo.Id);
                
                // Check if photo is an image (not video)
                if (PhotoService.IsVideo(photo))
                {
                    logger.LogDebug("Skipping video file {FileName}", photo.FileName);
                    photo.FaceDetectionStatus = FaceDetectionStatus.Skipped;
                    applicationDbContext.Photos.Update(photo);
                    await applicationDbContext.SaveChangesAsync();
                    return false;
                }

                // Check if faces have already been processed for this photo
                var existingFaces = await applicationDbContext.Faces
                    .Where(f => f.PhotoId == photo.Id)
                    .AnyAsync();

                if (existingFaces)
                {
                    photo.FaceDetectionStatus = FaceDetectionStatus.Completed;
                    applicationDbContext.Photos.Update(photo);
                    await applicationDbContext.SaveChangesAsync();
                    logger.LogDebug("Photo {PhotoId} already has faces processed", photo.Id);
                    return false;
                }

                photo.FaceDetectionStatus = FaceDetectionStatus.InProgress;
                applicationDbContext.Photos.Update(photo);
                await applicationDbContext.SaveChangesAsync();

                // Get the photo directory
                var photoDirectory = photo.Directory;

                if (photoDirectory == null)
                {
                    photo.FaceDetectionStatus = FaceDetectionStatus.Failed;
                    applicationDbContext.Photos.Update(photo);
                    await applicationDbContext.SaveChangesAsync();
                    logger.LogWarning("Photo directory not found for photo {PhotoId}", photo.Id);
                    return false;
                }

                var dataProvider = dataService.GetDataProvider(photoDirectory.Gallery);
                
                // Open the photo file
                using var fileStream = await dataProvider.OpenFileRead(photo);
                if (fileStream == null)
                {
                    photo.FaceDetectionStatus = FaceDetectionStatus.Failed;
                    applicationDbContext.Photos.Update(photo);
                    await applicationDbContext.SaveChangesAsync();
                    logger.LogWarning("Could not open file {FileName} for photo {PhotoId}", photo.FileName, photo.Id);
                    return false;
                }

                // Load the image
                using var image = await Image.LoadAsync<Rgb24>(fileStream);
                image.Mutate(x => x.AutoOrient());
                
                logger.LogInformation("Face detection processing photo {PhotoId}", photo.Id);
                
                // Placeholder - in actual implementation, this would detect faces and create Face entities
                var detectedFaces = faceDetector.DetectFaces(image);
                foreach (var detectedFace in detectedFaces)
                {
                    if (detectedFace.Landmarks == null) continue;
                    var faceImage = image.Clone();
                    faceEmbeddingsGenerator.AlignFaceUsingLandmarks(faceImage, detectedFace.Landmarks);
                    var embedding = faceEmbeddingsGenerator.GenerateEmbedding(faceImage);
                    if (embedding != null)
                    {
                        var face = new Face
                        {
                            PhotoId = photo.Id,
                            Photo = photo,
                            Embedding = new Vector(embedding),
                            X = detectedFace.Box.X,
                            Y = detectedFace.Box.Y,
                            Width = detectedFace.Box.Width,
                            Height = detectedFace.Box.Height,
                            CreatedAt = DateTime.UtcNow
                        };
                        await applicationDbContext.Faces.AddAsync(face);
                        await applicationDbContext.SaveChangesAsync(); // Save to get the face ID
                        
                        // Generate thumbnail for the face
                        try
                        {
                            await photoService.GetFaceThumbnail(face, image);
                            logger.LogDebug("Generated thumbnail for face {FaceId}", face.Id);
                        }
                        catch (Exception ex)
                        {
                            logger.LogWarning(ex, "Failed to generate thumbnail for face {FaceId}", face.Id);
                        }
                    }
                }

                photo.FaceDetectionStatus = FaceDetectionStatus.Completed;
                applicationDbContext.Photos.Update(photo);
                await applicationDbContext.SaveChangesAsync();

                return true;
            }
            catch (Exception ex)
            {
                photo.FaceDetectionStatus = FaceDetectionStatus.Failed;
                applicationDbContext.Photos.Update(photo);
                await applicationDbContext.SaveChangesAsync();
                logger.LogError(ex, "Error processing photo {PhotoId} for face detection", photo.Id);
                return false;
            }
        }

        public async Task<IEnumerable<Face>> GetSimilarFacesAsync(int galleryId, string name, int limit = 10)
        {
            var faceName = await applicationDbContext.FaceNames
                .FirstOrDefaultAsync(fn => fn.Name == name && fn.GalleryId == galleryId);
            if (faceName == null)
            {
                return Enumerable.Empty<Face>();
            }

            // Find similar unnamed faces using cosine similarity
            var unnamedFaces = await applicationDbContext.Faces.FromSql($@"SELECT f.""Id"", f.""CreatedAt"", f.""Embedding"", f.""FaceNameId"", f.""Height"", f.""NamedAt"", f.""PhotoId"", f.""Width"", f.""X"", f.""Y"", f.""Embedding"" AS c
    FROM ""Faces"" AS f
    LEFT JOIN ""FaceNames"" AS f0 ON f.""FaceNameId"" = f0.""Id""
	LEFT JOIN ""Photos"" AS ph ON f.""PhotoId"" = ph.""Id""
	LEFT JOIN ""PhotoDirectories"" AS d ON ph.""DirectoryId"" = d.""Id""
    WHERE f0.""Id"" IS NULL AND d.""GalleryId"" = {galleryId}
    ORDER BY f.""Embedding"" <=>(
		SELECT AVG(""Embedding"") FROM ""Faces"" WHERE ""FaceNameId"" = {faceName.Id}) ASC
    LIMIT 10").ToArrayAsync();

            return unnamedFaces;
        }

        public async Task<IEnumerable<Face>> GetUnnamedFacesSampleAsync(int galleryId, int count = 20)
        {
            var unnamedFaces = await applicationDbContext.Faces
                .Include(f => f.Photo)
                .Where(f => f.FaceName == null && f.Photo.Directory.GalleryId == galleryId)
                .OrderBy(f => f.Id)
                .Take(count)
                .ToListAsync();

            return unnamedFaces;
        }

        public async Task<bool> AssignNameToFaceAsync(Gallery gallery, int faceId, string name)
        {
            try
            {
                var face = await applicationDbContext.Faces.FindAsync(faceId);
                if (face == null)
                {
                    logger.LogWarning("Face {FaceId} not found", faceId);
                    return false;
                }

                // Find or create the FaceName
                var faceName = await applicationDbContext.FaceNames
                    .FirstOrDefaultAsync(fn => fn.Name == name && fn.GalleryId == gallery.Id);
                
                if (faceName == null)
                {
                    faceName = new FaceName { Name = name, Gallery = gallery, GalleryId = gallery.Id };
                    applicationDbContext.FaceNames.Add(faceName);
                    await applicationDbContext.SaveChangesAsync(); // Save to get the ID
                }

                face.FaceNameId = faceName.Id;
                face.NamedAt = DateTime.UtcNow;

                await applicationDbContext.SaveChangesAsync();
                logger.LogInformation("Assigned name '{Name}' to face {FaceId}", name, faceId);
                
                return true;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error assigning name to face {FaceId}", faceId);
                return false;
            }
        }

        /// <summary>
        /// Suggest a name for an unnamed face based on similarity with existing named faces.
        /// Returns null if no sufficiently similar name is found above the threshold.
        /// </summary>
        /// <param name="galleryId">Gallery ID</param>
        /// <param name="faceId">Face ID</param>
        /// <param name="threshold">Similarity threshold (0..1)</param>
        public async Task<FaceName?> SuggestNameForFaceAsync(int galleryId, int faceId, float threshold = 5f)
        {
            // Load target face with photo to ensure gallery match
            var targetFace = await applicationDbContext.Faces
                .Include(f => f.Photo)
                .FirstOrDefaultAsync(f => f.Id == faceId && f.Photo.Directory.GalleryId == galleryId);

            if (targetFace == null)
            {
                logger.LogDebug("SuggestName: face {FaceId} not found in gallery {GalleryId}", faceId, galleryId);
                return null;
            }

            // If already named, we don't suggest
            if (targetFace.FaceNameId != null)
            {
                logger.LogDebug("SuggestName: face {FaceId} already has a name", faceId);
                return null;
            }

            // Get all named faces in this gallery
            var namedFaces = await applicationDbContext.Faces
                .Include(f => f.FaceName)
                .Where(f => f.FaceNameId != null && f.Photo.Directory.GalleryId == galleryId && f.Embedding.L2Distance(targetFace.Embedding) < threshold)
                .OrderBy(x => x.Embedding.L2Distance(targetFace.Embedding))
                .Select(x => x.FaceName)
                .FirstOrDefaultAsync();

            return namedFaces;
        }

        /// <summary>
        /// Process unnamed faces and automatically assign names based on similarity with named faces.
        /// Returns the number of faces that were successfully auto-named.
        /// </summary>
        /// <param name="galleryId">Gallery ID to process faces for</param>
        /// <param name="threshold">Similarity threshold for auto-naming (L2 distance)</param>
        /// <param name="batchSize">Maximum number of faces to process in one call</param>
        /// <returns>Number of faces that were auto-named</returns>
        public async Task<int> AutoNameSimilarFacesAsync(int galleryId, float threshold = 0.6f, int batchSize = 10)
        {
            try
            {
                // Get unnamed faces from the gallery
                var unnamedFaces = await applicationDbContext.Faces
                    .Include(f => f.Photo)
                        .ThenInclude(p => p.Directory)
                    .Where(f => f.FaceNameId == null && f.Photo.Directory.GalleryId == galleryId)
                    .OrderBy(f => f.Id)
                    .Take(batchSize)
                    .ToListAsync();

                if (!unnamedFaces.Any())
                {
                    logger.LogDebug("No unnamed faces found for gallery {GalleryId}", galleryId);
                    return 0;
                }

                int namedCount = 0;

                foreach (var unnamedFace in unnamedFaces)
                {
                    try
                    {
                        // Find the most similar named face
                        var mostSimilarFace = await applicationDbContext.Faces
                            .Where(f => f.FaceNameId != null 
                                && f.Photo.Directory.GalleryId == galleryId 
                                && f.Embedding.L2Distance(unnamedFace.Embedding) < threshold)
                            .OrderBy(f => f.Embedding.L2Distance(unnamedFace.Embedding))
                            .FirstOrDefaultAsync();

                        if (mostSimilarFace != null)
                        {
                            unnamedFace.FaceNameId = mostSimilarFace.FaceNameId;
                            unnamedFace.AutoNamedFromFaceId = mostSimilarFace.Id;
                            unnamedFace.NamedAt = DateTime.UtcNow;
                            namedCount++;
                            
                            logger.LogInformation("Auto-assigned name '{Name}' to face {FaceId} from reference face {ReferenceFaceId} in gallery {GalleryId}", 
                                mostSimilarFace.FaceName?.Name, unnamedFace.Id, mostSimilarFace.Id, galleryId);
                        }
                    }
                    catch (Exception ex)
                    {
                        logger.LogError(ex, "Error processing unnamed face {FaceId} for auto-naming", unnamedFace.Id);
                    }
                }

                if (namedCount > 0)
                {
                    await applicationDbContext.SaveChangesAsync();
                    logger.LogInformation("Successfully auto-named {Count} faces in gallery {GalleryId}", namedCount, galleryId);
                }

                return namedCount;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error in AutoNameSimilarFacesAsync for gallery {GalleryId}", galleryId);
                return 0;
            }
        }
    }
}