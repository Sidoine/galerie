using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;

namespace GaleriePhotos.Services
{
    /// <summary>
    /// Implementation of IDataProvider that uses the local file system.
    /// </summary>
    public class FileSystemProvider : IDataProvider
    {
        /// <inheritdoc />
        public bool DirectoryExists(string path)
        {
            return Directory.Exists(path);
        }

        /// <inheritdoc />
        public bool FileExists(string path)
        {
            return File.Exists(path);
        }

        /// <inheritdoc />
        public IEnumerable<string> GetFiles(string path)
        {
            return Directory.EnumerateFiles(path);
        }

        /// <inheritdoc />
        public IEnumerable<string> GetDirectories(string path)
        {
            return Directory.EnumerateDirectories(path);
        }

        /// <inheritdoc />
        public DateTime GetFileCreationTimeUtc(string path)
        {
            return File.GetCreationTimeUtc(path);
        }

        /// <inheritdoc />
        public void CreateDirectory(string path)
        {
            Directory.CreateDirectory(path);
        }

        /// <inheritdoc />
        public void MoveFile(string sourcePath, string destinationPath)
        {
            File.Move(sourcePath, destinationPath);
        }

        /// <inheritdoc />
        public byte[] ReadFileBytes(string path)
        {
            return File.ReadAllBytes(path);
        }

        /// <inheritdoc />
        public FileStream OpenFileRead(string path)
        {
            return new FileStream(path, FileMode.Open, FileAccess.Read);
        }

        /// <inheritdoc />
        public async Task WriteFileBytesAsync(string path, byte[] content)
        {
            await File.WriteAllBytesAsync(path, content);
        }
    }
}