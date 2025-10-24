using Galerie.Server.Controllers;
using GaleriePhotos;
using GaleriePhotos.Data;
using GaleriePhotos.Models;
using GaleriePhotos.Services;
using GaleriePhotos.ViewModels;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Xunit;

namespace GaleriePhotosTest.Controllers
{
    public class PhotoControllerTests : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly string _tempOriginals;
        private readonly string _tempThumbs;
        private readonly Gallery _gallery;
        private readonly PhotoDirectory _sourceDirectory;
        private readonly PhotoDirectory _targetDirectory;
        private readonly Photo _photo1;
        private readonly Photo _photo2;

        public PhotoControllerTests()
        {
            var options = new DbContextOptionsBuilder<TestApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            _context = new TestApplicationDbContext(options);

            _tempOriginals = Path.Combine(Path.GetTempPath(), "GaleriePhotos_Test_" + Guid.NewGuid());
            _tempThumbs = Path.Combine(Path.GetTempPath(), "GaleriePhotos_Thumbs_" + Guid.NewGuid());
            Directory.CreateDirectory(_tempOriginals);
            Directory.CreateDirectory(_tempThumbs);

            _gallery = new Gallery("Test Gallery", _tempOriginals, _tempThumbs, DataProviderType.FileSystem);
            _context.Galleries.Add(_gallery);
            _context.SaveChanges();

            _sourceDirectory = new PhotoDirectory("source", 0, null, null) { Gallery = _gallery };
            _targetDirectory = new PhotoDirectory("target", 0, null, null) { Gallery = _gallery };
            _context.PhotoDirectories.Add(_sourceDirectory);
            _context.PhotoDirectories.Add(_targetDirectory);
            _context.SaveChanges();

            // Create source directory on file system
            Directory.CreateDirectory(Path.Combine(_tempOriginals, "source"));
            Directory.CreateDirectory(Path.Combine(_tempOriginals, "target"));

            _photo1 = new Photo("photo1.jpg") { Directory = _sourceDirectory };
            _photo2 = new Photo("photo2.jpg") { Directory = _sourceDirectory };
            _context.Photos.Add(_photo1);
            _context.Photos.Add(_photo2);
            _context.SaveChanges();

            // Create actual files
            File.WriteAllText(Path.Combine(_tempOriginals, "source", "photo1.jpg"), "test photo 1");
            File.WriteAllText(Path.Combine(_tempOriginals, "source", "photo2.jpg"), "test photo 2");
        }

        public void Dispose()
        {
            _context?.Dispose();
            if (Directory.Exists(_tempOriginals))
                Directory.Delete(_tempOriginals, true);
            if (Directory.Exists(_tempThumbs))
                Directory.Delete(_tempThumbs, true);
        }

        private static ClaimsPrincipal BuildUser(string userId, bool globalAdmin = false)
        {
            var claims = new System.Collections.Generic.List<Claim>
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

        [Fact]
        public async Task MovePhotos_ReturnsBadRequest_WhenNoPhotosSpecified()
        {
            // Arrange
            var galleryService = new GalleryService(_context);
            var dataService = new DataService();
            var photoService = new PhotoService(
                Options.Create(new GalerieOptions()),
                _context,
                new TestLogger<PhotoService>(),
                dataService);
            var controller = new PhotoController(
                Options.Create(new GalerieOptions()),
                photoService,
                _context,
                dataService,
                galleryService);

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = BuildUser("user-1", globalAdmin: true) }
            };

            var viewModel = new PhotoMoveViewModel
            {
                PhotoIds = Array.Empty<int>(),
                TargetDirectoryId = _targetDirectory.Id
            };

            // Act
            var result = await controller.MovePhotos(_targetDirectory.GalleryId, viewModel);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task MovePhotos_ReturnsOk_WhenPhotosMovedSuccessfully()
        {
            // Arrange
            var galleryService = new GalleryService(_context);
            var dataService = new DataService();
            var photoService = new PhotoService(
                Options.Create(new GalerieOptions()),
                _context,
                new TestLogger<PhotoService>(),
                dataService);
            var controller = new PhotoController(
                Options.Create(new GalerieOptions()),
                photoService,
                _context,
                dataService,
                galleryService);

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = BuildUser("user-1", globalAdmin: true) }
            };

            var viewModel = new PhotoMoveViewModel
            {
                PhotoIds = new[] { _photo1.Id, _photo2.Id },
                TargetDirectoryId = _targetDirectory.Id
            };

            // Act
            var result = await controller.MovePhotos(_targetDirectory.GalleryId, viewModel);

            // Assert
            Assert.IsType<OkResult>(result);

            // Verify photos were moved in the database
            var movedPhotos = await _context.Photos
                .Where(p => p.Id == _photo1.Id || p.Id == _photo2.Id)
                .ToListAsync();

            Assert.All(movedPhotos, p => Assert.Equal(_targetDirectory.Id, p.DirectoryId));

            // Verify files were physically moved
            Assert.True(File.Exists(Path.Combine(_tempOriginals, "target", "photo1.jpg")));
            Assert.True(File.Exists(Path.Combine(_tempOriginals, "target", "photo2.jpg")));
            Assert.False(File.Exists(Path.Combine(_tempOriginals, "source", "photo1.jpg")));
            Assert.False(File.Exists(Path.Combine(_tempOriginals, "source", "photo2.jpg")));
        }

        [Fact]
        public async Task MovePhotos_ReturnsBadRequest_WhenTargetDirectoryDoesNotExist()
        {
            // Arrange
            var galleryService = new GalleryService(_context);
            var dataService = new DataService();
            var photoService = new PhotoService(
                Options.Create(new GalerieOptions()),
                _context,
                new TestLogger<PhotoService>(),
                dataService);
            var controller = new PhotoController(
                Options.Create(new GalerieOptions()),
                photoService,
                _context,
                dataService,
                galleryService);

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = BuildUser("user-1", globalAdmin: true) }
            };

            var viewModel = new PhotoMoveViewModel
            {
                PhotoIds = new[] { _photo1.Id },
                TargetDirectoryId = 99999 // Non-existent directory
            };

            // Act
            var result = await controller.MovePhotos(_targetDirectory.GalleryId, viewModel);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result);
        }
    }
}
