using GaleriePhotos.Data;
using GaleriePhotos.Models;
using GaleriePhotos.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Net.Http;
using Xunit;

namespace GaleriePhotosTest.Services
{
    [Collection("PostgreSQL")]
    public class PlaceServiceTests : IClassFixture<PostgreSqlTestFixture>, IDisposable
    {
        private readonly ApplicationDbContext context;
        private readonly PlaceService placeService;
        private readonly HttpClient httpClient;

        public PlaceServiceTests(PostgreSqlTestFixture fixture)
        {
            context = fixture.CreateDbContext();
            context.Database.EnsureCreated();

            var logger = new LoggerFactory().CreateLogger<PlaceService>();
            httpClient = new HttpClient();
            placeService = new PlaceService(context, logger, httpClient);
        }

        [Fact]
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

        [Fact]
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

        [Fact]
        public async Task AssignPhotoToPlaceAsync_ReturnsTrue_WhenPhotoAndPlaceExist()
        {
            // Arrange
            var gallery = new Gallery("Test Gallery", "/test", "/test/thumbs");
            context.Galleries.Add(gallery);
            await context.SaveChangesAsync();

            var directory = new PhotoDirectory("/test", 0, null, null) { GalleryId = gallery.Id, Gallery = gallery };
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

        [Fact]
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

        [Fact]
        public async Task MergeDuplicatePlacesAsync_MergesDuplicates_WhenDuplicatesExist()
        {
            // Arrange
            var gallery = new Gallery("Test Gallery", "/test", "/test/thumbs");
            context.Galleries.Add(gallery);
            await context.SaveChangesAsync();

            var directory = new PhotoDirectory("/test", 0, null, null) { GalleryId = gallery.Id, Gallery = gallery };
            context.PhotoDirectories.Add(directory);
            await context.SaveChangesAsync();

            // Create duplicate places with the same name and parent
            var place1 = new Place("Paris", 48.8566, 2.3522) { GalleryId = gallery.Id, Gallery = gallery, Type = PlaceType.City };
            var place2 = new Place("Paris", 48.8567, 2.3523) { GalleryId = gallery.Id, Gallery = gallery, Type = PlaceType.City };
            var place3 = new Place("Paris", 48.8568, 2.3524) { GalleryId = gallery.Id, Gallery = gallery, Type = PlaceType.City };
            context.Places.AddRange(place1, place2, place3);
            await context.SaveChangesAsync();

            // Create photos assigned to different duplicate places
            var photo1 = new Photo("test1.jpg") { Directory = directory, PlaceId = place1.Id };
            var photo2 = new Photo("test2.jpg") { Directory = directory, PlaceId = place2.Id };
            var photo3 = new Photo("test3.jpg") { Directory = directory, PlaceId = place3.Id };
            context.Photos.AddRange(photo1, photo2, photo3);
            await context.SaveChangesAsync();

            // Act
            var mergedCount = await placeService.MergeDuplicatePlacesAsync(gallery.Id);

            // Assert
            Assert.Equal(2, mergedCount); // Should merge 2 duplicates into 1

            // Verify only one place remains
            var remainingPlaces = await context.Places.Where(p => p.GalleryId == gallery.Id && p.Name == "Paris").ToListAsync();
            Assert.Single(remainingPlaces);

            // Verify all photos are assigned to the remaining place
            var photosWithPlace = await context.Photos.Where(p => p.PlaceId != null).ToListAsync();
            Assert.Equal(3, photosWithPlace.Count);
            Assert.All(photosWithPlace, p => Assert.Equal(remainingPlaces[0].Id, p.PlaceId));
        }

        [Fact]
        public async Task MergeDuplicatePlacesAsync_DoesNotMergeDifferentPlaces_WhenNoDuplicates()
        {
            // Arrange
            var gallery = new Gallery("Test Gallery", "/test", "/test/thumbs");
            context.Galleries.Add(gallery);
            await context.SaveChangesAsync();

            // Create different places (not duplicates)
            var place1 = new Place("Paris", 48.8566, 2.3522) { GalleryId = gallery.Id, Gallery = gallery };
            var place2 = new Place("Lyon", 45.7640, 4.8357) { GalleryId = gallery.Id, Gallery = gallery };
            context.Places.AddRange(place1, place2);
            await context.SaveChangesAsync();

            // Act
            var mergedCount = await placeService.MergeDuplicatePlacesAsync(gallery.Id);

            // Assert
            Assert.Equal(0, mergedCount); // Should not merge different places

            // Verify both places remain
            var remainingPlaces = await context.Places.Where(p => p.GalleryId == gallery.Id).ToListAsync();
            Assert.Equal(2, remainingPlaces.Count);
        }

        [Fact]
        public async Task GetPlaceByIdAsync_AutomaticallyAssignsCover_WhenNoCoverExists()
        {
            // Arrange
            var gallery = new Gallery("Test Gallery", "/test", "/test/thumbs");
            context.Galleries.Add(gallery);
            await context.SaveChangesAsync();

            var directory = new PhotoDirectory("/test", 0, null, null) { GalleryId = gallery.Id, Gallery = gallery };
            context.PhotoDirectories.Add(directory);
            await context.SaveChangesAsync();

            var place = new Place("Test Place", 48.8566, 2.3522) { GalleryId = gallery.Id, Gallery = gallery };
            context.Places.Add(place);
            await context.SaveChangesAsync();

            // Add photos to the place
            var photo1 = new Photo("test1.jpg") { Directory = directory, PlaceId = place.Id, DateTime = DateTime.UtcNow.AddDays(-2) };
            var photo2 = new Photo("test2.jpg") { Directory = directory, PlaceId = place.Id, DateTime = DateTime.UtcNow.AddDays(-1) };
            context.Photos.AddRange(photo1, photo2);
            await context.SaveChangesAsync();

            // Act
            var result = await placeService.GetPlaceByIdAsync(place.Id);

            // Assert
            Assert.NotNull(result);
            Assert.NotNull(result.CoverPhotoId);
            
            // Verify the place was updated in the database
            var updatedPlace = await context.Places.FindAsync(place.Id);
            Assert.NotNull(updatedPlace);
            Assert.NotNull(updatedPlace.CoverPhotoId);
            Assert.Equal(photo1.Id, updatedPlace.CoverPhotoId); // Should be the earliest photo
        }

        [Fact]
        public async Task GetPlaceByIdAsync_DoesNotAssignVideoCover_WhenOnlyVideosExist()
        {
            // Arrange
            var gallery = new Gallery("Test Gallery", "/test", "/test/thumbs");
            context.Galleries.Add(gallery);
            await context.SaveChangesAsync();

            var directory = new PhotoDirectory("/test", 0, null, null) { GalleryId = gallery.Id, Gallery = gallery };
            context.PhotoDirectories.Add(directory);
            await context.SaveChangesAsync();

            var place = new Place("Test Place", 48.8566, 2.3522) { GalleryId = gallery.Id, Gallery = gallery };
            context.Places.Add(place);
            await context.SaveChangesAsync();

            // Add only video files to the place
            var video1 = new Photo("test1.mp4") { Directory = directory, PlaceId = place.Id, DateTime = DateTime.UtcNow.AddDays(-2) };
            var video2 = new Photo("test2.webm") { Directory = directory, PlaceId = place.Id, DateTime = DateTime.UtcNow.AddDays(-1) };
            context.Photos.AddRange(video1, video2);
            await context.SaveChangesAsync();

            // Act
            var result = await placeService.GetPlaceByIdAsync(place.Id);

            // Assert
            Assert.NotNull(result);
            Assert.Null(result.CoverPhotoId); // Should remain null since only videos exist
            
            // Verify the place was not updated in the database
            var updatedPlace = await context.Places.FindAsync(place.Id);
            Assert.NotNull(updatedPlace);
            Assert.Null(updatedPlace.CoverPhotoId);
        }

        [Fact]
        public async Task GetPlaceByIdAsync_SkipsPrivatePhotos_WhenAssigningCover()
        {
            // Arrange
            var gallery = new Gallery("Test Gallery", "/test", "/test/thumbs");
            context.Galleries.Add(gallery);
            await context.SaveChangesAsync();

            var publicDirectory = new PhotoDirectory("/test/public", 0, null, null) { GalleryId = gallery.Id, Gallery = gallery };
            var privateDirectory = new PhotoDirectory("/test/private", 0, null, null, PhotoDirectoryType.Private) { GalleryId = gallery.Id, Gallery = gallery };
            context.PhotoDirectories.AddRange(publicDirectory, privateDirectory);
            await context.SaveChangesAsync();

            var place = new Place("Test Place", 48.8566, 2.3522) { GalleryId = gallery.Id, Gallery = gallery };
            context.Places.Add(place);
            await context.SaveChangesAsync();

            // Add photos to the place - private photo first chronologically
            var privatePhoto = new Photo("private.jpg") { Directory = privateDirectory, PlaceId = place.Id, DateTime = DateTime.UtcNow.AddDays(-2) };
            var publicPhoto = new Photo("public.jpg") { Directory = publicDirectory, PlaceId = place.Id, DateTime = DateTime.UtcNow.AddDays(-1) };
            context.Photos.AddRange(privatePhoto, publicPhoto);
            await context.SaveChangesAsync();

            // Act
            var result = await placeService.GetPlaceByIdAsync(place.Id);

            // Assert
            Assert.NotNull(result);
            Assert.NotNull(result.CoverPhotoId);
            
            // Verify the public photo was chosen, not the private one
            var updatedPlace = await context.Places.FindAsync(place.Id);
            Assert.NotNull(updatedPlace);
            Assert.NotNull(updatedPlace.CoverPhotoId);
            Assert.Equal(publicPhoto.Id, updatedPlace.CoverPhotoId); // Should be the public photo
        }

        [Fact]
        public async Task GetPlaceByIdAsync_DoesNotChangeCover_WhenCoverAlreadyExists()
        {
            // Arrange
            var gallery = new Gallery("Test Gallery", "/test", "/test/thumbs");
            context.Galleries.Add(gallery);
            await context.SaveChangesAsync();

            var directory = new PhotoDirectory("/test", 0, null, null) { GalleryId = gallery.Id, Gallery = gallery };
            context.PhotoDirectories.Add(directory);
            await context.SaveChangesAsync();

            var existingCoverPhoto = new Photo("existing.jpg") { Directory = directory, DateTime = DateTime.UtcNow.AddDays(-3) };
            context.Photos.Add(existingCoverPhoto);
            await context.SaveChangesAsync();

            var place = new Place("Test Place", 48.8566, 2.3522) 
            { 
                GalleryId = gallery.Id, 
                Gallery = gallery,
                CoverPhotoId = existingCoverPhoto.Id
            };
            context.Places.Add(place);
            await context.SaveChangesAsync();

            // Add another photo that would be selected if auto-assignment ran
            var photo = new Photo("newer.jpg") { Directory = directory, PlaceId = place.Id, DateTime = DateTime.UtcNow.AddDays(-1) };
            context.Photos.Add(photo);
            await context.SaveChangesAsync();

            // Act
            var result = await placeService.GetPlaceByIdAsync(place.Id);

            // Assert
            Assert.NotNull(result);
            Assert.NotNull(result.CoverPhotoId);
            
            // Verify the cover photo was not changed
            var updatedPlace = await context.Places.FindAsync(place.Id);
            Assert.NotNull(updatedPlace);
            Assert.Equal(existingCoverPhoto.Id, updatedPlace.CoverPhotoId); // Should still be the existing cover
        }

        public void Dispose()
        {
            context.Dispose();
            httpClient.Dispose();
        }
    }
}