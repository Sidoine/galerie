using GaleriePhotos.Controllers;
using GaleriePhotos.Data;
using GaleriePhotos.Models;
using GaleriePhotos.Services;
using GaleriePhotos.ViewModels;
using Galerie.Server.ViewModels;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Xunit;

namespace GaleriePhotosTest.Controllers
{
    public class GalleryControllerTests
    {
        private ApplicationDbContext GetInMemoryContext()
        {
            var options = new DbContextOptionsBuilder<TestApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new TestApplicationDbContext(options);
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
        public async Task GetSeafileApiKey_ReturnsForbid_WhenUserNotGalleryAdmin()
        {
            // Arrange
            using var context = GetInMemoryContext();
            var galleryService = new GalleryService(context);
            var controller = new GalleryController(context, galleryService);

            var userId = "user-1";

            // Create gallery with user as non-admin member
            var gallery = new Gallery("Test Gallery", "/test", "/test/thumbnails", DataProviderType.Seafile)
            {
                SeafileServerUrl = "https://seafile.example.com"
            };
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

            var request = new SeafileApiKeyRequest { Username = "test", Password = "test" };

            // Act
            var result = await controller.GetSeafileApiKey(gallery.Id, request);

            // Assert
            Assert.IsType<ForbidResult>(result.Result);
        }

        [Fact]
        public async Task GetSeafileApiKey_AllowsGalleryAdmin()
        {
            // Arrange
            using var context = GetInMemoryContext();
            var galleryService = new GalleryService(context);
            var controller = new GalleryController(context, galleryService);

            var userId = "user-1";

            // Create gallery with user as admin member
            var gallery = new Gallery("Test Gallery", "/test", "/test/thumbnails", DataProviderType.Seafile)
            {
                SeafileServerUrl = "https://seafile.example.com"
            };
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

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = BuildUser(userId) }
            };

            var request = new SeafileApiKeyRequest { Username = "test", Password = "test" };

            // Act
            var result = await controller.GetSeafileApiKey(gallery.Id, request);

            // Assert - We expect the HTTP call to Seafile to fail (since it's not a real server), 
            // but we verify we don't get Forbid, which would mean auth check failed
            Assert.IsNotType<ForbidResult>(result.Result);
        }

        [Fact]
        public async Task GetPhotos_ReturnsForbid_WhenUserNotGalleryMember()
        {
            // Arrange
            using var context = GetInMemoryContext();
            var galleryService = new GalleryService(context);
            var controller = new GalleryController(context, galleryService);

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
            var result = await controller.GetPhotos(gallery.Id);

            // Assert
            Assert.IsType<ForbidResult>(result.Result);
        }

        [Fact]
        public async Task GetPhotos_ReturnsOk_WhenUserIsGalleryMember()
        {
            // Arrange
            using var context = GetInMemoryContext();
            var galleryService = new GalleryService(context);
            var controller = new GalleryController(context, galleryService);

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
            var result = await controller.GetPhotos(gallery.Id);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public async Task GetPhotos_HandlesUnspecifiedDateTimeKind_WithStartDate()
        {
            // Arrange
            using var context = GetInMemoryContext();
            var galleryService = new GalleryService(context);
            var controller = new GalleryController(context, galleryService);

            var userId = "user-1";

            // Create gallery with user as member
            var gallery = new Gallery("Test Gallery", "/test", "/test/thumbnails", DataProviderType.FileSystem);
            context.Galleries.Add(gallery);
            await context.SaveChangesAsync();

            // Create a directory for the gallery
            var directory = new PhotoDirectory("/test", 1, null, null, PhotoDirectoryType.Regular) // Visibility = 1 (public)
            {
                Gallery = gallery,
                GalleryId = gallery.Id
            };
            context.PhotoDirectories.Add(directory);
            await context.SaveChangesAsync();

            // Create test photos with UTC DateTime
            var photo1 = new Photo("test1.jpg")
            {
                DateTime = DateTime.SpecifyKind(new DateTime(2024, 1, 1, 10, 0, 0), DateTimeKind.Utc),
                Directory = directory,
                DirectoryId = directory.Id
            };
            var photo2 = new Photo("test2.jpg")
            {
                DateTime = DateTime.SpecifyKind(new DateTime(2024, 1, 2, 10, 0, 0), DateTimeKind.Utc),
                Directory = directory,
                DirectoryId = directory.Id
            };
            context.Photos.Add(photo1);
            context.Photos.Add(photo2);
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

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = BuildUser(userId) }
            };

            // Create an unspecified DateTime - this simulates what would come from API
            var startDate = new DateTime(2024, 1, 1, 12, 0, 0, DateTimeKind.Unspecified);

            // Act - This should not throw an exception
            var result = await controller.GetPhotos(gallery.Id, "desc", 0, 25, startDate);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
            var okResult = result.Result as OkObjectResult;
            var photos = okResult?.Value as PhotoViewModel[];
            Assert.NotNull(photos);
            // With desc order and startDate of 2024-01-01 12:00, only photo1 should be returned
            Assert.Single(photos);
        }
    }
}
