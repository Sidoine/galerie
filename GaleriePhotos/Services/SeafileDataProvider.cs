using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using System.Text;
using System.Linq;

namespace GaleriePhotos.Services
{
    /// <summary>
    /// Implementation of IDataProvider that uses Seafile Web API for cloud storage.
    /// </summary>
    public class SeafileDataProvider : IDataProvider, IDisposable
    {
        private readonly HttpClient _httpClient;
        private readonly string _serverUrl;
        private readonly string _apiKey;
        private readonly string _baseApiUrl;

        public SeafileDataProvider(string serverUrl, string apiKey)
        {
            _serverUrl = serverUrl.TrimEnd('/');
            _apiKey = apiKey;
            _baseApiUrl = $"{_serverUrl}/api/v2.1";
            
            _httpClient = new HttpClient();
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Token {_apiKey}");
        }

        /// <inheritdoc />
        public bool DirectoryExists(string path)
        {
            // For Seafile, we'll treat this as checking if the path exists as a directory
            // This is a synchronous wrapper around an async operation
            try
            {
                return DirectoryExistsAsync(path).GetAwaiter().GetResult();
            }
            catch
            {
                return false;
            }
        }

        /// <inheritdoc />
        public bool FileExists(string path)
        {
            // For Seafile, we'll treat this as checking if the path exists as a file
            try
            {
                return FileExistsAsync(path).GetAwaiter().GetResult();
            }
            catch
            {
                return false;
            }
        }

        /// <inheritdoc />
        public IEnumerable<string> GetFiles(string path)
        {
            try
            {
                return GetFilesAsync(path).GetAwaiter().GetResult();
            }
            catch
            {
                return Enumerable.Empty<string>();
            }
        }

        /// <inheritdoc />
        public IEnumerable<string> GetDirectories(string path)
        {
            try
            {
                return GetDirectoriesAsync(path).GetAwaiter().GetResult();
            }
            catch
            {
                return Enumerable.Empty<string>();
            }
        }

        /// <inheritdoc />
        public DateTime GetFileCreationTimeUtc(string path)
        {
            // For Seafile, we'll return the modification time from file info
            try
            {
                return GetFileCreationTimeUtcAsync(path).GetAwaiter().GetResult();
            }
            catch
            {
                return DateTime.UtcNow;
            }
        }

        /// <inheritdoc />
        public void CreateDirectory(string path)
        {
            try
            {
                CreateDirectoryAsync(path).GetAwaiter().GetResult();
            }
            catch (Exception ex)
            {
                throw new DirectoryServiceException($"Failed to create directory: {path}", ex);
            }
        }

        /// <inheritdoc />
        public void MoveFile(string sourcePath, string destinationPath)
        {
            try
            {
                MoveFileAsync(sourcePath, destinationPath).GetAwaiter().GetResult();
            }
            catch (Exception ex)
            {
                throw new DirectoryServiceException($"Failed to move file from {sourcePath} to {destinationPath}", ex);
            }
        }

        /// <inheritdoc />
        public byte[] ReadFileBytes(string path)
        {
            try
            {
                return ReadFileBytesAsync(path).GetAwaiter().GetResult();
            }
            catch (Exception ex)
            {
                throw new FileNotFoundException($"Failed to read file: {path}", ex);
            }
        }

        /// <inheritdoc />
        public FileStream OpenFileRead(string path)
        {
            // For Seafile, we'll download the file to a temporary location and return a stream
            try
            {
                var bytes = ReadFileBytes(path);
                var tempPath = Path.GetTempFileName();
                File.WriteAllBytes(tempPath, bytes);
                return new FileStream(tempPath, FileMode.Open, FileAccess.Read, FileShare.Read, 4096, FileOptions.DeleteOnClose);
            }
            catch (Exception ex)
            {
                throw new FileNotFoundException($"Failed to open file for reading: {path}", ex);
            }
        }

