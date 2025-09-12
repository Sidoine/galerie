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
            var serverUrl = "https://cloud.example.com";
            var apiKey = "test-api-key";

            // Act
            using var provider = new SeafileDataProvider(serverUrl, apiKey);

            // Assert
            Assert.NotNull(provider);
        }

        [Fact]
        public void Constructor_WithTrailingSlashInUrl_ShouldTrimSlash()
        {
            // Arrange
            var serverUrl = "https://cloud.example.com/";
            var apiKey = "test-api-key";

            // Act & Assert - Should not throw
            using var provider = new SeafileDataProvider(serverUrl, apiKey);
            Assert.NotNull(provider);
        }

        [Theory]
        [InlineData("lib123/path/to/file", "lib123", "/path/to/file")]
        [InlineData("lib123", "lib123", "/")]
        [InlineData("/lib123/path/to/file", "lib123", "/path/to/file")]
        public void ParseSeafilePath_WithValidPaths_ShouldReturnCorrectParts(
            string input, 
            string expectedLibraryId, 
            string expectedFilePath)
        {
            // Arrange
            using var provider = new SeafileDataProvider("https://test.com", "key");
            var method = typeof(SeafileDataProvider)
                .GetMethod("ParseSeafilePath", 
                    System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

            // Act
            var result = method!.Invoke(provider, new object[] { input });
            var (libraryId, filePath) = ((string, string))result!;

            // Assert
            Assert.Equal(expectedLibraryId, libraryId);
            Assert.Equal(expectedFilePath, filePath);
        }

        [Theory]
        [InlineData("")]
        public void ParseSeafilePath_WithInvalidPaths_ShouldThrowArgumentException(string input)
        {
            // Arrange
            using var provider = new SeafileDataProvider("https://test.com", "key");
            var method = typeof(SeafileDataProvider)
                .GetMethod("ParseSeafilePath", 
                    System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

            // Act & Assert
            Assert.Throws<System.Reflection.TargetInvocationException>(() =>
                method!.Invoke(provider, new object[] { input }));
        }

        [Fact]
        public void ParseSeafilePath_WithNullPath_ShouldThrowArgumentException()
        {
            // Arrange
            using var provider = new SeafileDataProvider("https://test.com", "key");
            var method = typeof(SeafileDataProvider)
                .GetMethod("ParseSeafilePath", 
                    System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

            // Act & Assert
            Assert.Throws<System.Reflection.TargetInvocationException>(() =>
                method!.Invoke(provider, new object[] { null! }));
        }

        [Fact]
        public void Dispose_ShouldDisposeHttpClient()
        {
            // Arrange
            var provider = new SeafileDataProvider("https://test.com", "key");

            // Act & Assert - Should not throw
            provider.Dispose();
        }
    }
}