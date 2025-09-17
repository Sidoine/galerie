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

    public class FileSystemProviderTests : IDisposable
    {
        private readonly string _testDirectory;
        private readonly string _testFile;
        private readonly FileSystemProvider _provider;

        public FileSystemProviderTests()
        {
            var gallery = new Gallery("Test Gallery", Path.GetTempPath(), Path.GetTempPath(), DataProviderType.FileSystem, null, null);
            _provider = new FileSystemProvider(gallery);
            _testDirectory = Path.Combine(Path.GetTempPath(), "GalerieTest_" + Guid.NewGuid().ToString());
            _testFile = Path.Combine(_testDirectory, "test.txt");

            // Setup test environment
            Directory.CreateDirectory(_testDirectory);
            File.WriteAllText(_testFile, "Test content");
        }

        [Fact]
        public async Task DirectoryExists_WithExistingDirectory_ReturnsTrue()
        {
            // Act & Assert
            Assert.True(await _provider.DirectoryExists(_testDirectory));
        }

        [Fact]
        public async Task DirectoryExists_WithNonExistentDirectory_ReturnsFalse()
        {
            // Arrange
            var nonExistentDir = Path.Combine(_testDirectory, "nonexistent");

            // Act & Assert
            Assert.False(await _provider.DirectoryExists(nonExistentDir));
        }

        [Fact]
        public async Task FileExists_WithExistingFile_ReturnsTrue()
        {
            // Act & Assert
            Assert.True(await _provider.FileExists(_testFile));
        }

        [Fact]
        public async Task FileExists_WithNonExistentFile_ReturnsFalse()
        {
            // Arrange
            var nonExistentFile = Path.Combine(_testDirectory, "nonexistent.txt");

            // Act & Assert
            Assert.False(await _provider.FileExists(nonExistentFile));
        }

        public void Dispose()
        {
            if (Directory.Exists(_testDirectory))
            {
                Directory.Delete(_testDirectory, true);
            }
        }
    }
}