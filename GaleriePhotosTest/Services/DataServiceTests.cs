using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using GaleriePhotos.Services;
using Xunit;

namespace GaleriePhotosTest.Services
{
    public class DataServiceTests
    {
        [Fact]
        public void GetDefaultDataProvider_ReturnsFileSystemProvider()
        {
            // Arrange
            var dataService = new DataService();

            // Act
            var provider = dataService.GetDefaultDataProvider();

            // Assert
            Assert.NotNull(provider);
            Assert.IsType<FileSystemProvider>(provider);
        }

        [Fact]
        public void GetDataProvider_WithGallery_ReturnsFileSystemProvider()
        {
            // Arrange
            var dataService = new DataService();
            var gallery = new GaleriePhotos.Models.Gallery("Test Gallery", "/test/path");

            // Act
            var provider = dataService.GetDataProvider(gallery);

            // Assert
            Assert.NotNull(provider);
            Assert.IsType<FileSystemProvider>(provider);
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
        public void DirectoryExists_WithExistingDirectory_ReturnsTrue()
        {
            // Act & Assert
            Assert.True(_provider.DirectoryExists(_testDirectory));
        }

        [Fact]
        public void DirectoryExists_WithNonExistentDirectory_ReturnsFalse()
        {
            // Arrange
            var nonExistentDir = Path.Combine(_testDirectory, "nonexistent");

            // Act & Assert
            Assert.False(_provider.DirectoryExists(nonExistentDir));
        }

        [Fact]
        public void FileExists_WithExistingFile_ReturnsTrue()
        {
            // Act & Assert
            Assert.True(_provider.FileExists(_testFile));
        }

        [Fact]
        public void FileExists_WithNonExistentFile_ReturnsFalse()
        {
            // Arrange
            var nonExistentFile = Path.Combine(_testDirectory, "nonexistent.txt");

            // Act & Assert
            Assert.False(_provider.FileExists(nonExistentFile));
        }

        [Fact]
        public void GetFiles_WithExistingDirectory_ReturnsFiles()
        {
            // Act
            var files = _provider.GetFiles(_testDirectory);

            // Assert
            Assert.NotNull(files);
            Assert.Contains(_testFile, files);
        }

        [Fact]
        public void GetDirectories_WithSubdirectories_ReturnsDirectories()
        {
            // Arrange
            var subDir = Path.Combine(_testDirectory, "subdir");
            Directory.CreateDirectory(subDir);

            // Act
            var directories = _provider.GetDirectories(_testDirectory);

            // Assert
            Assert.NotNull(directories);
            Assert.Contains(subDir, directories);
        }

        [Fact]
        public void GetFileCreationTimeUtc_WithExistingFile_ReturnsTime()
        {
            // Act
            var creationTime = _provider.GetFileCreationTimeUtc(_testFile);

            // Assert
            Assert.True(creationTime > DateTime.MinValue);
            Assert.Equal(DateTimeKind.Utc, creationTime.Kind);
        }

        [Fact]
        public void CreateDirectory_CreatesDirectory()
        {
            // Arrange
            var newDir = Path.Combine(_testDirectory, "newdir");

            // Act
            _provider.CreateDirectory(newDir);

            // Assert
            Assert.True(Directory.Exists(newDir));
        }

        [Fact]
        public void MoveFile_MovesFileSuccessfully()
        {
            // Arrange
            var sourceFile = Path.Combine(_testDirectory, "source.txt");
            var destFile = Path.Combine(_testDirectory, "dest.txt");
            File.WriteAllText(sourceFile, "Move test");

            // Act
            _provider.MoveFile(sourceFile, destFile);

            // Assert
            Assert.False(File.Exists(sourceFile));
            Assert.True(File.Exists(destFile));
            Assert.Equal("Move test", File.ReadAllText(destFile));
        }

        [Fact]
        public void ReadFileBytes_ReturnsFileContent()
        {
            // Arrange
            var content = "Test content for reading";
            File.WriteAllText(_testFile, content);

            // Act
            var bytes = _provider.ReadFileBytes(_testFile);

            // Assert
            Assert.NotNull(bytes);
            Assert.Equal(content, System.Text.Encoding.UTF8.GetString(bytes));
        }

        [Fact]
        public void OpenFileRead_ReturnsReadableStream()
        {
            // Act
            using var stream = _provider.OpenFileRead(_testFile);

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