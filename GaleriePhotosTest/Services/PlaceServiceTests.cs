using GaleriePhotos.Data;
using GaleriePhotos.Models;
using GaleriePhotos.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Net.Http;
using Xunit;

namespace GaleriePhotosTest.Services
{
    public class PlaceServiceTests : IDisposable
    {
        private readonly ApplicationDbContext context;
        private readonly PlaceService placeService;
        private readonly HttpClient httpClient;

        public PlaceServiceTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            context = new ApplicationDbContext(options);
            var logger = new LoggerFactory().CreateLogger<PlaceService>();
            httpClient = new HttpClient();
            placeService = new PlaceService(context, logger, httpClient);
        }

        [Fact(Skip = "Can only be run on PostgreSQL")]
        public async Task GetPlacesByGalleryAsync_ReturnsEmptyList_WhenNoPlaces()
        {
            // Arrange
            var gallery = new Gallery("Test Gallery", "/test", "/test/thumbs");
            context.Galleries.Add(gallery);
            await context.SaveChangesAsync();

            // Act
            var result = await placeService.GetPlacesByGalleryAsync(gallery.Id);

            // Assert
            Assert.Empty(result);
        }

        [Fact(Skip = "Can only be run on PostgreSQL")]
        public async Task GetPlacesByGalleryAsync_ReturnsPlaces_WhenPlacesExist()
        {
            // Arrange
            var gallery = new Gallery("Test Gallery", "/test", "/test/thumbs");
            context.Galleries.Add(gallery);
            await context.SaveChangesAsync();

            var place1 = new Place("Paris", 48.8566, 2.3522) { GalleryId = gallery.Id, Gallery = gallery };
            var place2 = new Place("Lyon", 45.7640, 4.8357) { GalleryId = gallery.Id, Gallery = gallery };
            context.Places.AddRange(place1, place2);
            await context.SaveChangesAsync();

            // Act
            var result = await placeService.GetPlacesByGalleryAsync(gallery.Id);

            // Assert
            Assert.Equal(2, result.Count);
            Assert.Contains(result, p => p.Name == "Paris");
            Assert.Contains(result, p => p.Name == "Lyon");
        }

        [Fact(Skip = "Can only be run on PostgreSQL")]
        public async Task AssignPhotoToPlaceAsync_ReturnsTrue_WhenPhotoAndPlaceExist()
        {
            // Arrange
            var gallery = new Gallery("Test Gallery", "/test", "/test/thumbs");
            context.Galleries.Add(gallery);
            await context.SaveChangesAsync();

            var directory = new PhotoDirectory("/test", 0, null) { GalleryId = gallery.Id, Gallery = gallery };
            context.PhotoDirectories.Add(directory);
            await context.SaveChangesAsync();

            var photo = new Photo("test.jpg") { Directory = directory };
            context.Photos.Add(photo);

            var place = new Place("Test Place", 48.8566, 2.3522) { GalleryId = gallery.Id, Gallery = gallery };
            context.Places.Add(place);
            await context.SaveChangesAsync();

            // Act
            var result = await placeService.AssignPhotoToPlaceAsync(photo.Id, place.Id);

            // Assert
            Assert.True(result);
            
            var updatedPhoto = await context.Photos.FindAsync(photo.Id);
            Assert.NotNull(updatedPhoto);
            Assert.Equal(place.Id, updatedPhoto.PlaceId);
        }

        [Fact(Skip = "Can only be run on PostgreSQL")]
        public async Task AssignPhotoToPlaceAsync_ReturnsFalse_WhenPhotoNotFound()
        {
            // Arrange
            var gallery = new Gallery("Test Gallery", "/test", "/test/thumbs");
            context.Galleries.Add(gallery);
            await context.SaveChangesAsync();

            var place = new Place("Test Place", 48.8566, 2.3522) { GalleryId = gallery.Id, Gallery = gallery };
            context.Places.Add(place);
            await context.SaveChangesAsync();

            // Act
            var result = await placeService.AssignPhotoToPlaceAsync(999, place.Id);

            // Assert
            Assert.False(result);
        }

        [Fact]
        public void Place_Constructor_SetsPropertiesCorrectly()
        {
            // Arrange
            var gallery = new Gallery("Test Gallery", "/test", "/test/thumbs");
            
            // Act
            var place = new Place("Test Place", 48.8566, 2.3522) { Gallery = gallery };

            // Assert
            Assert.Equal("Test Place", place.Name);
            Assert.Equal(48.8566, place.Latitude);
            Assert.Equal(2.3522, place.Longitude);
            Assert.True(place.CreatedAt > DateTime.MinValue);
        }

        public void Dispose()
        {
            context.Dispose();
            httpClient.Dispose();
        }
    }
}