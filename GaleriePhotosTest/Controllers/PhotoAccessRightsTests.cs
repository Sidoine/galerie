using Galerie.Server.Controllers;
using Galerie.Server.ViewModels;
using GaleriePhotos;
using GaleriePhotos.Controllers;
using GaleriePhotos.Data;
using GaleriePhotos.Models;
using GaleriePhotos.Services;
using GaleriePhotos.ViewModels;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Pgvector;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Xunit;

namespace GaleriePhotosTest.Controllers
{
    /// <summary>
    /// Tests to verify that access rights (ApplyRights) are properly enforced in all photo list APIs
    /// </summary>
    public class PhotoAccessRightsTests : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly Gallery _gallery;
        private readonly ApplicationUser _adminUser;
        private readonly ApplicationUser _restrictedUser;
        private readonly ApplicationUser _unrestrictedUser;
        private readonly GalleryMember _adminMember;
        private readonly GalleryMember _restrictedMember;
        private readonly GalleryMember _unrestrictedMember;
        private readonly PhotoDirectory _publicDirectory;
        private readonly PhotoDirectory _restrictedDirectory;
        private readonly Photo _publicPhoto;
        private readonly Photo _restrictedPhoto;
        private readonly Place _place;
        private readonly FaceName _faceName;
        private readonly Face _face;

        public PhotoAccessRightsTests()
        {
            var options = new DbContextOptionsBuilder<TestApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            _context = new TestApplicationDbContext(options);

            // Create gallery
            _gallery = new Gallery("Test Gallery", "/test", "/test/thumbs", DataProviderType.FileSystem);
            _context.Galleries.Add(_gallery);
            _context.SaveChanges();

            // Create users
            _adminUser = new ApplicationUser { Id = "admin-user", UserName = "admin" };
            _restrictedUser = new ApplicationUser { Id = "restricted-user", UserName = "restricted" };
            _unrestrictedUser = new ApplicationUser { Id = "unrestricted-user", UserName = "unrestricted" };
            _context.Users.AddRange(_adminUser, _restrictedUser, _unrestrictedUser);
            _context.SaveChanges();

            // Create gallery members with different access rights
            // Visibility flags: 1 = public, 2 = restricted
            _adminMember = new GalleryMember(_gallery.Id, _adminUser.Id, 0, isAdministrator: true)
            {
                Gallery = _gallery,
                User = _adminUser
            };
            _restrictedMember = new GalleryMember(_gallery.Id, _restrictedUser.Id, 1, isAdministrator: false) // Can only see public (1)
            {
                Gallery = _gallery,
                User = _restrictedUser
            };
            _unrestrictedMember = new GalleryMember(_gallery.Id, _unrestrictedUser.Id, 3, isAdministrator: false) // Can see both (1 | 2 = 3)
            {
                Gallery = _gallery,
                User = _unrestrictedUser
            };
            _context.GalleryMembers.AddRange(_adminMember, _restrictedMember, _unrestrictedMember);
            _context.SaveChanges();

            // Create directories with different visibility
            _publicDirectory = new PhotoDirectory("public", 1, null, null) { Gallery = _gallery };
            _restrictedDirectory = new PhotoDirectory("restricted", 2, null, null) { Gallery = _gallery };
            _context.PhotoDirectories.AddRange(_publicDirectory, _restrictedDirectory);
            _context.SaveChanges();

            // Create photos
            _publicPhoto = new Photo("public.jpg") { Directory = _publicDirectory, DateTime = DateTime.UtcNow };
            _restrictedPhoto = new Photo("restricted.jpg") { Directory = _restrictedDirectory, DateTime = DateTime.UtcNow };
            _context.Photos.AddRange(_publicPhoto, _restrictedPhoto);
            _context.SaveChanges();

            // Create a place for PlaceController tests
            _place = new Place("Test Place", 0, 0)
            {
                Gallery = _gallery,
                GalleryId = _gallery.Id,
                Type = PlaceType.City
            };
            _context.Places.Add(_place);
            _context.SaveChanges();

            // Assign photos to place
            _publicPhoto.PlaceId = _place.Id;
            _restrictedPhoto.PlaceId = _place.Id;
            _context.SaveChanges();

            // Create face name and face for FaceController tests
            _faceName = new FaceName
            {
                Name = "Test Person",
                GalleryId = _gallery.Id,
                Gallery = _gallery
            };
            _context.FaceNames.Add(_faceName);
            _context.SaveChanges();

            _face = new Face
            {
                PhotoId = _publicPhoto.Id,
                Photo = _publicPhoto,
                FaceNameId = _faceName.Id,
                FaceName = _faceName,
                X = 0,
                Y = 0,
                Width = 100,
                Height = 100,
                Embedding = new Vector(new float[512])
            };
            _context.Faces.Add(_face);
            _context.SaveChanges();

            // Create a favorite for FavoriteController tests
            var favorite = new PhotoFavorite(_publicPhoto.Id, _restrictedUser.Id);
            _context.PhotoFavorites.Add(favorite);
            _context.SaveChanges();
        }

