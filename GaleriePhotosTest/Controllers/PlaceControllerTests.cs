using Galerie.Server.Controllers;
using Galerie.Server.ViewModels;
using GaleriePhotos.Data;
using GaleriePhotos.Models;
using GaleriePhotos.Services;
using GaleriePhotos.ViewModels;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Net.Http;
using System.Security.Claims;
using System.Threading.Tasks;
using Xunit;

namespace GaleriePhotosTest.Controllers
{
    [Collection("PostgreSQL")]
    public class PlaceControllerTests : IClassFixture<PostgreSqlTestFixture>
    {
        private readonly PostgreSqlTestFixture _fixture;

        public PlaceControllerTests(PostgreSqlTestFixture fixture)
        {
            _fixture = fixture;
        }

        private ApplicationDbContext GetContext()
        {
            var context = _fixture.CreateDbContext();
            context.Database.EnsureCreated();
            return context;
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
        public async Task GetCountriesByGallery_ReturnsForbid_WhenUserNotGalleryMember()
        {
            // Arrange
            using var context = GetContext();
            using var transaction = await context.Database.BeginTransactionAsync();
            var logger = new TestLogger<PlaceController>();
            var httpClient = new HttpClient();
            var placeService = new PlaceService(context, new TestLogger<PlaceService>(), httpClient);
            var galleryService = new GalleryService(context);
            var controller = new PlaceController(placeService, logger, galleryService, context);

            var userId = "user-1";
            var otherUserId = "user-2";

            // Create gallery with other user as member
            var gallery = new Gallery("Test Gallery", "/test", "/test/thumbnails", DataProviderType.FileSystem);
            context.Galleries.Add(gallery);
            await context.SaveChangesAsync();

            var otherUser = new ApplicationUser { Id = otherUserId, UserName = otherUserId };
            context.Users.Add(otherUser);
            var member = new GalleryMember(gallery.Id, otherUserId, 0, isAdministrator: false)
            {
                Gallery = gallery,
                User = otherUser
            };
            context.Add(member);
            await context.SaveChangesAsync();

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = BuildUser(userId) }
            };

            // Act
            var result = await controller.GetCountriesByGallery(gallery.Id);

            // Assert
            Assert.IsType<ForbidResult>(result.Result);
            
            // Transaction will rollback on dispose
        }