        /// <inheritdoc />
        public async Task WriteFileBytesAsync(string path, byte[] content)
        {
            try
            {
                // Parse the path to get library and file path
                var (libraryId, filePath) = ParseSeafilePath(path);
                
                // Get upload link
                var uploadLinkResponse = await _httpClient.GetAsync($"{_baseApiUrl}/repos/{libraryId}/upload-link/");
                uploadLinkResponse.EnsureSuccessStatusCode();
                
                var uploadLinkJson = await uploadLinkResponse.Content.ReadAsStringAsync();
                var uploadLink = JsonSerializer.Deserialize<JsonElement>(uploadLinkJson).GetString();

                // Upload file
                using var formContent = new MultipartFormDataContent();
                formContent.Add(new StringContent(Path.GetDirectoryName(filePath) ?? "/"), "parent_dir");
                formContent.Add(new StringContent("1"), "replace");
                formContent.Add(new ByteArrayContent(content), "file", Path.GetFileName(filePath));

                var uploadResponse = await _httpClient.PostAsync(uploadLink, formContent);
                uploadResponse.EnsureSuccessStatusCode();
            }
            catch (Exception ex)
            {
                throw new DirectoryServiceException($"Failed to write file: {path}", ex);
            }
        }

        // Async helper methods for Seafile API operations

        private async Task<bool> DirectoryExistsAsync(string path)
        {
            try
            {
                var (libraryId, dirPath) = ParseSeafilePath(path);
                var response = await _httpClient.GetAsync($"{_baseApiUrl}/repos/{libraryId}/dir/?p={Uri.EscapeDataString(dirPath)}");
                return response.IsSuccessStatusCode;
            }
            catch
            {
                return false;
            }
        }

        private async Task<bool> FileExistsAsync(string path)
        {
            try
            {
                var (libraryId, filePath) = ParseSeafilePath(path);
                var response = await _httpClient.GetAsync($"{_baseApiUrl}/repos/{libraryId}/file/detail/?p={Uri.EscapeDataString(filePath)}");
                return response.IsSuccessStatusCode;
            }
            catch
            {
                return false;
            }
        }

        private async Task<IEnumerable<string>> GetFilesAsync(string path)
        {
            try
            {
                var (libraryId, dirPath) = ParseSeafilePath(path);
                var response = await _httpClient.GetAsync($"{_baseApiUrl}/repos/{libraryId}/dir/?p={Uri.EscapeDataString(dirPath)}");
                response.EnsureSuccessStatusCode();

                var json = await response.Content.ReadAsStringAsync();
                var items = JsonSerializer.Deserialize<JsonElement[]>(json);
                
                return items?
                    .Where(item => item.GetProperty("type").GetString() == "file")
                    .Select(item => Path.Combine(path, item.GetProperty("name").GetString()!))
                    .ToList() ?? Enumerable.Empty<string>();
            }
            catch
            {
                return Enumerable.Empty<string>();
            }
        }

        private async Task<IEnumerable<string>> GetDirectoriesAsync(string path)
        {
            try
            {
                var (libraryId, dirPath) = ParseSeafilePath(path);
                var response = await _httpClient.GetAsync($"{_baseApiUrl}/repos/{libraryId}/dir/?p={Uri.EscapeDataString(dirPath)}");
                response.EnsureSuccessStatusCode();

                var json = await response.Content.ReadAsStringAsync();
                var items = JsonSerializer.Deserialize<JsonElement[]>(json);
                
                return items?
                    .Where(item => item.GetProperty("type").GetString() == "dir")
                    .Select(item => Path.Combine(path, item.GetProperty("name").GetString()!))
                    .ToList() ?? Enumerable.Empty<string>();
            }
            catch
            {
                return Enumerable.Empty<string>();
            }
        }

