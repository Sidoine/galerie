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
            var gallery = new Gallery("Test Gallery", "/test/path");

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
                null,
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
        public void GetDataProvider_WithSeafileGalleryMissingUrl_ThrowsInvalidOperationException()
        {
            // Arrange
            var gallery = new Gallery(
                "Test Gallery",
                "lib123",
                null,
                DataProviderType.Seafile,
                null, // Missing URL
                "test-api-key");

            // Act & Assert
            Assert.Throws<InvalidOperationException>(() => _dataService.GetDataProvider(gallery));
        }

        [Fact]
        public void GetDataProvider_WithSeafileGalleryMissingApiKey_ThrowsInvalidOperationException()
        {
            // Arrange
            var gallery = new Gallery(
                "Test Gallery",
                "lib123",
                null,
                DataProviderType.Seafile,
                "https://cloud.example.com",
                null); // Missing API key

            // Act & Assert
            Assert.Throws<InvalidOperationException>(() => _dataService.GetDataProvider(gallery));
        }

        [Fact]
        public void GetDataProvider_WithUnsupportedProviderType_ThrowsNotSupportedException()
        {
            // Arrange
            var gallery = new Gallery("Test Gallery", "/test/path");
            // Force an invalid enum value
            gallery.GetType().GetProperty("DataProvider")!.SetValue(gallery, (DataProviderType)999);

            // Act & Assert
            Assert.Throws<NotSupportedException>(() => _dataService.GetDataProvider(gallery));
        }

        [Fact]
        public void GetDataProvider_WithSameSeafileCredentials_ReturnsCachedProvider()
        {
            // Arrange
            var gallery1 = new Gallery(
                "Gallery 1",
                "lib123",
                null,
                DataProviderType.Seafile,
                "https://cloud.example.com",
                "test-api-key");
            var gallery2 = new Gallery(
                "Gallery 2",
                "lib456",
                null,
                DataProviderType.Seafile,
                "https://cloud.example.com",
                "test-api-key");

            // Act
            var provider1 = _dataService.GetDataProvider(gallery1);
            var provider2 = _dataService.GetDataProvider(gallery2);

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
            _provider = new FileSystemProvider();
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

        [Fact]
        public async Task GetFiles_WithExistingDirectory_ReturnsFiles()
        {
            // Act
            var files = await _provider.GetFiles(_testDirectory);

            // Assert
            Assert.NotNull(files);
            Assert.Contains(_testFile, files);
        }

        [Fact]
        public async Task GetDirectories_WithSubdirectories_ReturnsDirectories()
        {
            // Arrange
            var subDir = Path.Combine(_testDirectory, "subdir");
            Directory.CreateDirectory(subDir);

            // Act
            var directories = await _provider.GetDirectories(_testDirectory);

            // Assert
            Assert.NotNull(directories);
            Assert.Contains(subDir, directories);
        }

        [Fact]
        public async Task GetFileCreationTimeUtc_WithExistingFile_ReturnsTime()
        {
            // Act
            var creationTime = await _provider.GetFileCreationTimeUtc(_testFile);

            // Assert
            Assert.True(creationTime > DateTime.MinValue);
            Assert.Equal(DateTimeKind.Utc, creationTime.Kind);
        }

        [Fact]
        public async Task CreateDirectory_CreatesDirectory()
        {
            // Arrange
            var newDir = Path.Combine(_testDirectory, "newdir");

            // Act
            await _provider.CreateDirectory(newDir);

            // Assert
            Assert.True(Directory.Exists(newDir));
        }

        [Fact]
        public async Task MoveFile_MovesFileSuccessfully()
        {
            // Arrange
            var sourceFile = Path.Combine(_testDirectory, "source.txt");
            var destFile = Path.Combine(_testDirectory, "dest.txt");
            File.WriteAllText(sourceFile, "Move test");

            // Act
            await _provider.MoveFile(sourceFile, destFile);

            // Assert
            Assert.False(File.Exists(sourceFile));
            Assert.True(File.Exists(destFile));
            Assert.Equal("Move test", File.ReadAllText(destFile));
        }

        [Fact]
        public async Task ReadFileBytes_ReturnsFileContent()
        {
            // Arrange
            var content = "Test content for reading";
            File.WriteAllText(_testFile, content);

            // Act
            var bytes = await _provider.ReadFileBytes(_testFile);

            // Assert
            Assert.NotNull(bytes);
            Assert.Equal(content, System.Text.Encoding.UTF8.GetString(bytes));
        }

        [Fact]
        public async Task OpenFileRead_ReturnsReadableStream()
        {
            // Act
            using var stream = await _provider.OpenFileRead(_testFile);

            // Assert
            Assert.NotNull(stream);
            Assert.True(stream.CanRead);
            Assert.False(stream.CanWrite);
        }

        [Fact]
        public async Task WriteFileBytesAsync_WritesContentSuccessfully()
        {
            // Arrange
            var newFile = Path.Combine(_testDirectory, "written.txt");
            var content = "Written content";
            var bytes = System.Text.Encoding.UTF8.GetBytes(content);

            // Act
            await _provider.WriteFileBytesAsync(newFile, bytes);

            // Assert
            Assert.True(File.Exists(newFile));
            Assert.Equal(content, File.ReadAllText(newFile));
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