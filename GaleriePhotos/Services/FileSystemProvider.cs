using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using GaleriePhotos.Models;

namespace GaleriePhotos.Services
{
    /// <summary>
    /// Implementation of IDataProvider that uses the local file system.
    /// </summary>
    public class FileSystemProvider : IDataProvider
    {
        public FileSystemProvider(Gallery gallery)
        {
            Gallery = gallery;
        }

        private Gallery Gallery { get; }

        /// <inheritdoc />
        public Task<bool> DirectoryExists(string path) => Task.FromResult(Directory.Exists(Path.Combine(Gallery.RootDirectory, path)));

        /// <inheritdoc />
        public Task<bool> FileExists(string path) => Task.FromResult(File.Exists(Path.Combine(Gallery.RootDirectory, path)));

        /// <inheritdoc />
        public Task<IEnumerable<string>> GetFiles(string path) => Task.FromResult<IEnumerable<string>>(Directory.EnumerateFiles(Path.Combine(Gallery.RootDirectory, path))));

        /// <inheritdoc />
        public Task<IEnumerable<string>> GetDirectories(string path) => Task.FromResult<IEnumerable<string>>(Directory.EnumerateDirectories(Path.Combine(Gallery.RootDirectory, path))));

        /// <inheritdoc />
        public Task<DateTime> GetFileCreationTimeUtc(string path) => Task.FromResult(File.GetCreationTimeUtc(Path.Combine(Gallery.RootDirectory, path)));

        /// <inheritdoc />
        public Task CreateDirectory(string path)
        {
            Directory.CreateDirectory(Path.Combine(Gallery.RootDirectory, path));
            return Task.CompletedTask;
        }

        /// <inheritdoc />
        public Task MoveFile(string sourcePath, string destinationPath)
        {
            File.Move(sourcePath, destinationPath);
            return Task.CompletedTask;
        }

        /// <inheritdoc />
        public Task<byte[]> ReadFileBytes(string path) => Task.FromResult(File.ReadAllBytes(path));

        /// <inheritdoc />
        public Task<FileStream> OpenFileRead(string path)
        {
            return Task.FromResult(new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read, 4096, FileOptions.Asynchronous));
        }

        /// <inheritdoc />
        public async Task WriteFileBytesAsync(string path, byte[] content)
        {
            await File.WriteAllBytesAsync(path, content);
        }

        // Thumbnail specialized operations simply reuse the same file system semantics
        public Task<bool> ThumbnailExists(string path) => Task.FromResult(File.Exists(Path.Combine(Gallery.ThumbnailsDirectory, path)));

        public Task<byte[]> ReadThumbnailBytes(string path) => Task.FromResult(File.ReadAllBytes(Path.Combine(Gallery.ThumbnailsDirectory, path)));

        public Task<FileStream> OpenThumbnailRead(string path) => Task.FromResult(new FileStream(Path.Combine(Gallery.ThumbnailsDirectory, path), FileMode.Open, FileAccess.Read, FileShare.Read, 4096, FileOptions.Asynchronous));

        public Task WriteThumbnailBytesAsync(string path, byte[] content) => Task.FromResult(File.WriteAllBytesAsync(Path.Combine(Gallery.ThumbnailsDirectory, path), content));
    }
}