        private async Task<DateTime> GetFileCreationTimeUtcAsync(string path)
        {
            try
            {
                var (libraryId, filePath) = ParseSeafilePath(path);
                var response = await _httpClient.GetAsync($"{_baseApiUrl}/repos/{libraryId}/file/detail/?p={Uri.EscapeDataString(filePath)}");
                response.EnsureSuccessStatusCode();

                var json = await response.Content.ReadAsStringAsync();
                var fileInfo = JsonSerializer.Deserialize<JsonElement>(json);
                
                if (fileInfo.TryGetProperty("mtime", out var mtimeElement))
                {
                    var mtime = mtimeElement.GetInt64();
                    return DateTimeOffset.FromUnixTimeSeconds(mtime).UtcDateTime;
                }
                
                return DateTime.UtcNow;
            }
            catch
            {
                return DateTime.UtcNow;
            }
        }

        private async Task CreateDirectoryAsync(string path)
        {
            var (libraryId, dirPath) = ParseSeafilePath(path);
            var parentDir = Path.GetDirectoryName(dirPath) ?? "/";
            var dirName = Path.GetFileName(dirPath);

            var requestData = new
            {
                operation = "mkdir",
                name = dirName
            };

            var content = new StringContent(JsonSerializer.Serialize(requestData), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync($"{_baseApiUrl}/repos/{libraryId}/dir/?p={Uri.EscapeDataString(parentDir)}", content);
            response.EnsureSuccessStatusCode();
        }

        private async Task MoveFileAsync(string sourcePath, string destinationPath)
        {
            var (sourceLibraryId, sourceFilePath) = ParseSeafilePath(sourcePath);
            var (destLibraryId, destFilePath) = ParseSeafilePath(destinationPath);

            if (sourceLibraryId != destLibraryId)
            {
                throw new NotSupportedException("Moving files between different Seafile libraries is not supported");
            }

            var requestData = new
            {
                operation = "move",
                dst_repo = destLibraryId,
                dst_dir = Path.GetDirectoryName(destFilePath) ?? "/",
                file_names = new[] { Path.GetFileName(sourceFilePath) }
            };

            var content = new StringContent(JsonSerializer.Serialize(requestData), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync($"{_baseApiUrl}/repos/{sourceLibraryId}/fileops/", content);
            response.EnsureSuccessStatusCode();
        }

        private async Task<byte[]> ReadFileBytesAsync(string path)
        {
            var (libraryId, filePath) = ParseSeafilePath(path);
            
            // Get download link
            var downloadLinkResponse = await _httpClient.GetAsync($"{_baseApiUrl}/repos/{libraryId}/file/?p={Uri.EscapeDataString(filePath)}");
            downloadLinkResponse.EnsureSuccessStatusCode();
            
            var downloadLinkJson = await downloadLinkResponse.Content.ReadAsStringAsync();
            var downloadLink = JsonSerializer.Deserialize<JsonElement>(downloadLinkJson).GetString();

            // Download file content
            var response = await _httpClient.GetAsync(downloadLink);
            response.EnsureSuccessStatusCode();
            
            return await response.Content.ReadAsByteArrayAsync();
        }

        /// <summary>
        /// Parses a Seafile path in format "libraryId/path/to/file" to extract library ID and file path.
        /// </summary>
        private (string libraryId, string filePath) ParseSeafilePath(string path)
        {
            if (string.IsNullOrEmpty(path))
                throw new ArgumentException("Path cannot be null or empty", nameof(path));

            var parts = path.TrimStart('/').Split('/', 2);
            if (parts.Length < 1)
                throw new ArgumentException("Invalid Seafile path format. Expected: libraryId/path/to/file", nameof(path));

            var libraryId = parts[0];
            var filePath = parts.Length > 1 ? "/" + parts[1] : "/";

            return (libraryId, filePath);
        }

        public void Dispose()
        {
            _httpClient?.Dispose();
        }
    }

    /// <summary>
    /// Exception thrown when directory service operations fail.
    /// </summary>
    public class DirectoryServiceException : Exception
    {
        public DirectoryServiceException(string message) : base(message) { }
        public DirectoryServiceException(string message, Exception innerException) : base(message, innerException) { }
    }
}