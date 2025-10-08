using GaleriePhotos;
using GaleriePhotos.Controllers;
using GaleriePhotos.Data;
using GaleriePhotos.Models;
using GaleriePhotos.Services;
using GaleriePhotos.ViewModels;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Pgvector;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Xunit;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace GaleriePhotosTest.Controllers
{
    public class TestPhotoService : PhotoService
    {
        public TestPhotoService(ApplicationDbContext context, DataService dataService) 
            : base(Microsoft.Extensions.Options.Options.Create(new GalerieOptions()), context, new TestLogger<PhotoService>(), dataService)
        {
        }
    }

    public class FaceControllerTests
    {
        private ApplicationDbContext GetInMemoryContext()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new ApplicationDbContext(options);
        }

        private static ClaimsPrincipal BuildUser(string userId, bool globalAdmin = false)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId)
            };
            if (globalAdmin)
            {
                claims.Add(new Claim(Claims.Administrator, true.ToString()));
            }
            var identity = new ClaimsIdentity(claims, "TestAuth");
            return new ClaimsPrincipal(identity);
        }

        [Fact(Skip = "Can only be run on PostgreSQL")]
        public async Task GetDistinctNames_ReturnsUniqueNames()
        {
            // Arrange
            using var context = GetInMemoryContext();
            var logger = new TestLogger<FaceDetectionService>();
            var dataService = new DataService();
            var photoService = new TestPhotoService(context, dataService);
            var faceDetectionService = new FaceDetectionService(context, logger, dataService, photoService);
            var galleryService = new GalleryService(context);
            var controller = new FaceController(context, faceDetectionService, galleryService, photoService);

            var userId = "user-1";

            // Add test data
            var gallery = new Gallery("Test Gallery", "/test", "/test/thumbnails", DataProviderType.FileSystem);
            context.Galleries.Add(gallery);
            await context.SaveChangesAsync();

            // User is simple member (GetNames requires member, not necessarily admin)
            var member = new GalleryMember(gallery.Id, userId, 0, isAdministrator: false);
            context.Add(member);
            await context.SaveChangesAsync();

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = BuildUser(userId) }
            };

            var directory = new PhotoDirectory("Test Directory", 0, null) { Gallery = gallery };
            context.PhotoDirectories.Add(directory);
            await context.SaveChangesAsync();

            var photo = new Photo("test.jpg") { Directory = directory };
            context.Photos.Add(photo);
            await context.SaveChangesAsync();

            // Create FaceNames
            var faceNameAlice = new FaceName { Name = "Alice", Gallery = gallery, GalleryId = gallery.Id };
            var faceNameBob = new FaceName { Name = "Bob", Gallery = gallery, GalleryId = gallery.Id };
            context.FaceNames.AddRange(faceNameAlice, faceNameBob);
            await context.SaveChangesAsync();

            var face1 = new Face
            {
                PhotoId = photo.Id,
                Photo = photo,
                Embedding = new Vector(new float[] { 1.0f, 2.0f }),
                X = 10, Y = 20, Width = 30, Height = 40,
                FaceNameId = faceNameAlice.Id,
                FaceName = faceNameAlice
            };
            var face2 = new Face
            {
                PhotoId = photo.Id,
                Photo = photo,
                Embedding = new Vector(new float[] { 3.0f, 4.0f }),
                X = 50, Y = 60, Width = 70, Height = 80,
                FaceNameId = faceNameBob.Id,
                FaceName = faceNameBob
            };
            var face3 = new Face
            {
                PhotoId = photo.Id,
                Photo = photo,
                Embedding = new Vector(new float[] { 5.0f, 6.0f }),
                X = 90, Y = 100, Width = 110, Height = 120,
                FaceNameId = faceNameAlice.Id,
                FaceName = faceNameAlice // Same name as face1
            };

            context.Faces.AddRange(face1, face2, face3);
            await context.SaveChangesAsync();

            // Act
            var result = await controller.GetNames(gallery.Id);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            // Le contrôleur retourne IEnumerable (Select) que nous matérialisons en tableau
            var names = ((IEnumerable<FaceNameViewModel>)okResult.Value!).ToArray();
            Assert.Equal(2, names.Length);
            Assert.Contains(names, n => n.Name == "Alice");
            Assert.Contains(names, n => n.Name == "Bob");
        }

        [Fact(Skip = "Can only be run on PostgreSQL")]
        public async Task GetFacesByPhoto_ReturnsCorrectFaces()
        {
            // Arrange
            using var context = GetInMemoryContext();
            var logger = new TestLogger<FaceDetectionService>();
            var dataService = new DataService();
            var photoService = new TestPhotoService(context, dataService);
            var faceDetectionService = new FaceDetectionService(context, logger, dataService, photoService);
            var galleryService = new GalleryService(context);
            var controller = new FaceController(context, faceDetectionService, galleryService, photoService);

            var userId = "user-2";

            // Add test data
            var gallery = new Gallery("Test Gallery", "/test", "/test/thumbnails", DataProviderType.FileSystem);
            context.Galleries.Add(gallery);

            var directory = new PhotoDirectory("/test", 0, null) { Gallery = gallery };
            context.PhotoDirectories.Add(directory);
            await context.SaveChangesAsync();

            // Member must be admin for GetFacesByPhoto (requires IsGalleryAdministrator)
            var adminMember = new GalleryMember(gallery.Id, userId, 0, isAdministrator: true);
            context.Add(adminMember);
            await context.SaveChangesAsync();

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = BuildUser(userId) }
            };

            var photo1 = new Photo("test1.jpg") { Directory = directory };
            var photo2 = new Photo("test2.jpg") { Directory = directory };
            context.Photos.AddRange(photo1, photo2);
            await context.SaveChangesAsync();

            var face1 = new Face
            {
                PhotoId = photo1.Id,
                Photo = photo1,
                Embedding = new Vector(new float[] { 1.0f, 2.0f }),
                X = 10, Y = 20, Width = 30, Height = 40
            };
            var face2 = new Face
            {
                PhotoId = photo2.Id,
                Photo = photo2,
                Embedding = new Vector(new float[] { 3.0f, 4.0f }),
                X = 50, Y = 60, Width = 70, Height = 80
            };

            context.Faces.AddRange(face1, face2);
            await context.SaveChangesAsync();

            // Act
            var result = await controller.GetFacesByPhoto(gallery.Id, photo1.Id);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var faces = Assert.IsType<FaceViewModel[]>(okResult.Value);
            Assert.Single(faces);
            Assert.Equal(photo1.Id, faces[0].PhotoId);
            Assert.Equal(10, faces[0].X);
        }

        [Fact(Skip = "Can only be run on PostgreSQL")]
        public async Task AssignName_UpdatesFaceName()
        {
            // Arrange
            using var context = GetInMemoryContext();
            var logger = new TestLogger<FaceDetectionService>();
            var dataService = new DataService();
            var photoService = new TestPhotoService(context, dataService);
            var faceDetectionService = new FaceDetectionService(context, logger, dataService, photoService);
            var galleryService = new GalleryService(context);
            var controller = new FaceController(context, faceDetectionService, galleryService, photoService);

            var userId = "user-3";

            // Add test data
            var gallery = new Gallery("Test Gallery", "/test", "/test/thumbnails", DataProviderType.FileSystem);
            context.Galleries.Add(gallery);
            var directory = new PhotoDirectory("/", 0, null) { Gallery = gallery };
            context.PhotoDirectories.Add(directory);
            var photo = new Photo("test.jpg") { Directory = directory };
            context.Photos.Add(photo);
            await context.SaveChangesAsync();

            var adminMember = new GalleryMember(gallery.Id, userId, 0, isAdministrator: true);
            context.Add(adminMember);
            await context.SaveChangesAsync();

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = BuildUser(userId) }
            };

            var face = new Face
            {
                PhotoId = photo.Id,
                Photo = photo,
                Embedding = new Vector(new float[] { 1.0f, 2.0f }),
                X = 10, Y = 20, Width = 30, Height = 40
            };
            context.Faces.Add(face);
            await context.SaveChangesAsync();

            // Act
            var model = new FaceAssignNameViewModel { Name = "TestName" };
            var result = await controller.AssignName(gallery.Id, face.Id, model);

            // Assert
            Assert.IsType<OkResult>(result);
            
            // Verify face was updated
            var updatedFace = await context.Faces
                .Include(f => f.FaceName)
                .FirstOrDefaultAsync(f => f.Id == face.Id);
            Assert.NotNull(updatedFace);
            Assert.NotNull(updatedFace.FaceName);
            Assert.Equal("TestName", updatedFace.FaceName.Name);
            Assert.NotNull(updatedFace.NamedAt);
        }

        [Fact(Skip = "Can only be run on PostgreSQL")]
        public async Task SuggestName_ReturnsNullWhenNoNamedFaces()
        {
            using var context = GetInMemoryContext();
            var logger = new TestLogger<FaceDetectionService>();
            var dataService = new DataService();
            var photoService = new TestPhotoService(context, dataService);
            var faceDetectionService = new FaceDetectionService(context, logger, dataService, photoService);
            var galleryService = new GalleryService(context);
            var controller = new FaceController(context, faceDetectionService, galleryService, photoService);

            var userId = "user-4";

            var gallery = new Gallery("Test Gallery", "/test", "/test/thumbnails", DataProviderType.FileSystem);
            context.Galleries.Add(gallery);
            var directory = new PhotoDirectory("", 0, null) { Gallery = gallery };
            context.PhotoDirectories.Add(directory);
            var photo = new Photo("test.jpg") { Directory = directory };
            context.Photos.Add(photo);
            await context.SaveChangesAsync();

            var adminMember = new GalleryMember(gallery.Id, userId, 0, isAdministrator: true);
            context.Add(adminMember);
            await context.SaveChangesAsync();

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = BuildUser(userId) }
            };

            var face = new Face
            {
                PhotoId = photo.Id,
                Photo = photo,
                Embedding = new Vector(new float[] { 0.11f, 0.22f }),
                X = 1, Y = 2, Width = 3, Height = 4
            };
            context.Faces.Add(face);
            await context.SaveChangesAsync();

            var response = await controller.SuggestName(gallery.Id, face.Id, new FaceNameSuggestionRequestViewModel { Threshold = 0.8f });
            var okResult = Assert.IsType<OkObjectResult>(response.Result);
            var vm = Assert.IsType<FaceNameSuggestionResponseViewModel>(okResult.Value);
            Assert.Null(vm.Name);
        }

    [Fact(Skip = "Can only be run on PostgreSQL")]
        public async Task DeleteFace_ReturnsNotFound_WhenGalleryDoesNotExist()
        {
            using var context = GetInMemoryContext();
            var logger = new TestLogger<FaceDetectionService>();
            var dataService = new DataService();
            var photoService = new TestPhotoService(context, dataService);
            var faceDetectionService = new FaceDetectionService(context, logger, dataService, photoService);
            var galleryService = new GalleryService(context);
            var controller = new FaceController(context, faceDetectionService, galleryService, photoService)
            {
                ControllerContext = new ControllerContext
                {
                    HttpContext = new DefaultHttpContext { User = BuildUser("user-x", globalAdmin: true) }
                }
            };

            var result = await controller.DeleteFace(12345, 1);
            Assert.IsType<NotFoundResult>(result);
        }

    [Fact(Skip = "Can only be run on PostgreSQL")]
        public async Task DeleteFace_ReturnsForbid_WhenUserNotGalleryAdmin()
        {
            using var context = GetInMemoryContext();
            var logger = new TestLogger<FaceDetectionService>();
            var dataService = new DataService();
            var photoService = new TestPhotoService(context, dataService);
            var faceDetectionService = new FaceDetectionService(context, logger, dataService, photoService);
            var galleryService = new GalleryService(context);
            var controller = new FaceController(context, faceDetectionService, galleryService, photoService);

            var userId = "user-not-admin";
            var gallery = new Gallery("Test Gallery", "/test", "/test/thumbnails", DataProviderType.FileSystem);
            context.Galleries.Add(gallery);
            await context.SaveChangesAsync();
            // Membre non admin
            context.Add(new GalleryMember(gallery.Id, userId, 0, isAdministrator: false));
            await context.SaveChangesAsync();

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = BuildUser(userId) }
            };

            var result = await controller.DeleteFace(gallery.Id, 999); // face inexistant
            Assert.IsType<ForbidResult>(result);
        }

    [Fact(Skip = "Can only be run on PostgreSQL")]
        public async Task DeleteFace_ReturnsNoContent_OnSuccess()
        {
            using var context = GetInMemoryContext();
            var logger = new TestLogger<FaceDetectionService>();
            var dataService = new DataService();
            var photoService = new TestPhotoService(context, dataService);
            var faceDetectionService = new FaceDetectionService(context, logger, dataService, photoService);
            var galleryService = new GalleryService(context);
            var controller = new FaceController(context, faceDetectionService, galleryService, photoService);

            var userId = "admin-user";
            var gallery = new Gallery("Test Gallery", "/test", "/test/thumbnails", DataProviderType.FileSystem);
            context.Galleries.Add(gallery);
            await context.SaveChangesAsync();
            context.Add(new GalleryMember(gallery.Id, userId, 0, isAdministrator: true));
            await context.SaveChangesAsync();

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = BuildUser(userId) }
            };

            var directory = new PhotoDirectory("/", 0, null) { Gallery = gallery };
            context.PhotoDirectories.Add(directory);
            var photo = new Photo("p.jpg") { Directory = directory };
            context.Photos.Add(photo);
            await context.SaveChangesAsync();
            var face = new Face
            {
                PhotoId = photo.Id,
                Photo = photo,
                Embedding = new Pgvector.Vector(new float[] { 0.1f, 0.2f }),
                X = 1, Y = 2, Width = 3, Height = 4
            };
            context.Faces.Add(face);
            await context.SaveChangesAsync();

            var result = await controller.DeleteFace(gallery.Id, face.Id);
            Assert.IsType<NoContentResult>(result);
            Assert.False(context.Faces.Any());
        }
    }

    // Simple test logger implementation
    public class TestLogger<T> : ILogger<T>
    {
        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
        public bool IsEnabled(LogLevel logLevel) => true;
        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter)
        {
            // Do nothing for tests
        }
    }
}