        public void Dispose()
        {
            _context?.Dispose();
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

        [Fact]
        public async Task DirectoryController_GetPhotos_RespectsAccessRights()
        {
            // Arrange
            var photoService = new PhotoService(
                Options.Create(new GalerieOptions()),
                _context,
                new TestLogger<PhotoService>(),
                new DataService());
            var directoryService = new DirectoryService(_context, new DataService());
            var controller = new DirectoryController(photoService, _context, directoryService)
            {
                ControllerContext = new ControllerContext
                {
                    HttpContext = new DefaultHttpContext { User = BuildUser(_restrictedUser.Id) }
                }
            };

            // Act - restricted user queries photos from restricted directory
            var result = await controller.GetPhotos(_restrictedDirectory.Id);

            // Assert - should be forbidden since restricted user cannot access this directory
            Assert.IsType<ForbidResult>(result.Result);
        }

        [Fact]
        public async Task DirectoryController_GetPhotos_AdminCanSeeAll()
        {
            // Arrange
            var photoService = new PhotoService(
                Options.Create(new GalerieOptions()),
                _context,
                new TestLogger<PhotoService>(),
                new DataService());
            var directoryService = new DirectoryService(_context, new DataService());
            var controller = new DirectoryController(photoService, _context, directoryService)
            {
                ControllerContext = new ControllerContext
                {
                    HttpContext = new DefaultHttpContext { User = BuildUser(_adminUser.Id) }
                }
            };

            // Act - admin user queries photos from restricted directory
            var result = await controller.GetPhotos(_restrictedDirectory.Id);

            // Assert - admin should see the photo
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var photos = Assert.IsAssignableFrom<IEnumerable<PhotoViewModel>>(okResult.Value);
            Assert.Single(photos);
        }

        [Fact]
        public async Task GalleryController_GetPhotos_FiltersPhotosByAccessRights()
        {
            // Arrange
            var galleryService = new GalleryService(_context);
            var controller = new GalleryController(_context, galleryService)
            {
                ControllerContext = new ControllerContext
                {
                    HttpContext = new DefaultHttpContext { User = BuildUser(_restrictedUser.Id) }
                }
            };

            // Act - restricted user queries all photos in gallery
            var result = await controller.GetPhotos(_gallery.Id);

            // Assert - should only see public photo
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var photos = Assert.IsAssignableFrom<PhotoViewModel[]>(okResult.Value);
            Assert.Single(photos);
            Assert.Equal(_publicPhoto.Id, photos[0].Id);
        }

        [Fact]
        public async Task GalleryController_GetPhotos_UnrestrictedUserSeesAll()
        {
            // Arrange
            var galleryService = new GalleryService(_context);
            var controller = new GalleryController(_context, galleryService)
            {
                ControllerContext = new ControllerContext
                {
                    HttpContext = new DefaultHttpContext { User = BuildUser(_unrestrictedUser.Id) }
                }
            };

            // Act - unrestricted user queries all photos in gallery
            var result = await controller.GetPhotos(_gallery.Id);

            // Assert - should see both photos
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var photos = Assert.IsAssignableFrom<PhotoViewModel[]>(okResult.Value);
            Assert.Equal(2, photos.Length);
        }

        [Fact(Skip = "HttpClient dependency causes issues in test environment")]
        public async Task PlaceController_GetPlacePhotos_FiltersPhotosByAccessRights()
        {
            // Arrange
            var httpClient = new HttpClient();
            var placeService = new PlaceService(_context, new TestLogger<PlaceService>(), httpClient);
            var galleryService = new GalleryService(_context);
            var controller = new PlaceController(
                placeService,
                new TestLogger<PlaceController>(),
                galleryService,
                _context)
            {
                ControllerContext = new ControllerContext
                {
                    HttpContext = new DefaultHttpContext { User = BuildUser(_restrictedUser.Id) }
                }
            };

            // Act - restricted user queries photos for a place
            var result = await controller.GetPlacePhotos(_place.Id);

            // Assert - should only see public photo
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var photos = Assert.IsAssignableFrom<PhotoViewModel[]>(okResult.Value);
            Assert.Single(photos);
            Assert.Equal(_publicPhoto.Id, photos[0].Id);
        }

        [Fact]
        public async Task FaceController_GetPhotosByFaceName_FiltersPhotosByAccessRights()
        {
            // Arrange
            // Add a face to restricted photo as well
            var restrictedFace = new Face
            {
                PhotoId = _restrictedPhoto.Id,
                Photo = _restrictedPhoto,
                FaceNameId = _faceName.Id,
                FaceName = _faceName,
                X = 0,
                Y = 0,
                Width = 100,
                Height = 100,
                Embedding = new Vector(new float[512])
            };
            _context.Faces.Add(restrictedFace);
            _context.SaveChanges();

            var dataService = new DataService();
            var photoService = new PhotoService(
                Options.Create(new GalerieOptions()),
                _context,
                new TestLogger<PhotoService>(),
                dataService);
            var faceDetectionService = new FaceDetectionService(
                _context,
                new TestLogger<FaceDetectionService>(),
                dataService,
                photoService);
            var galleryService = new GalleryService(_context);
            var controller = new FaceController(
                _context,
                faceDetectionService,
                galleryService,
                photoService)
            {
                ControllerContext = new ControllerContext
                {
                    HttpContext = new DefaultHttpContext { User = BuildUser(_restrictedUser.Id) }
                }
            };

            // Act - restricted user queries photos by face name
            var result = await controller.GetPhotosByFaceName(_gallery.Id, _faceName.Id);

            // Assert - should only see public photo
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var photos = Assert.IsAssignableFrom<PhotoViewModel[]>(okResult.Value);
            Assert.Single(photos);
            Assert.Equal(_publicPhoto.Id, photos[0].Id);
        }

        [Fact]
        public async Task FavoriteController_GetFavoritePhotos_FiltersPhotosByAccessRights()
        {
            // Arrange
            // Add restricted photo as favorite
            var restrictedFavorite = new PhotoFavorite(_restrictedPhoto.Id, _restrictedUser.Id);
            _context.PhotoFavorites.Add(restrictedFavorite);
            _context.SaveChanges();

            var galleryService = new GalleryService(_context);
            var controller = new FavoriteController(
                _context,
                new TestLogger<FavoriteController>(),
                galleryService)
            {
                ControllerContext = new ControllerContext
                {
                    HttpContext = new DefaultHttpContext { User = BuildUser(_restrictedUser.Id) }
                }
            };

            // Act - restricted user queries their favorite photos
            var result = await controller.GetFavoritePhotos(_gallery.Id);

            // Assert - should only see public photo (even though both are favorites)
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var photos = Assert.IsAssignableFrom<PhotoViewModel[]>(okResult.Value);
            Assert.Single(photos);
            Assert.Equal(_publicPhoto.Id, photos[0].Id);
        }

        [Fact]
        public async Task SearchController_GetPhotos_FiltersPhotosByAccessRights()
        {
            // Arrange
            var galleryService = new GalleryService(_context);
            var controller = new SearchController(_context, galleryService)
            {
                ControllerContext = new ControllerContext
                {
                    HttpContext = new DefaultHttpContext { User = BuildUser(_restrictedUser.Id) }
                }
            };

            // Act - search with a year query (both photos have same year)
            var result = await controller.GetPhotos(_gallery.Id, DateTime.UtcNow.Year.ToString());

            // Assert - should only see public photo
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var photos = Assert.IsAssignableFrom<PhotoViewModel[]>(okResult.Value);
            Assert.Single(photos);
            Assert.Equal(_publicPhoto.Id, photos[0].Id);
        }

        [Fact]
        public async Task SearchController_GetSummary_CountsOnlyAccessiblePhotos()
        {
            // Arrange
            var galleryService = new GalleryService(_context);
            var controller = new SearchController(_context, galleryService)
            {
                ControllerContext = new ControllerContext
                {
                    HttpContext = new DefaultHttpContext { User = BuildUser(_restrictedUser.Id) }
                }
            };

            // Act - search summary with a year query
            var result = await controller.GetSummary(_gallery.Id, DateTime.UtcNow.Year.ToString());

            // Assert - should count only public photo
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var summary = Assert.IsType<SearchResultFullViewModel>(okResult.Value);
            Assert.Equal(1, summary.NumberOfPhotos);
        }
    }
}
