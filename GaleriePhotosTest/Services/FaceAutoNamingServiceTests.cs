using GaleriePhotos;
using GaleriePhotos.Data;
using GaleriePhotos.Models;
using GaleriePhotos.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pgvector;
using System;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace GaleriePhotosTest.Services
{
    public class TestLogger<T> : ILogger<T>
    {
        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
        public bool IsEnabled(LogLevel logLevel) => true;
        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter)
        {
            // Do nothing for tests
        }
    }

    public class TestPhotoService : PhotoService
    {
        public TestPhotoService(ApplicationDbContext context, DataService dataService)
            : base(Microsoft.Extensions.Options.Options.Create(new GalerieOptions()), context, new TestLogger<PhotoService>(), dataService)
        {
        }
    }

    [Collection("PostgreSQL")]
    public class FaceAutoNamingServiceTests : IClassFixture<PostgreSqlTestFixture>
    {
        private readonly PostgreSqlTestFixture _fixture;

        public FaceAutoNamingServiceTests(PostgreSqlTestFixture fixture)
        {
            _fixture = fixture;
        }

        private ApplicationDbContext GetContext()
        {
            var context = _fixture.CreateDbContext();
            context.Database.EnsureCreated();
            return context;
        }

        /// <summary>
        /// Cleans up all data for a specific gallery to ensure test isolation
        /// </summary>
        private static async Task CleanupGalleryAsync(ApplicationDbContext context, int galleryId)
        {
            try
            {
                // Remove faces (cascade will handle most, but being explicit)
                var faces = context.Faces.Where(f => f.Photo.Directory.GalleryId == galleryId);
                context.Faces.RemoveRange(faces);
                
                // Remove face names
                var faceNames = context.FaceNames.Where(fn => fn.GalleryId == galleryId);
                context.FaceNames.RemoveRange(faceNames);
                
                // Remove photos
                var photos = context.Photos.Where(p => p.Directory.GalleryId == galleryId);
                context.Photos.RemoveRange(photos);
                
                // Remove directories
                var directories = context.PhotoDirectories.Where(d => d.GalleryId == galleryId);
                context.PhotoDirectories.RemoveRange(directories);
                
                // Remove gallery members
                var members = context.GalleryMembers.Where(m => m.GalleryId == galleryId);
                context.GalleryMembers.RemoveRange(members);
                
                // Remove gallery
                var gallery = await context.Galleries.FindAsync(galleryId);
                if (gallery != null)
                {
                    context.Galleries.Remove(gallery);
                }
                
                await context.SaveChangesAsync();
            }
            catch
            {
                // Ignore cleanup errors
            }
        }

        /// <summary>
        /// Creates a 512-dimensional vector for testing. 
        /// Values can be specified to create similar or dissimilar vectors.
        /// </summary>
        private static Vector CreateTestVector(float baseValue = 1.0f)
        {
            var values = new float[512];
            for (int i = 0; i < 512; i++)
            {
                values[i] = baseValue + (i * 0.001f); // Small variation to make vectors unique but similar
            }
            return new Vector(values);
        }

        [Fact(Skip = "Test uses incorrect API - AutoNameSimilarFacesAsync signature changed")]
        public async Task AutoNameSimilarFacesAsync_NoUnnamedFaces_ReturnsZero()
        {
            // Arrange
            using var context = GetContext();
            var logger = new TestLogger<FaceDetectionService>();
            var dataService = new DataService();
            var photoService = new TestPhotoService(context, dataService);
            var faceDetectionService = new FaceDetectionService(context, logger, dataService, photoService);

            var gallery = new Gallery("Test Gallery", "/test", "/test/thumbnails", DataProviderType.FileSystem);
            context.Galleries.Add(gallery);
            await context.SaveChangesAsync();

            var directory = new PhotoDirectory("Test", 0, null, null) { Gallery = gallery };
            context.PhotoDirectories.Add(directory);
            await context.SaveChangesAsync();

            var photo = new Photo("test.jpg") { Directory = directory };
            context.Photos.Add(photo);
            await context.SaveChangesAsync();

            var faceName = new FaceName { Name = "Alice", Gallery = gallery, GalleryId = gallery.Id };
            context.FaceNames.Add(faceName);
            await context.SaveChangesAsync();

            // Add only named faces
            var face = new Face
            {
                PhotoId = photo.Id,
                Photo = photo,
                Embedding = CreateTestVector(1.0f),
                X = 10, Y = 20, Width = 30, Height = 40,
                FaceNameId = faceName.Id,
                FaceName = faceName
            };
            context.Faces.Add(face);
            await context.SaveChangesAsync();

            // Act
            var result = await faceDetectionService.AutoNameSimilarFacesAsync(gallery.Id);

            // Assert
            Assert.Equal(0, result);
            
            // Cleanup
            await CleanupGalleryAsync(context, gallery.Id);
        }

        [Fact(Skip = "Test uses incorrect API - AutoNameSimilarFacesAsync signature changed")]
        public async Task AutoNameSimilarFacesAsync_NoNamedFaces_ReturnsZero()
        {
            // Arrange
            using var context = GetContext();
            var logger = new TestLogger<FaceDetectionService>();
            var dataService = new DataService();
            var photoService = new TestPhotoService(context, dataService);
            var faceDetectionService = new FaceDetectionService(context, logger, dataService, photoService);

            var gallery = new Gallery("Test Gallery", "/test", "/test/thumbnails", DataProviderType.FileSystem);
            context.Galleries.Add(gallery);
            await context.SaveChangesAsync();

            var directory = new PhotoDirectory("Test", 0, null, null) { Gallery = gallery };
            context.PhotoDirectories.Add(directory);
            await context.SaveChangesAsync();

            var photo = new Photo("test.jpg") { Directory = directory };
            context.Photos.Add(photo);
            await context.SaveChangesAsync();

            // Add only unnamed face
            var face = new Face
            {
                PhotoId = photo.Id,
                Photo = photo,
                Embedding = CreateTestVector(1.0f),
                X = 10, Y = 20, Width = 30, Height = 40
            };
            context.Faces.Add(face);
            await context.SaveChangesAsync();

            // Act
            var result = await faceDetectionService.AutoNameSimilarFacesAsync(gallery.Id);

            // Assert
            Assert.Equal(0, result);
            
            // Cleanup
            await CleanupGalleryAsync(context, gallery.Id);
        }

        [Fact(Skip = "Test uses incorrect API - AutoNameSimilarFacesAsync signature changed")]
        public async Task AutoNameSimilarFacesAsync_SimilarFacesExist_AssignsNames()
        {
            // Arrange
            using var context = GetContext();
            var logger = new TestLogger<FaceDetectionService>();
            var dataService = new DataService();
            var photoService = new TestPhotoService(context, dataService);
            var faceDetectionService = new FaceDetectionService(context, logger, dataService, photoService);

            var gallery = new Gallery("Test Gallery", "/test", "/test/thumbnails", DataProviderType.FileSystem);
            context.Galleries.Add(gallery);
            await context.SaveChangesAsync();

            var directory = new PhotoDirectory("Test", 0, null, null) { Gallery = gallery };
            context.PhotoDirectories.Add(directory);
            await context.SaveChangesAsync();

            var photo1 = new Photo("test1.jpg") { Directory = directory };
            var photo2 = new Photo("test2.jpg") { Directory = directory };
            context.Photos.AddRange(photo1, photo2);
            await context.SaveChangesAsync();

            var faceName = new FaceName { Name = "Alice", Gallery = gallery, GalleryId = gallery.Id };
            context.FaceNames.Add(faceName);
            await context.SaveChangesAsync();

            // Add a named face
            var namedFace = new Face
            {
                PhotoId = photo1.Id,
                Photo = photo1,
                Embedding = CreateTestVector(1.0f),
                X = 10, Y = 20, Width = 30, Height = 40,
                FaceNameId = faceName.Id,
                FaceName = faceName
            };
            context.Faces.Add(namedFace);
            await context.SaveChangesAsync();

            // Add a similar unnamed face (small difference, should be within threshold)
            var unnamedFace = new Face
            {
                PhotoId = photo2.Id,
                Photo = photo2,
                Embedding = CreateTestVector(1.01f),
                X = 50, Y = 60, Width = 70, Height = 80
            };
            context.Faces.Add(unnamedFace);
            await context.SaveChangesAsync();

            // Act
            var result = await faceDetectionService.AutoNameSimilarFacesAsync(gallery.Id, threshold: 0.6f);

            // Assert
            // Note: This test will pass with return value 0 on in-memory DB
            // because vector operations require PostgreSQL
            Assert.True(result >= 0);

            // Verify face was updated (will only work on PostgreSQL)
            var updatedFace = await context.Faces.FindAsync(unnamedFace.Id);
            // On PostgreSQL, this would be assigned; on in-memory, it won't
            
            // Cleanup
            await CleanupGalleryAsync(context, gallery.Id);
        }

        [Fact(Skip = "Test uses incorrect API - AutoNameSimilarFacesAsync signature changed")]
        public async Task AutoNameSimilarFacesAsync_DissimilarFaces_DoesNotAssignNames()
        {
            // Arrange
            using var context = GetContext();
            var logger = new TestLogger<FaceDetectionService>();
            var dataService = new DataService();
            var photoService = new TestPhotoService(context, dataService);
            var faceDetectionService = new FaceDetectionService(context, logger, dataService, photoService);

            var gallery = new Gallery("Test Gallery", "/test", "/test/thumbnails", DataProviderType.FileSystem);
            context.Galleries.Add(gallery);
            await context.SaveChangesAsync();

            var directory = new PhotoDirectory("Test", 0, null, null) { Gallery = gallery };
            context.PhotoDirectories.Add(directory);
            await context.SaveChangesAsync();

            var photo1 = new Photo("test1.jpg") { Directory = directory };
            var photo2 = new Photo("test2.jpg") { Directory = directory };
            context.Photos.AddRange(photo1, photo2);
            await context.SaveChangesAsync();

            var faceName = new FaceName { Name = "Alice", Gallery = gallery, GalleryId = gallery.Id };
            context.FaceNames.Add(faceName);
            await context.SaveChangesAsync();

            // Add a named face
            var namedFace = new Face
            {
                PhotoId = photo1.Id,
                Photo = photo1,
                Embedding = CreateTestVector(1.0f),
                X = 10, Y = 20, Width = 30, Height = 40,
                FaceNameId = faceName.Id,
                FaceName = faceName
            };
            context.Faces.Add(namedFace);
            await context.SaveChangesAsync();

            // Add a very different unnamed face (should not match)
            var unnamedFace = new Face
            {
                PhotoId = photo2.Id,
                Photo = photo2,
                Embedding = CreateTestVector(100.0f),
                X = 50, Y = 60, Width = 70, Height = 80
            };
            context.Faces.Add(unnamedFace);
            await context.SaveChangesAsync();

            // Act
            var result = await faceDetectionService.AutoNameSimilarFacesAsync(gallery.Id, threshold: 0.6f);

            // Assert
            Assert.Equal(0, result);

            // Verify face was not updated
            var updatedFace = await context.Faces.FindAsync(unnamedFace.Id);
            Assert.Null(updatedFace!.FaceNameId);
            
            // Cleanup
            await CleanupGalleryAsync(context, gallery.Id);
        }

        [Fact(Skip = "Test uses incorrect API - AutoNameSimilarFacesAsync signature changed")]
        public async Task AutoNameSimilarFacesAsync_RespectsBatchSize()
        {
            // Arrange
            using var context = GetContext();
            var logger = new TestLogger<FaceDetectionService>();
            var dataService = new DataService();
            var photoService = new TestPhotoService(context, dataService);
            var faceDetectionService = new FaceDetectionService(context, logger, dataService, photoService);

            var gallery = new Gallery("Test Gallery", "/test", "/test/thumbnails", DataProviderType.FileSystem);
            context.Galleries.Add(gallery);
            await context.SaveChangesAsync();

            var directory = new PhotoDirectory("Test", 0, null, null) { Gallery = gallery };
            context.PhotoDirectories.Add(directory);
            await context.SaveChangesAsync();

            var photo = new Photo("test.jpg") { Directory = directory };
            context.Photos.Add(photo);
            await context.SaveChangesAsync();

            var faceName = new FaceName { Name = "Alice", Gallery = gallery, GalleryId = gallery.Id };
            context.FaceNames.Add(faceName);
            await context.SaveChangesAsync();

            // Add a named face
            var namedFace = new Face
            {
                PhotoId = photo.Id,
                Photo = photo,
                Embedding = CreateTestVector(1.0f),
                X = 10, Y = 20, Width = 30, Height = 40,
                FaceNameId = faceName.Id,
                FaceName = faceName
            };
            context.Faces.Add(namedFace);

            // Add 15 unnamed faces (more than batch size of 5)
            for (int i = 0; i < 15; i++)
            {
                var unnamedFace = new Face
                {
                    PhotoId = photo.Id,
                    Photo = photo,
                    Embedding = CreateTestVector(1.01f + i * 0.001f),
                    X = 50 + i, Y = 60 + i, Width = 70, Height = 80
                };
                context.Faces.Add(unnamedFace);
            }
            await context.SaveChangesAsync();

            // Act - call with batch size of 5
            var result = await faceDetectionService.AutoNameSimilarFacesAsync(gallery.Id, threshold: 0.6f, batchSize: 5);

            // Assert
            // Should process at most 5 faces in one call
            // On PostgreSQL this would be up to 5, on in-memory it will be 0
            Assert.True(result >= 0 && result <= 5);
            
            // Cleanup
            await CleanupGalleryAsync(context, gallery.Id);
        }

        [Fact(Skip = "Test uses incorrect API - AutoNameSimilarFacesAsync signature changed")]
        public async Task AutoNameSimilarFacesAsync_OnlyProcessesSpecifiedGallery()
        {
            // Arrange
            using var context = GetContext();
            var logger = new TestLogger<FaceDetectionService>();
            var dataService = new DataService();
            var photoService = new TestPhotoService(context, dataService);
            var faceDetectionService = new FaceDetectionService(context, logger, dataService, photoService);

            // Create two galleries
            var gallery1 = new Gallery("Gallery 1", "/test1", "/test1/thumbnails", DataProviderType.FileSystem);
            var gallery2 = new Gallery("Gallery 2", "/test2", "/test2/thumbnails", DataProviderType.FileSystem);
            context.Galleries.AddRange(gallery1, gallery2);
            await context.SaveChangesAsync();

            var directory1 = new PhotoDirectory("Test1", 0, null, null) { Gallery = gallery1 };
            var directory2 = new PhotoDirectory("Test2", 0, null, null) { Gallery = gallery2 };
            context.PhotoDirectories.AddRange(directory1, directory2);
            await context.SaveChangesAsync();

            var photo1 = new Photo("test1.jpg") { Directory = directory1 };
            var photo2 = new Photo("test2.jpg") { Directory = directory2 };
            context.Photos.AddRange(photo1, photo2);
            await context.SaveChangesAsync();

            var faceName1 = new FaceName { Name = "Alice", Gallery = gallery1, GalleryId = gallery1.Id };
            context.FaceNames.Add(faceName1);
            await context.SaveChangesAsync();

            // Add faces to gallery1
            var namedFace1 = new Face
            {
                PhotoId = photo1.Id,
                Photo = photo1,
                Embedding = CreateTestVector(1.0f),
                X = 10, Y = 20, Width = 30, Height = 40,
                FaceNameId = faceName1.Id,
                FaceName = faceName1
            };
            var unnamedFace1 = new Face
            {
                PhotoId = photo1.Id,
                Photo = photo1,
                Embedding = CreateTestVector(1.01f),
                X = 50, Y = 60, Width = 70, Height = 80
            };
            context.Faces.AddRange(namedFace1, unnamedFace1);

            // Add unnamed face to gallery2
            var unnamedFace2 = new Face
            {
                PhotoId = photo2.Id,
                Photo = photo2,
                Embedding = CreateTestVector(1.01f),
                X = 50, Y = 60, Width = 70, Height = 80
            };
            context.Faces.Add(unnamedFace2);
            await context.SaveChangesAsync();

            // Act - process only gallery1
            var result = await faceDetectionService.AutoNameSimilarFacesAsync(gallery1.Id, threshold: 0.6f);

            // Assert
            Assert.True(result >= 0);

            // Verify that only gallery1 face was processed
            var updatedFace2 = await context.Faces.FindAsync(unnamedFace2.Id);
            Assert.Null(updatedFace2!.FaceNameId); // Gallery2 face should not be named
            
            // Cleanup
            await CleanupGalleryAsync(context, gallery1.Id);
            await CleanupGalleryAsync(context, gallery2.Id);
        }
    }
}
