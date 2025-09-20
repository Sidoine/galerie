using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using GaleriePhotos.Models;
using GaleriePhotos.Services;
using Xunit;

namespace GaleriePhotosTest.Services
{
    public class DataServiceTests : IDisposable
    {
        private readonly DataService _dataService;

        public DataServiceTests()
        {
            _dataService = new DataService();
        }

        [Fact]
        public void GetDataProvider_WithFileSystemGallery_ReturnsFileSystemProvider()
        {
            // Arrange
            var gallery = new Gallery("Test Gallery", "/test/path", "/test/thumbnails", DataProviderType.FileSystem, null, null);

            // Act
            var provider = _dataService.GetDataProvider(gallery);

            // Assert
            Assert.NotNull(provider);
            Assert.IsType<FileSystemProvider>(provider);
        }

        [Fact]
        public void GetDataProvider_WithSeafileGallery_ReturnsSeafileProvider()
        {
            // Arrange
            var gallery = new Gallery(
                "Test Gallery",
                "lib123",
                "thumbnails",
                DataProviderType.Seafile,
                "https://cloud.example.com",
                "test-api-key");

            // Act
            var provider = _dataService.GetDataProvider(gallery);

            // Assert
            Assert.NotNull(provider);
            Assert.IsType<SeafileDataProvider>(provider);
        }

        [Fact]
        public void GetDataProvider_WithUnsupportedProviderType_ThrowsNotSupportedException()
        {
            // Arrange
            var gallery = new Gallery("Test Gallery", "/test/path", "/test/thumbnails", DataProviderType.FileSystem, null, null);
            // Force an invalid enum value
            gallery.GetType().GetProperty("DataProvider")!.SetValue(gallery, (DataProviderType)999);

            // Act & Assert
            Assert.Throws<NotSupportedException>(() => _dataService.GetDataProvider(gallery));
        }

        [Fact]
        public void GetDataProvider_WithSameGallery_ReturnsCachedProvider()
        {
            // Arrange
            var gallery1 = new Gallery(
                "Gallery 1",
                "lib123",
                "thumbnails",
                DataProviderType.Seafile,
                "https://cloud.example.com",
                "test-api-key");

            // Act
            var provider1 = _dataService.GetDataProvider(gallery1);
            var provider2 = _dataService.GetDataProvider(gallery1);

            // Assert
            Assert.Same(provider1, provider2);
        }

        public void Dispose()
        {
            _dataService.Dispose();
        }
    }
}