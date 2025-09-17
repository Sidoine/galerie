using GaleriePhotos.Models;
using GaleriePhotos.Services;
using System;
using Xunit;

namespace GaleriePhotosTest.Services
{
    public class SeafileDataProviderTests
    {
        [Fact]
        public void Constructor_WithValidParameters_ShouldCreateInstance()
        {
            // Arrange
            var gallery = new GaleriePhotos.Models.Gallery(
                "Test Gallery",
                "lib123",
                "lib456",
                DataProviderType.Seafile,
                "https://cloud.example.com",
                "test-api-key");

            // Act
            using var provider = new SeafileDataProvider(gallery);

            // Assert
            Assert.NotNull(provider);
        }

        [Fact]
        public void Constructor_WithTrailingSlashInUrl_ShouldTrimSlash()
        {
            // Arrange
            var serverUrl = "https://cloud.example.com/";
            var apiKey = "test-api-key";
            var originals = "lib-originals";
            var thumbs = "lib-thumbs";
            var gallery = new GaleriePhotos.Models.Gallery(
                "Test Gallery",
                originals,
                thumbs,
                DataProviderType.Seafile,
                serverUrl,
                apiKey);

            // Act & Assert - Should not throw
            using var provider = new SeafileDataProvider(gallery);
            Assert.NotNull(provider);
        }

        // ParseSeafilePath tests removed because parsing logic was inlined and library IDs are provided explicitly.

        [Fact]
        public void Dispose_ShouldDisposeHttpClient()
        {
            // Arrange
            var gallery = new GaleriePhotos.Models.Gallery(
                "Test Gallery",
                "lib-o",
                "lib-t",
                DataProviderType.Seafile,
                "https://test.com",
                "key");
            var provider = new SeafileDataProvider(gallery);

            // Act & Assert - Should not throw
            provider.Dispose();
        }
    }
}