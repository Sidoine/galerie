using Galerie.Server.Controllers;
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
    }
}
