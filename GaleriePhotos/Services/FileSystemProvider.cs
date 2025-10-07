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

        public bool IsSetup => Directory.Exists(Gallery.RootDirectory) && Directory.Exists(Gallery.ThumbnailsDirectory);

        /// <inheritdoc />
        public Task<IEnumerable<string>> GetFiles(PhotoDirectory photoDirectory) => Task.FromResult<IEnumerable<string>>(Directory.EnumerateFiles(Path.Combine(Gallery.RootDirectory, photoDirectory.Path)));

        /// <inheritdoc />
        public Task<IEnumerable<string>> GetDirectories(PhotoDirectory photoDirectory) => Task.FromResult<IEnumerable<string>>(Directory.EnumerateDirectories(Path.Combine(Gallery.RootDirectory, photoDirectory.Path)));

        /// <inheritdoc />
        public Task<DateTime> GetFileCreationTimeUtc(Photo photo) => Task.FromResult(File.GetCreationTimeUtc(Path.Combine(Gallery.RootDirectory, photo.Directory.Path, photo.FileName)));

        /// <inheritdoc />
        public Task CreateDirectory(PhotoDirectory photoDirectory)
        {
            Directory.CreateDirectory(Path.Combine(Gallery.RootDirectory, photoDirectory.Path));
            return Task.CompletedTask;
        }

        /// <inheritdoc />
        public Task MoveFile(PhotoDirectory destinationDirectory, Photo photo)
        {
            var sourcePath = Path.Combine(Gallery.RootDirectory, photo.Directory.Path, photo.FileName);
            var destinationPath = Path.Combine(Gallery.RootDirectory, destinationDirectory.Path, photo.FileName);
            File.Move(sourcePath, destinationPath);
            return Task.CompletedTask;
        }

        /// <inheritdoc />
        public Task<Stream?> OpenFileRead(Photo photo)
        {
            var path = Path.Combine(Gallery.RootDirectory, photo.Directory.Path, photo.FileName);
            if (!File.Exists(path))
            {
                return Task.FromResult<Stream?>(null);
            }
            return Task.FromResult<Stream?>(new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read, 4096, FileOptions.Asynchronous));
        }

        // Thumbnail specialized operations simply reuse the same file system semantics
        public Task<bool> ThumbnailExists(Photo photo) => Task.FromResult(File.Exists(Path.Combine(Gallery.ThumbnailsDirectory, GetThumbnailFileName(photo))));

        public Task<Stream?> OpenThumbnailRead(Photo photo) => Task.FromResult<Stream?>(new FileStream(Path.Combine(Gallery.ThumbnailsDirectory, GetThumbnailFileName(photo)), FileMode.Open, FileAccess.Read, FileShare.Read, 4096, FileOptions.Asynchronous));

        public Task<IFileName> GetLocalFileName(Photo photo)
        {
            var path = Path.Combine(Gallery.RootDirectory, photo.Directory.Path, photo.FileName);
            var exists = File.Exists(path);
            return Task.FromResult<IFileName>(new FileSystemFileName(path, exists));
        }
        
        public Task<IFileName> GetLocalThumbnailFileName(Photo photo)
        {
            var path = Path.Combine(Gallery.ThumbnailsDirectory, GetThumbnailFileName(photo));
            var exists = File.Exists(path);
            return Task.FromResult<IFileName>(new FileSystemFileName(path, exists));
        }

        // Face thumbnail specialized operations
        public Task<bool> FaceThumbnailExists(Face face)
        {
            var facesDir = Path.Combine(Gallery.ThumbnailsDirectory, "faces");
            var path = Path.Combine(facesDir, GetFaceThumbnailFileName(face));
            return Task.FromResult(File.Exists(path));
        }

        public Task<Stream?> OpenFaceThumbnailRead(Face face)
        {
            var facesDir = Path.Combine(Gallery.ThumbnailsDirectory, "faces");
            var path = Path.Combine(facesDir, GetFaceThumbnailFileName(face));
            if (!File.Exists(path))
            {
                return Task.FromResult<Stream?>(null);
            }
            return Task.FromResult<Stream?>(new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read, 4096, FileOptions.Asynchronous));
        }

        public Task<IFileName> GetLocalFaceThumbnailFileName(Face face)
        {
            var facesDir = Path.Combine(Gallery.ThumbnailsDirectory, "faces");
            var path = Path.Combine(facesDir, GetFaceThumbnailFileName(face));
            var exists = File.Exists(path);
            return Task.FromResult<IFileName>(new FileSystemFileName(path, exists));
        }
    }
}