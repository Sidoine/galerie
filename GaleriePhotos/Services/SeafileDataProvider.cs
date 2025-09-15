using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using System.Text;
using System.Linq;
using GaleriePhotos.Models;

namespace GaleriePhotos.Services
{
    /// <summary>
    /// Implementation of IDataProvider that uses Seafile Web API for cloud storage.
    /// </summary>
    public class SeafileDataProvider : AbstractDataProvider, IDataProvider, IDisposable
    {
        private readonly HttpClient _httpClient;
        private readonly string _serverUrl;
        private readonly string _apiKey;
        private readonly string _baseApiUrl;
        private readonly string _originalsLibraryId;
        private readonly string _thumbnailsLibraryId;

        public SeafileDataProvider(Gallery gallery)
        {
            if (gallery.SeafileServerUrl == null) throw new ArgumentNullException(nameof(gallery.SeafileServerUrl));
            if (gallery.SeafileApiKey == null) throw new ArgumentNullException(nameof(gallery.SeafileApiKey));
            _serverUrl = gallery.SeafileServerUrl.TrimEnd('/');
            _apiKey = gallery.SeafileApiKey;
            _baseApiUrl = $"{_serverUrl}/api/v2.1";
            _originalsLibraryId = gallery.RootDirectory;
            _thumbnailsLibraryId = gallery.ThumbnailsDirectory;

            _httpClient = new HttpClient();
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Token {_apiKey}");
        }

        /// <inheritdoc />
        public Task<bool> DirectoryExists(PhotoDirectory photoDirectory) => DirectoryExistsInternal(_originalsLibraryId, photoDirectory.Path);

        /// <inheritdoc />
        public Task<bool> FileExists(PhotoDirectory photoDirectory, Photo photo) => FileExistsInternal(_originalsLibraryId, Path.Combine(photoDirectory.Path, photo.FileName));

        /// <inheritdoc />
        public Task<IEnumerable<string>> GetFiles(PhotoDirectory photoDirectory) => GetFilesInternal(_originalsLibraryId, photoDirectory.Path);

        /// <inheritdoc />
        public Task<IEnumerable<string>> GetDirectories(PhotoDirectory photoDirectory) => GetDirectoriesInternal(_originalsLibraryId, photoDirectory.Path);

        /// <inheritdoc />
        public Task<DateTime> GetFileCreationTimeUtc(PhotoDirectory photoDirectory, Photo photo) => GetFileCreationTimeUtcInternal(_originalsLibraryId, Path.Combine(photoDirectory.Path, photo.FileName));

        /// <inheritdoc />
        public async Task CreateDirectory(PhotoDirectory photoDirectory)
        {
            try
            {
                await CreateDirectoryAsync(photoDirectory.Path);
            }
            catch (Exception ex)
            {
                throw new DirectoryServiceException($"Failed to create directory: {photoDirectory.Path}", ex);
            }
        }

