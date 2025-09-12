using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;

namespace GaleriePhotos.Services
{
    /// <summary>
    /// Provides abstracted access to file system operations for gallery data.
    /// Allows for different storage implementations (local file system, cloud storage, etc.)
    /// </summary>
    public interface IDataProvider
    {
        /// <summary>
        /// Checks if a directory exists at the specified path.
        /// </summary>
        /// <param name="path">The directory path to check.</param>
        /// <returns>True if the directory exists, false otherwise.</returns>
        bool DirectoryExists(string path);

        /// <summary>
        /// Checks if a file exists at the specified path.
        /// </summary>
        /// <param name="path">The file path to check.</param>
        /// <returns>True if the file exists, false otherwise.</returns>
        bool FileExists(string path);

        /// <summary>
        /// Gets all files in the specified directory.
        /// </summary>
        /// <param name="path">The directory path.</param>
        /// <returns>An enumerable of file paths in the directory.</returns>
        IEnumerable<string> GetFiles(string path);

        /// <summary>
        /// Gets all subdirectories in the specified directory.
        /// </summary>
        /// <param name="path">The directory path.</param>
        /// <returns>An enumerable of directory paths.</returns>
        IEnumerable<string> GetDirectories(string path);

        /// <summary>
        /// Gets the creation time of a file in UTC.
        /// </summary>
        /// <param name="path">The file path.</param>
        /// <returns>The UTC creation time of the file.</returns>
        DateTime GetFileCreationTimeUtc(string path);

        /// <summary>
        /// Creates a directory at the specified path.
        /// </summary>
        /// <param name="path">The directory path to create.</param>
        void CreateDirectory(string path);

        /// <summary>
        /// Moves a file from source to destination path.
        /// </summary>
        /// <param name="sourcePath">The source file path.</param>
        /// <param name="destinationPath">The destination file path.</param>
        void MoveFile(string sourcePath, string destinationPath);

        /// <summary>
        /// Reads all bytes from a file.
        /// </summary>
        /// <param name="path">The file path to read.</param>
        /// <returns>The file content as a byte array.</returns>
        byte[] ReadFileBytes(string path);

        /// <summary>
        /// Opens a file stream for reading.
        /// </summary>
        /// <param name="path">The file path to open.</param>
        /// <returns>A FileStream for reading the file.</returns>
        FileStream OpenFileRead(string path);

        /// <summary>
        /// Saves bytes to a file at the specified path.
        /// </summary>
        /// <param name="path">The file path to write to.</param>
        /// <param name="content">The content to write.</param>
        /// <returns>A task representing the asynchronous operation.</returns>
        Task WriteFileBytesAsync(string path, byte[] content);
    }
}