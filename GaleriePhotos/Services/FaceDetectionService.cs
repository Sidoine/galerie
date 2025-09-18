using GaleriePhotos.Data;
using GaleriePhotos.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;
using FaceAiSharp;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Pgvector;

namespace GaleriePhotos.Services
{
    public class FaceDetectionService
    {
        private readonly ApplicationDbContext applicationDbContext;
        private readonly ILogger<FaceDetectionService> logger;
        private readonly DataService dataService;
        // TODO: Re-enable FaceAiSharp when the correct API is identified
        // private readonly FaceDetector faceDetector;
        // private readonly FaceEmbeddingsGenerator embeddingsGenerator;

        public FaceDetectionService(
            ApplicationDbContext applicationDbContext,
            ILogger<FaceDetectionService> logger,
            DataService dataService)
        {
            this.applicationDbContext = applicationDbContext;
            this.logger = logger;
            this.dataService = dataService;
            
            // TODO: Initialize FaceAiSharp components when API is confirmed
            // this.faceDetector = new FaceDetector();
            // this.embeddingsGenerator = new FaceEmbeddingsGenerator();
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
                    return false;
                }

                // Check if faces have already been processed for this photo
                var existingFaces = await applicationDbContext.Faces
                    .Where(f => f.PhotoId == photo.Id)
                    .AnyAsync();

                if (existingFaces)
                {
                    logger.LogDebug("Photo {PhotoId} already has faces processed", photo.Id);
                    return false;
                }

                // Get the photo directory
                var photoDirectory = await applicationDbContext.PhotoDirectories
                    .Include(pd => pd.Gallery)
                    .FirstOrDefaultAsync(pd => pd.GalleryId == photo.GalleryId);

                if (photoDirectory == null)
                {
                    logger.LogWarning("Photo directory not found for photo {PhotoId}", photo.Id);
                    return false;
                }

                var dataProvider = dataService.GetDataProvider(photoDirectory.Gallery);
                
                // Open the photo file
                using var fileStream = await dataProvider.OpenFileRead(photoDirectory, photo);
                if (fileStream == null)
                {
                    logger.LogWarning("Could not open file {FileName} for photo {PhotoId}", photo.FileName, photo.Id);
                    return false;
                }

                // Load the image
                using var image = Image.Load<Rgb24>(fileStream);
                
                // TODO: Implement actual face detection with FaceAiSharp
                // For now, this is a placeholder that logs the action
                logger.LogInformation("Face detection processing photo {PhotoId} - FaceAiSharp integration pending", photo.Id);
                
                // Placeholder - in actual implementation, this would detect faces and create Face entities
                // var detectedFaces = faceDetector.DetectFaces(image);
                // Process each detected face and save to database
                
                return true;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error processing photo {PhotoId} for face detection", photo.Id);
                return false;
            }
        }

        public async Task<IEnumerable<Face>> GetSimilarFacesAsync(string name, int limit = 10)
        {
            // Get all named faces for the given name
            var namedFaces = await applicationDbContext.Faces
                .Include(f => f.Photo)
                .Include(f => f.FaceName)
                .Where(f => f.FaceName != null && f.FaceName.Name == name)
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

        public async Task<IEnumerable<Face>> GetUnnamedFacesSampleAsync(int count = 20)
        {
            var unnamedFaces = await applicationDbContext.Faces
                .Include(f => f.Photo)
                .Where(f => f.FaceName == null)
                .OrderBy(f => Guid.NewGuid()) // Random sample
                .Take(count)
                .ToListAsync();

            return unnamedFaces;
        }

        public async Task<bool> AssignNameToFaceAsync(int faceId, string name)
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
                    faceName = new FaceName { Name = name };
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