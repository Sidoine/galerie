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
    public class FileSystemProvider : AbstractDataProvider, IDataProvider
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
        public Task<IEnumerable<string>> GetFiles(PhotoDirectory photoDirectory) => Task.FromResult<IEnumerable<string>>(Directory.EnumerateFiles(Path.Combine(Gallery.RootDirectory, photoDirectory.Path)));

        /// <inheritdoc />
        public Task<IEnumerable<string>> GetDirectories(PhotoDirectory photoDirectory) => Task.FromResult<IEnumerable<string>>(Directory.EnumerateDirectories(Path.Combine(Gallery.RootDirectory, photoDirectory.Path)));

        /// <inheritdoc />
        public Task<DateTime> GetFileCreationTimeUtc(PhotoDirectory photoDirectory, Photo photo) => Task.FromResult(File.GetCreationTimeUtc(Path.Combine(Gallery.RootDirectory, photoDirectory.Path, photo.FileName)));

        /// <inheritdoc />
        public Task CreateDirectory(PhotoDirectory photoDirectory)
        {
            Directory.CreateDirectory(Path.Combine(Gallery.RootDirectory, photoDirectory.Path));
            return Task.CompletedTask;
        }

        /// <inheritdoc />
        public Task MoveFile(PhotoDirectory sourceDirectory, PhotoDirectory destinationDirectory, Photo photo)
        {
            var sourcePath = Path.Combine(Gallery.RootDirectory, sourceDirectory.Path, photo.FileName);
            var destinationPath = Path.Combine(Gallery.RootDirectory, destinationDirectory.Path, photo.FileName);
            File.Move(sourcePath, destinationPath);
            return Task.CompletedTask;
        }

        /// <inheritdoc />
        public Task<Stream?> OpenFileRead(PhotoDirectory directory, Photo photo)
        {
            var path = Path.Combine(Gallery.RootDirectory, directory.Path, photo.FileName);
            return Task.FromResult<Stream?>(new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read, 4096, FileOptions.Asynchronous));
        }

        // Thumbnail specialized operations simply reuse the same file system semantics
        public Task<bool> ThumbnailExists(Photo photo) => Task.FromResult(File.Exists(Path.Combine(Gallery.ThumbnailsDirectory, GetThumbnailFileName(photo))));

        public Task<Stream?> OpenThumbnailRead(Photo photo) => Task.FromResult<Stream?>(new FileStream(Path.Combine(Gallery.ThumbnailsDirectory, GetThumbnailFileName(photo)), FileMode.Open, FileAccess.Read, FileShare.Read, 4096, FileOptions.Asynchronous));

        public Task<IFileName> GetLocalFileName(PhotoDirectory directory, Photo photo)
        {
            var path = Path.Combine(Gallery.RootDirectory, directory.Path, photo.FileName);
            var exists = File.Exists(path);
            return Task.FromResult<IFileName>(new FileSystemFileName(path, exists));
        }
        
        public Task<IFileName> GetLocalThumbnailFileName(Photo photo)
        {
            var path = Path.Combine(Gallery.ThumbnailsDirectory, GetThumbnailFileName(photo));
            var exists = File.Exists(path);
            return Task.FromResult<IFileName>(new FileSystemFileName(path, exists));
        }
    }
}