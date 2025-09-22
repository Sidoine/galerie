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
        private readonly IFaceDetector faceDetector;
        private readonly IFaceEmbeddingsGenerator faceEmbeddingsGenerator;

        public FaceDetectionService(
            ApplicationDbContext applicationDbContext,
            ILogger<FaceDetectionService> logger,
            DataService dataService)
        {
            this.applicationDbContext = applicationDbContext;
            this.logger = logger;
            this.dataService = dataService;

            // TODO: Initialize FaceAiSharp components when API is confirmed
            faceDetector = FaceAiSharpBundleFactory.CreateFaceDetectorWithLandmarks();
            faceEmbeddingsGenerator = FaceAiSharpBundleFactory.CreateFaceEmbeddingsGenerator();
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
            // Get all named faces for the given name
            var namedFaces = await applicationDbContext.Faces
                .Include(f => f.Photo)
                .Include(f => f.FaceName)
                .Where(f => f.FaceName != null && f.FaceName.Name == name && f.Photo.Directory.GalleryId == galleryId)
                .ToListAsync();

            if (!namedFaces.Any())
            {
                return Enumerable.Empty<Face>();
            }

            // Calculate average embedding for the named faces
            var avgEmbedding = CalculateAverageEmbedding(namedFaces.Select(f => f.Embedding));

            // Find similar unnamed faces using cosine similarity
            var unnamedFaces = await applicationDbContext.Faces
                .Include(f => f.Photo)
                .Where(f => f.FaceName == null)
                .ToListAsync();

            // Calculate similarities in memory (for simplicity)
            var similarities = unnamedFaces
                .Select(f => new { Face = f, Similarity = CalculateCosineSimilarity(f.Embedding, avgEmbedding) })
                .OrderByDescending(x => x.Similarity)
                .Take(limit)
                .Select(x => x.Face);

            return similarities;
        }

        public async Task<IEnumerable<Face>> GetUnnamedFacesSampleAsync(int galleryId, int count = 20)
        {
            var unnamedFaces = await applicationDbContext.Faces
                .Include(f => f.Photo)
                .Where(f => f.FaceName == null && f.Photo.Directory.GalleryId == galleryId)
                .OrderBy(f => Guid.NewGuid()) // Random sample
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
                    .FirstOrDefaultAsync(fn => fn.Name == name);
                
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

        private Vector CalculateAverageEmbedding(IEnumerable<Vector> embeddings)
        {
            var embeddingsList = embeddings.ToList();
            if (!embeddingsList.Any())
            {
                throw new ArgumentException("No embeddings provided");
            }

            var dimension = embeddingsList.First().Memory.Length;
            var avgArray = new float[dimension];

            foreach (var embedding in embeddingsList)
            {
                var span = embedding.Memory.Span;
                for (int i = 0; i < dimension; i++)
                {
                    avgArray[i] += span[i];
                }
            }

            for (int i = 0; i < dimension; i++)
            {
                avgArray[i] /= embeddingsList.Count;
            }

            return new Vector(avgArray);
        }

        private float CalculateCosineSimilarity(Vector a, Vector b)
        {
            var spanA = a.Memory.Span;
            var spanB = b.Memory.Span;
            
            if (spanA.Length != spanB.Length)
            {
                throw new ArgumentException("Vectors must have the same dimension");
            }

            float dotProduct = 0;
            float normA = 0;
            float normB = 0;

            for (int i = 0; i < spanA.Length; i++)
            {
                dotProduct += spanA[i] * spanB[i];
                normA += spanA[i] * spanA[i];
                normB += spanB[i] * spanB[i];
            }

            return dotProduct / (float)(Math.Sqrt(normA) * Math.Sqrt(normB));
        }
    }
}