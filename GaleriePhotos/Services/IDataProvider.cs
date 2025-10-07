using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using GaleriePhotos.Models;

namespace GaleriePhotos.Services
{
    /// <summary>
    /// Provides abstracted access to file system operations for gallery data.
    /// Allows for different storage implementations (local file system, cloud storage, etc.)
    /// </summary>
    public interface IDataProvider
    {
        /// <summary>
        /// Gets all files in the specified directory.
        /// </summary>
        /// <param name="directory">The directory to get files from.</param>
        /// <returns>Task resolving to an enumerable of file paths in the directory.</returns>
        Task<IEnumerable<string>> GetFiles(PhotoDirectory directory);

        /// <summary>
        /// Gets all subdirectories in the specified directory.
        /// </summary>
        /// <param name="directory">The directory to get subdirectories from.</param>
        /// <returns>Task resolving to an enumerable of directory paths.</returns>
        Task<IEnumerable<string>> GetDirectories(PhotoDirectory directory);

        /// <summary>
        /// Gets the creation time of a file in UTC.
        /// </summary>
        /// <param name="path">The file path.</param>
        /// <returns>Task resolving to the UTC creation time of the file.</returns>
        Task<DateTime> GetFileCreationTimeUtc(Photo photo);

        /// <summary>
        /// Creates a directory at the specified path.
        /// </summary>
        /// <param name="path">The directory path to create.</param>
        Task CreateDirectory(PhotoDirectory directory);

        /// <summary>
        /// Moves a file from source to destination path.
        /// </summary>
        /// <param name="sourcePath">The source file path.</param>
        /// <param name="destinationPath">The destination file path.</param>
        Task MoveFile(PhotoDirectory destinationDirectory, Photo photo);

        /// <summary>
        /// Opens a file stream for reading.
        /// </summary>
        /// <param name="path">The file path to open.</param>
        /// <returns>Task resolving to a FileStream for reading the file.</returns>
        Task<Stream?> OpenFileRead(Photo photo);

        // Thumbnail specialized operations
        /// <summary>
        /// Checks if a thumbnail exists at the specified path.
        /// </summary>
        /// <param name="path">The thumbnail path to check.</param>
        Task<bool> ThumbnailExists(Photo photo);

        /// <summary>
        /// Reads all bytes from a thumbnail file.
        /// </summary>
        /// <param name="path">The thumbnail path to read.</param>
        Task<Stream?> OpenThumbnailRead(Photo photo);

        Task<IFileName> GetLocalFileName(Photo photo);

        Task<IFileName> GetLocalThumbnailFileName(Photo photo);

        // Face thumbnail specialized operations
        /// <summary>
        /// Checks if a face thumbnail exists.
        /// </summary>
        /// <param name="face">The face to check thumbnail for.</param>
        Task<bool> FaceThumbnailExists(Face face);

        /// <summary>
        /// Opens a stream for reading a face thumbnail.
        /// </summary>
        /// <param name="face">The face to read thumbnail for.</param>
        Task<Stream?> OpenFaceThumbnailRead(Face face);

        /// <summary>
        /// Gets local filename for a face thumbnail.
        /// </summary>
        /// <param name="face">The face to get thumbnail filename for.</param>
        Task<IFileName> GetLocalFaceThumbnailFileName(Face face);

        bool IsSetup { get; }
    }
}