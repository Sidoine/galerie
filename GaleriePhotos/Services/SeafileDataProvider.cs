using GaleriePhotos.Models;
using GaleriePhotos.Services.Seafile;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

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
            _serverUrl = (gallery.SeafileServerUrl ?? "").TrimEnd('/');
            _apiKey = gallery.SeafileApiKey ?? "";
            _baseApiUrl = $"{_serverUrl}/api2";
            _originalsLibraryId = gallery.RootDirectory;
            _thumbnailsLibraryId = gallery.ThumbnailsDirectory;

            _httpClient = new HttpClient();
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Token {_apiKey}");
        }

        public bool IsSetup => !string.IsNullOrWhiteSpace(_originalsLibraryId) && !string.IsNullOrWhiteSpace(_thumbnailsLibraryId) && !string.IsNullOrWhiteSpace(_serverUrl) && !string.IsNullOrWhiteSpace(_apiKey);

        /// <inheritdoc />
        public Task<IEnumerable<string>> GetFiles(PhotoDirectory photoDirectory) => GetFilesInternal(_originalsLibraryId, photoDirectory.Path);

        /// <inheritdoc />
        public Task<IEnumerable<string>> GetDirectories(PhotoDirectory photoDirectory) => GetDirectoriesInternal(_originalsLibraryId, photoDirectory.Path);

        /// <inheritdoc />
        public Task<DateTime> GetFileCreationTimeUtc(Photo photo) => GetFileCreationTimeUtcInternal(_originalsLibraryId, Path.Combine(photo.Directory.Path, photo.FileName));

        /// <inheritdoc />
        public async Task CreateDirectory(PhotoDirectory photoDirectory)
        {
            await CreateDirectoryAsync(photoDirectory.Path);
        }

        /// <inheritdoc />
        public async Task MoveFile(PhotoDirectory destinationDirectory, Photo photo)
        {
            var sourcePath = Path.Combine(photo.Directory.Path, photo.FileName);
            var sourceFilePath = NormalizePath(sourcePath);
            var destFilePath = NormalizePath(destinationDirectory.Path);

            var requestData = new FormUrlEncodedContent(
            [
                new KeyValuePair<string, string>("operation", "move"),
                new KeyValuePair<string, string>("dst_repo", _originalsLibraryId),
                new KeyValuePair<string, string>("dst_dir", destFilePath ?? "/"),
            ]);

            var response = await _httpClient.PostAsync($"{_baseApiUrl}/repos/{_originalsLibraryId}/file/?p={Uri.EscapeDataString(sourceFilePath)}", requestData);
            if (response.StatusCode != System.Net.HttpStatusCode.MovedPermanently)
            {
                throw new Exception($"Moving file failed {response.StatusCode}, {response.ReasonPhrase}");
            }
        }

        /// <inheritdoc />
        public async Task<byte[]> ReadFileBytes(Photo photo)
        {
            return await ReadFileBytesAsync(_originalsLibraryId, Path.Combine(photo.Directory.Path, photo.FileName));
        }

        /// <inheritdoc />
        public async Task<Stream?> OpenFileRead(Photo photo)
        {
            var path = Path.Combine(photo.Directory.Path, photo.FileName);

            return await ReadStreamAsync(_originalsLibraryId, path);
        }

        public async Task WriteFileBytesAsync(string repository, string path, byte[] content)
        {
            var filePath = NormalizePath(path);
            var dirPath = NormalizePath(Path.GetDirectoryName(path) ?? "/");

            // Get upload link
            var uploadLinkResponse = await _httpClient.GetAsync($"{_baseApiUrl}/repos/{repository}/upload-link/?p={Uri.EscapeDataString(dirPath)}");
            uploadLinkResponse.EnsureSuccessStatusCode();

            var uploadLinkJson = await uploadLinkResponse.Content.ReadAsStringAsync();
            var uploadLink = JsonSerializer.Deserialize<string>(uploadLinkJson);

            // Upload file
            // The Seafile API server has a multipart implementation that is buggy, we need to
            // construct the multipart form data manually.
            using var formContent = new MultipartFormDataContent();

            var fileContent = new ByteArrayContent(content);
            fileContent.Headers.Add("Content-Type", "application/octet-stream");
            fileContent.Headers.ContentDisposition = new System.Net.Http.Headers.ContentDispositionHeaderValue("form-data")
            {
                Name = "\"file\"",
                FileName = $"\"{Path.GetFileName(filePath)}\""
            };
            formContent.Add(fileContent);

            var parentDirVariable = new StringContent(dirPath, Encoding.UTF8);
            parentDirVariable.Headers.Remove("Content-Type");
            parentDirVariable.Headers.ContentDisposition = new System.Net.Http.Headers.ContentDispositionHeaderValue("form-data")
            {
                Name = "\"parent_dir\""
            };
            formContent.Add(parentDirVariable);

            var replaceVariable = new StringContent("1", Encoding.UTF8);
            replaceVariable.Headers.Remove("Content-Type");
            replaceVariable.Headers.ContentDisposition = new System.Net.Http.Headers.ContentDispositionHeaderValue("form-data")
            {
                Name = "\"replace\""
            };
            formContent.Add(replaceVariable);


            var newClient = new HttpClient();
            var contentType = formContent.Headers.ContentType?.ToString() ?? "";
            formContent.Headers.Remove("Content-Type");
            formContent.Headers.Add("Content-Type", contentType.Replace("\"", ""));
            var uploadResponse = await newClient.PostAsync($"{uploadLink}?ret-json=1", formContent);
            if (!uploadResponse.IsSuccessStatusCode)
            {
                var err = await uploadResponse.Content.ReadAsStringAsync();
                throw new InvalidOperationException($"Upload failed ({uploadResponse.StatusCode}): {err}");
            }
        }

        // Async helper methods for Seafile API operations

        private async Task<bool> DirectoryExistsInternal(string libraryId, string path)
        {
            var dirPath = NormalizePath(path);
            var response = await _httpClient.GetAsync($"{_baseApiUrl}/repos/{libraryId}/dir/?p={Uri.EscapeDataString(dirPath)}");
            return response.IsSuccessStatusCode;
        }

        private async Task<bool> FileExistsInternal(string libraryId, string path)
        {
            var filePath = NormalizePath(path);
            var response = await _httpClient.GetAsync($"{_baseApiUrl}/repos/{libraryId}/file/detail/?p={Uri.EscapeDataString(filePath)}");
            return response.IsSuccessStatusCode;
        }

        private async Task<IEnumerable<string>> GetFilesInternal(string libraryId, string path)
        {
            var dirPath = NormalizePath(path);
            var response = await _httpClient.GetAsync($"{_baseApiUrl}/repos/{libraryId}/dir/?p={Uri.EscapeDataString(dirPath)}");
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            var items = JsonSerializer.Deserialize<SeafileDirItem[]>(json);

            return items?
                .Where(item => item.Type == "file")
                .Select(item => Path.Combine(path, item.Name))
                .ToList() ?? Enumerable.Empty<string>();
        }

        private async Task<IEnumerable<string>> GetDirectoriesInternal(string libraryId, string path)
        {
            var dirPath = NormalizePath(path);
            var response = await _httpClient.GetAsync($"{_baseApiUrl}/repos/{libraryId}/dir/?p={Uri.EscapeDataString(dirPath)}");
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            var items = JsonSerializer.Deserialize<SeafileDirItem[]>(json);

            return items?
                .Where(item => item.Type == "dir")
                .Select(item => Path.Combine(path, item.Name))
                .ToList() ?? Enumerable.Empty<string>();
        }

        private async Task<DateTime> GetFileCreationTimeUtcInternal(string libraryId, string path)
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

        private async Task CreateDirectoryAsync(string path)
        {
            await CreateDirectoryInternalAsync(_originalsLibraryId, path);
        }

        private async Task CreateDirectoryInternalAsync(string libraryId, string path)
        {
            var dirPath = NormalizePath(path);


            var content = new FormUrlEncodedContent(new[]
            {
                new KeyValuePair<string, string>("operation", "mkdir"),
            });
            var response = await _httpClient.PostAsync($"{_baseApiUrl}/repos/{libraryId}/dir/?p={Uri.EscapeDataString(dirPath)}", content);
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
            path = path.Replace('\\', '/');
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

        public async Task<IFileName> GetLocalFileName(Photo photo)
        {
            var localPath = Path.Combine(Path.GetTempPath(), $"{Guid.NewGuid()}{Path.GetExtension(photo.FileName)}");
            using var stream = await ReadStreamAsync(_originalsLibraryId, Path.Combine(photo.Directory.Path, photo.FileName));
            if (stream == null) return new SeafileFileName(localPath, this, _originalsLibraryId, Path.Combine(photo.Directory.Path, photo.FileName), false);
            using var fileStream = File.Create(localPath);
            await stream.CopyToAsync(fileStream);
            return new SeafileFileName(localPath, this, _originalsLibraryId, Path.Combine(photo.Directory.Path, photo.FileName), true);
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

        // Face thumbnail specialized operations
        public async Task<bool> FaceThumbnailExists(Face face)
        {
            var faceThumbnailPath = Path.Combine("faces", GetFaceThumbnailFileName(face));
            return await FileExistsInternal(_thumbnailsLibraryId, faceThumbnailPath);
        }

        public async Task<Stream?> OpenFaceThumbnailRead(Face face)
        {
            var faceThumbnailPath = Path.Combine("faces", GetFaceThumbnailFileName(face));
            return await ReadStreamAsync(_thumbnailsLibraryId, faceThumbnailPath);
        }

        public async Task<IFileName> GetLocalFaceThumbnailFileName(Face face)
        {
            if (!await DirectoryExistsInternal(_thumbnailsLibraryId, "faces"))
            {
                await CreateDirectoryInternalAsync(_thumbnailsLibraryId, "faces");
            }

            var localPath = Path.Combine(Path.GetTempPath(), $"{Guid.NewGuid()}.jpg");
            var faceThumbnailPath = Path.Combine("faces", GetFaceThumbnailFileName(face));
            using var stream = await ReadStreamAsync(_thumbnailsLibraryId, faceThumbnailPath);
            if (stream == null) return new SeafileFileName(localPath, this, _thumbnailsLibraryId, faceThumbnailPath, false);
            using var fileStream = File.Create(localPath);
            await stream.CopyToAsync(fileStream);
            return new SeafileFileName(localPath, this, _thumbnailsLibraryId, faceThumbnailPath, true);
        }

        public void Dispose()
        {
            _httpClient?.Dispose();
        }

        public Task<bool> DirectoryExists(PhotoDirectory photoDirectory)
        {
            return DirectoryExistsInternal(_originalsLibraryId, photoDirectory.Path);
        }

        public async Task RenameDirectory(PhotoDirectory photoDirectory, string newName)
        {
            var oldPath = NormalizePath(photoDirectory.Path);
            var parentPath = Path.GetDirectoryName(oldPath);
            var normalizedParentPath = NormalizePath(parentPath ?? "/");

            var requestData = new FormUrlEncodedContent(
            [
                new KeyValuePair<string, string>("operation", "rename"),
                new KeyValuePair<string, string>("newname", newName)
            ]);

            var response = await _httpClient.PostAsync($"{_baseApiUrl}/repos/{_originalsLibraryId}/dir/?p={Uri.EscapeDataString(oldPath)}", requestData);
            response.EnsureSuccessStatusCode();
        }
    }
}