        /// <inheritdoc />
        public async Task MoveFile(PhotoDirectory sourceDirectory, PhotoDirectory destinationDirectory, Photo photo)
        {
            var sourcePath = Path.Combine(sourceDirectory.Path, photo.FileName);
            var destinationPath = Path.Combine(destinationDirectory.Path, photo.FileName);
            var sourceFilePath = NormalizePath(sourcePath);
            var destFilePath = NormalizePath(destinationPath);

            var requestData = new
            {
                operation = "move",
                dst_repo = _originalsLibraryId,
                dst_dir = Path.GetDirectoryName(destFilePath) ?? "/",
                file_names = new[] { Path.GetFileName(sourceFilePath) }
            };

            var content = new StringContent(JsonSerializer.Serialize(requestData), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync($"{_baseApiUrl}/repos/{_originalsLibraryId}/fileops/", content);
            response.EnsureSuccessStatusCode();
        }

        /// <inheritdoc />
        public async Task<byte[]> ReadFileBytes(PhotoDirectory directory, Photo photo)
        {
            return await ReadFileBytesAsync(_originalsLibraryId, Path.Combine(directory.Path, photo.FileName));
        }

        /// <inheritdoc />
        public async Task<Stream?> OpenFileRead(PhotoDirectory directory, Photo photo)
        {
            var path = Path.Combine(directory.Path, photo.FileName);

            return await ReadStreamAsync(_originalsLibraryId, path);
        }

        /// <inheritdoc />
        public async Task WriteFileBytesAsync(string path, byte[] content)
        {
            await WriteFileBytesAsync(_originalsLibraryId, path, content);
        }

        public async Task WriteFileBytesAsync(string repository, string path, byte[] content)
        {
            try
            {
                var filePath = NormalizePath(path);

                // Get upload link
                var uploadLinkResponse = await _httpClient.GetAsync($"{_baseApiUrl}/repos/{repository}/upload-link/");
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

        private async Task<bool> DirectoryExistsInternal(string libraryId, string path)
        {
            try
            {
                var dirPath = NormalizePath(path);
                var response = await _httpClient.GetAsync($"{_baseApiUrl}/repos/{libraryId}/dir/?p={Uri.EscapeDataString(dirPath)}");
                return response.IsSuccessStatusCode;
            }
            catch
            {
                return false;
            }
        }

        private async Task<bool> FileExistsInternal(string libraryId, string path)
        {
            try
            {
                var filePath = NormalizePath(path);
                var response = await _httpClient.GetAsync($"{_baseApiUrl}/repos/{libraryId}/file/detail/?p={Uri.EscapeDataString(filePath)}");
                return response.IsSuccessStatusCode;
            }
            catch
            {
                return false;
            }
        }

        private async Task<IEnumerable<string>> GetFilesInternal(string libraryId, string path)
        {
            try
            {
                var dirPath = NormalizePath(path);
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

        private async Task<IEnumerable<string>> GetDirectoriesInternal(string libraryId, string path)
        {
            try
            {
                var dirPath = NormalizePath(path);
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

        private async Task<DateTime> GetFileCreationTimeUtcInternal(string libraryId, string path)
        {
            try
            {
                var filePath = NormalizePath(path);
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
            var libraryId = _originalsLibraryId;
            var dirPath = NormalizePath(path);
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

        private async Task<Stream?> ReadStreamAsync(string libraryId, string path)
        {
            var filePath = NormalizePath(path);

            // Get download link
            var downloadLinkResponse = await _httpClient.GetAsync($"{_baseApiUrl}/repos/{libraryId}/file/?p={Uri.EscapeDataString(filePath)}");
            if (downloadLinkResponse.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return null;
            }

            downloadLinkResponse.EnsureSuccessStatusCode();

            var downloadLinkJson = await downloadLinkResponse.Content.ReadAsStringAsync();
            var downloadLink = JsonSerializer.Deserialize<JsonElement>(downloadLinkJson).GetString();

            // Download file content
            var response = await _httpClient.GetAsync(downloadLink);
            response.EnsureSuccessStatusCode();

            return await response.Content.ReadAsStreamAsync();
        }


        private async Task<byte[]> ReadFileBytesAsync(string libraryId, string path)
        {
            var filePath = NormalizePath(path);

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

        // Normalize relative paths to start with '/'
        private static string NormalizePath(string path)
        {
            if (string.IsNullOrWhiteSpace(path)) return "/";
            var trimmed = path.Trim();
            return trimmed.StartsWith('/') ? trimmed : "/" + trimmed;
        }

        // Thumbnail specialized implementations (use thumbnails library id)
        public Task<bool> ThumbnailExists(Photo photo) => FileExistsInternal(_thumbnailsLibraryId, GetThumbnailFileName(photo));

        public async Task<byte[]> ReadThumbnailBytes(string path)
        {
            var libraryId = _thumbnailsLibraryId;
            var filePath = NormalizePath(path);
            var downloadLinkResponse = await _httpClient.GetAsync($"{_baseApiUrl}/repos/{libraryId}/file/?p={Uri.EscapeDataString(filePath)}");
            downloadLinkResponse.EnsureSuccessStatusCode();
            var downloadLinkJson = await downloadLinkResponse.Content.ReadAsStringAsync();
            var downloadLink = JsonSerializer.Deserialize<JsonElement>(downloadLinkJson).GetString();
            var response = await _httpClient.GetAsync(downloadLink);
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsByteArrayAsync();
        }

        public async Task<IFileName> GetLocalFileName(PhotoDirectory directory, Photo photo)
        {
            var localPath = Path.Combine(Path.GetTempPath(), $"{Guid.NewGuid()}.{Path.GetExtension(photo.FileName)}");
            using var stream = await ReadStreamAsync(_originalsLibraryId, Path.Combine(directory.Path, photo.FileName));
            if (stream == null) return new SeafileFileName(localPath, this, _originalsLibraryId, Path.Combine(directory.Path, photo.FileName), false);
            using var fileStream = File.Create(localPath);
            await stream.CopyToAsync(fileStream);
            return new SeafileFileName(localPath, this, _originalsLibraryId, Path.Combine(directory.Path, photo.FileName), true);
        }

        public async Task<IFileName> GetLocalThumbnailFileName(Photo photo)
        {
            var localPath = Path.Combine(Path.GetTempPath(), $"{Guid.NewGuid()}.jpg");
            using var stream = await ReadStreamAsync(_thumbnailsLibraryId, GetThumbnailFileName(photo));
            if (stream == null) return new SeafileFileName(localPath, this, _thumbnailsLibraryId, GetThumbnailFileName(photo), false);
            using var fileStream = File.Create(localPath);
            await stream.CopyToAsync(fileStream);
            return new SeafileFileName(localPath, this, _thumbnailsLibraryId, GetThumbnailFileName(photo), true);
        }

        public async Task<Stream?> OpenThumbnailRead(Photo photo)
        {
            return await ReadStreamAsync(_thumbnailsLibraryId, GetThumbnailFileName(photo));
        }

        public async Task WriteThumbnailBytesAsync(string path, byte[] content)
        {
            var libraryId = _thumbnailsLibraryId;
            var filePath = NormalizePath(path);
            var uploadLinkResponse = await _httpClient.GetAsync($"{_baseApiUrl}/repos/{libraryId}/upload-link/");
            uploadLinkResponse.EnsureSuccessStatusCode();
            var uploadLinkJson = await uploadLinkResponse.Content.ReadAsStringAsync();
            var uploadLink = JsonSerializer.Deserialize<JsonElement>(uploadLinkJson).GetString();
            using var formContent = new MultipartFormDataContent();
            formContent.Add(new StringContent(Path.GetDirectoryName(filePath) ?? "/"), "parent_dir");
            formContent.Add(new StringContent("1"), "replace");
            formContent.Add(new ByteArrayContent(content), "file", Path.GetFileName(filePath));
            var uploadResponse = await _httpClient.PostAsync(uploadLink, formContent);
            uploadResponse.EnsureSuccessStatusCode();
        }

        // (removed duplicate ThumbnailExists)

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