        [Fact]
        public async Task GetCountriesByGallery_ReturnsOk_WhenUserIsGalleryMember()
        {
            // Arrange
            using var context = GetContext();
            using var transaction = await context.Database.BeginTransactionAsync();
            var logger = new TestLogger<PlaceController>();
            var httpClient = new HttpClient();
            var placeService = new PlaceService(context, new TestLogger<PlaceService>(), httpClient);
            var galleryService = new GalleryService(context);
            var controller = new PlaceController(placeService, logger, galleryService, context);

            var userId = "user-1";

            // Create gallery with user as member
            var gallery = new Gallery("Test Gallery", "/test", "/test/thumbnails", DataProviderType.FileSystem);
            context.Galleries.Add(gallery);
            await context.SaveChangesAsync();

            var user = new ApplicationUser { Id = userId, UserName = userId };
            context.Users.Add(user);
            var member = new GalleryMember(gallery.Id, userId, 0, isAdministrator: false)
            {
                Gallery = gallery,
                User = user
            };
            context.Add(member);
            await context.SaveChangesAsync();

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = BuildUser(userId) }
            };

            // Act
            var result = await controller.GetCountriesByGallery(gallery.Id);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
            
            // Transaction will rollback on dispose
        }

        [Fact]
        public async Task AssignPhotoToPlace_ReturnsForbid_WhenUserNotGalleryAdmin()
        {
            // Arrange
            using var context = GetContext();
            using var transaction = await context.Database.BeginTransactionAsync();
            var logger = new TestLogger<PlaceController>();
            var httpClient = new HttpClient();
            var placeService = new PlaceService(context, new TestLogger<PlaceService>(), httpClient);
            var galleryService = new GalleryService(context);
            var controller = new PlaceController(placeService, logger, galleryService, context);

            var userId = "user-1";

            // Create gallery with user as non-admin member
            var gallery = new Gallery("Test Gallery", "/test", "/test/thumbnails", DataProviderType.FileSystem);
            context.Galleries.Add(gallery);
            await context.SaveChangesAsync();

            var user = new ApplicationUser { Id = userId, UserName = userId };
            context.Users.Add(user);
            var member = new GalleryMember(gallery.Id, userId, 0, isAdministrator: false)
            {
                Gallery = gallery,
                User = user
            };
            context.Add(member);
            await context.SaveChangesAsync();

            // Create a place
            var place = new Place("Test Place", 0.0, 0.0) { Gallery = gallery, GalleryId = gallery.Id };
            context.Places.Add(place);
            await context.SaveChangesAsync();

            // Create a photo
            var directory = new PhotoDirectory("Test", 0, null, null) { Gallery = gallery, GalleryId = gallery.Id };
            context.PhotoDirectories.Add(directory);
            await context.SaveChangesAsync();

            var photo = new Photo("test.jpg") { Directory = directory, DirectoryId = directory.Id };
            context.Photos.Add(photo);
            await context.SaveChangesAsync();

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = BuildUser(userId) }
            };

            // Act
            var result = await controller.AssignPhotoToPlace(place.Id, photo.Id);

            // Assert
            Assert.IsType<ForbidResult>(result);
            
            // Transaction will rollback on dispose
        }

        [Fact]
        public async Task AssignPhotoToPlace_ReturnsOk_WhenUserIsGalleryAdmin()
        {
            // Arrange
            using var context = GetContext();
            using var transaction = await context.Database.BeginTransactionAsync();
            var logger = new TestLogger<PlaceController>();
            var httpClient = new HttpClient();
            var placeService = new PlaceService(context, new TestLogger<PlaceService>(), httpClient);
            var galleryService = new GalleryService(context);
            var controller = new PlaceController(placeService, logger, galleryService, context);

            var userId = "user-1";

            // Create gallery with user as admin member
            var gallery = new Gallery("Test Gallery", "/test", "/test/thumbnails", DataProviderType.FileSystem);
            context.Galleries.Add(gallery);
            await context.SaveChangesAsync();

            var user = new ApplicationUser { Id = userId, UserName = userId };
            context.Users.Add(user);
            var member = new GalleryMember(gallery.Id, userId, 0, isAdministrator: true)
            {
                Gallery = gallery,
                User = user
            };
            context.Add(member);
            await context.SaveChangesAsync();

            // Create a place
            var place = new Place("Test Place", 0.0, 0.0) { Gallery = gallery, GalleryId = gallery.Id };
            context.Places.Add(place);
            await context.SaveChangesAsync();

            // Create a photo
            var directory = new PhotoDirectory("Test", 0, null, null) { Gallery = gallery, GalleryId = gallery.Id };
            context.PhotoDirectories.Add(directory);
            await context.SaveChangesAsync();

            var photo = new Photo("test.jpg") { Directory = directory, DirectoryId = directory.Id };
            context.Photos.Add(photo);
            await context.SaveChangesAsync();

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = BuildUser(userId) }
            };

            // Act
            var result = await controller.AssignPhotoToPlace(place.Id, photo.Id);

            // Assert
            Assert.IsType<OkResult>(result);
            
            // Transaction will rollback on dispose
        }

        [Fact]
        public async Task GetPlacePhotos_ReturnsPhotosFromCities_WhenPlaceIsCountry()
        {
            // Arrange
            using var context = GetContext();
            using var transaction = await context.Database.BeginTransactionAsync();
            var logger = new TestLogger<PlaceController>();
            var httpClient = new HttpClient();
            var placeService = new PlaceService(context, new TestLogger<PlaceService>(), httpClient);
            var galleryService = new GalleryService(context);
            var controller = new PlaceController(placeService, logger, galleryService, context);

            var userId = "user-1";

            // Create gallery with user as member
            var gallery = new Gallery("Test Gallery", "/test", "/test/thumbnails", DataProviderType.FileSystem);
            context.Galleries.Add(gallery);
            await context.SaveChangesAsync();

            var user = new ApplicationUser { Id = userId, UserName = userId };
            context.Users.Add(user);
            var member = new GalleryMember(gallery.Id, userId, 1, isAdministrator: false) // DirectoryVisibility = 1 to see public directories
            {
                Gallery = gallery,
                User = user
            };
            context.Add(member);
            await context.SaveChangesAsync();

            // Create a country and a city within the country
            var country = new Place("France", 46.2276, 2.2137) 
            { 
                Gallery = gallery, 
                GalleryId = gallery.Id, 
                Type = PlaceType.Country 
            };
            context.Places.Add(country);
            await context.SaveChangesAsync();

            var city = new Place("Paris", 48.8566, 2.3522) 
            { 
                Gallery = gallery, 
                GalleryId = gallery.Id, 
                Type = PlaceType.City,
                ParentId = country.Id
            };
            context.Places.Add(city);
            await context.SaveChangesAsync();

            // Create photos
            var directory = new PhotoDirectory("Test", 1, null, null) { Gallery = gallery, GalleryId = gallery.Id }; // Visibility = 1 (public)
            context.PhotoDirectories.Add(directory);
            await context.SaveChangesAsync();

            var photoInCountry = new Photo("country.jpg") { Directory = directory, DirectoryId = directory.Id, PlaceId = country.Id };
            var photoInCity = new Photo("city.jpg") { Directory = directory, DirectoryId = directory.Id, PlaceId = city.Id };
            context.Photos.AddRange(photoInCountry, photoInCity);
            await context.SaveChangesAsync();

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = BuildUser(userId) }
            };

            // Act
            var result = await controller.GetPlacePhotos(country.Id);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var photos = Assert.IsAssignableFrom<System.Collections.Generic.IEnumerable<PhotoViewModel>>(okResult.Value);
            var photoList = photos.ToList();
            
            // Should return both country photo and city photo
            Assert.Equal(2, photoList.Count);
            Assert.Contains(photoList, p => p.Name == "country.jpg");
            Assert.Contains(photoList, p => p.Name == "city.jpg");
            
            // Transaction will rollback on dispose
        }

        [Fact]
        public async Task GetPlacePhotos_ReturnsOnlyCityPhotos_WhenPlaceIsCity()
        {
            // Arrange
            using var context = GetContext();
            using var transaction = await context.Database.BeginTransactionAsync();
            var logger = new TestLogger<PlaceController>();
            var httpClient = new HttpClient();
            var placeService = new PlaceService(context, new TestLogger<PlaceService>(), httpClient);
            var galleryService = new GalleryService(context);
            var controller = new PlaceController(placeService, logger, galleryService, context);

            var userId = "user-1";

            // Create gallery with user as member
            var gallery = new Gallery("Test Gallery", "/test", "/test/thumbnails", DataProviderType.FileSystem);
            context.Galleries.Add(gallery);
            await context.SaveChangesAsync();

            var user = new ApplicationUser { Id = userId, UserName = userId };
            context.Users.Add(user);
            var member = new GalleryMember(gallery.Id, userId, 1, isAdministrator: false) // DirectoryVisibility = 1 to see public directories
            {
                Gallery = gallery,
                User = user
            };
            context.Add(member);
            await context.SaveChangesAsync();

            // Create a country and a city within the country
            var country = new Place("France", 46.2276, 2.2137) 
            { 
                Gallery = gallery, 
                GalleryId = gallery.Id, 
                Type = PlaceType.Country 
            };
            context.Places.Add(country);
            await context.SaveChangesAsync();

            var city = new Place("Paris", 48.8566, 2.3522) 
            { 
                Gallery = gallery, 
                GalleryId = gallery.Id, 
                Type = PlaceType.City,
                ParentId = country.Id
            };
            context.Places.Add(city);
            await context.SaveChangesAsync();

            // Create photos
            var directory = new PhotoDirectory("Test", 1, null, null) { Gallery = gallery, GalleryId = gallery.Id }; // Visibility = 1 (public)
            context.PhotoDirectories.Add(directory);
            await context.SaveChangesAsync();

            var photoInCountry = new Photo("country.jpg") { Directory = directory, DirectoryId = directory.Id, PlaceId = country.Id };
            var photoInCity = new Photo("city.jpg") { Directory = directory, DirectoryId = directory.Id, PlaceId = city.Id };
            context.Photos.AddRange(photoInCountry, photoInCity);
            await context.SaveChangesAsync();

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = BuildUser(userId) }
            };

            // Act
            var result = await controller.GetPlacePhotos(city.Id);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var photos = Assert.IsAssignableFrom<System.Collections.Generic.IEnumerable<PhotoViewModel>>(okResult.Value);
            var photoList = photos.ToList();
            
            // Should return only city photo, not country photo
            Assert.Single(photoList);
            Assert.Equal("city.jpg", photoList[0].Name);
            
            // Transaction will rollback on dispose
        }

        [Fact]
        public async Task GetPlacePhotoCount_ReturnsCountFromCities_WhenPlaceIsCountry()
        {
            // Arrange
            using var context = GetContext();
            using var transaction = await context.Database.BeginTransactionAsync();
            var logger = new TestLogger<PlaceController>();
            var httpClient = new HttpClient();
            var placeService = new PlaceService(context, new TestLogger<PlaceService>(), httpClient);
            var galleryService = new GalleryService(context);
            var controller = new PlaceController(placeService, logger, galleryService, context);

            var userId = "user-1";

            // Create gallery with user as member
            var gallery = new Gallery("Test Gallery", "/test", "/test/thumbnails", DataProviderType.FileSystem);
            context.Galleries.Add(gallery);
            await context.SaveChangesAsync();

            var user = new ApplicationUser { Id = userId, UserName = userId };
            context.Users.Add(user);
            var member = new GalleryMember(gallery.Id, userId, 0, isAdministrator: false)
            {
                Gallery = gallery,
                User = user
            };
            context.Add(member);
            await context.SaveChangesAsync();

            // Create a country and a city within the country
            var country = new Place("France", 46.2276, 2.2137) 
            { 
                Gallery = gallery, 
                GalleryId = gallery.Id, 
                Type = PlaceType.Country 
            };
            context.Places.Add(country);
            await context.SaveChangesAsync();

            var city = new Place("Paris", 48.8566, 2.3522) 
            { 
                Gallery = gallery, 
                GalleryId = gallery.Id, 
                Type = PlaceType.City,
                ParentId = country.Id
            };
            context.Places.Add(city);
            await context.SaveChangesAsync();

            // Create photos
            var directory = new PhotoDirectory("Test", 0, null, null) { Gallery = gallery, GalleryId = gallery.Id };
            context.PhotoDirectories.Add(directory);
            await context.SaveChangesAsync();

            var photoInCountry = new Photo("country.jpg") { Directory = directory, DirectoryId = directory.Id, PlaceId = country.Id };
            var photoInCity1 = new Photo("city1.jpg") { Directory = directory, DirectoryId = directory.Id, PlaceId = city.Id };
            var photoInCity2 = new Photo("city2.jpg") { Directory = directory, DirectoryId = directory.Id, PlaceId = city.Id };
            context.Photos.AddRange(photoInCountry, photoInCity1, photoInCity2);
            await context.SaveChangesAsync();

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = BuildUser(userId) }
            };

            // Act
            var result = await controller.GetPlacePhotoCount(country.Id);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var count = Assert.IsType<int>(okResult.Value);
            
            // Should return count of both country photos and city photos (1 + 2 = 3)
            Assert.Equal(3, count);
            
            // Transaction will rollback on dispose
        }
    }
}
