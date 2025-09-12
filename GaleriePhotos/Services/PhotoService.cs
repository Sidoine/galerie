using GaleriePhotos.Data;
using GaleriePhotos.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using System.Security.Claims;
using Xabe.FFmpeg;
using Xabe.FFmpeg.Downloader;

namespace GaleriePhotos.Services
{
    public class PhotoService
    {
        private const string PrivateDirectory = "Privé";

        private readonly IOptions<GalerieOptions> options;
        private readonly ApplicationDbContext applicationDbContext;
        private readonly ILogger<PhotoService> logger;
        private readonly DataService dataService;

        public static Dictionary<string, string> MimeTypes { get; } = new Dictionary<string, string>
        {
            { ".jpg", "image/jpeg" },
            { ".jpeg", "image/jpeg" },
            { ".png", "image/png" },
            { ".mp4", "video/mp4" },
            { ".mpg", "video/mpg" },
            { ".webm", "video/webm" },
            { ".webp", "image/webp" }
        };

        public PhotoService(IOptions<GalerieOptions> options, ApplicationDbContext applicationDbContext, ILogger<PhotoService> logger, DataService dataService)
        {
            this.options = options;
            this.applicationDbContext = applicationDbContext;
            this.logger = logger;
            this.dataService = dataService;
        }

        public string? GetAbsoluteDirectoryPath(string? relativeDirectoryPath)
        {
            var rootPath = options.Value.Root;
            if (relativeDirectoryPath != null && (relativeDirectoryPath.Contains("..") || relativeDirectoryPath.StartsWith("/"))) return null;
            if (rootPath == null) return null;
            var path = relativeDirectoryPath != null ? Path.Combine(rootPath, relativeDirectoryPath) : rootPath;
            var dataProvider = dataService.GetDefaultDataProvider();
            if (!dataProvider.DirectoryExists(path)) return null;
            return path;
        }

        public string? GetAbsoluteDirectoryPath(PhotoDirectory photoDirectory)
        {
            // Gallery property must be loaded for this method to work
            if (photoDirectory.Gallery.RootDirectory == null) return null;
            var path = Path.Combine(photoDirectory.Gallery.RootDirectory, photoDirectory.Path);
            var dataProvider = dataService.GetDataProvider(photoDirectory.Gallery);
            if (!dataProvider.DirectoryExists(path)) return null;
            return path;
        }

        public string? GetAbsoluteImagePath(PhotoDirectory photoDirectory, Photo photo)
        {
            if (options.Value.Root == null) return null;
            var photoDirectoryPath = GetAbsoluteDirectoryPath(photoDirectory);
            if (photoDirectoryPath == null) return null;
            var imagePath = Path.Combine(photoDirectoryPath, photo.FileName);
            var dataProvider = dataService.GetDataProvider(photoDirectory.Gallery);
            if (!dataProvider.FileExists(imagePath)) return null;
            return imagePath;
        }

        public async Task<PhotoDirectory> GetRootDirectory(Gallery gallery)
        {
            var root = applicationDbContext.PhotoDirectories
                .Include(pd => pd.Gallery)
                .FirstOrDefault(x => x.Path == "" && x.GalleryId == gallery.Id);
            if (root == null)
            {
                root = new PhotoDirectory("", 0, null, gallery.Id) { Gallery = gallery };
                applicationDbContext.PhotoDirectories.Add(root);
                await applicationDbContext.SaveChangesAsync();
            }

            return root;
        }

        // Get directory visibility from GalleryMember for a specific gallery
        public int GetDirectoryVisibility(ClaimsPrincipal claimsPrincipal, int galleryId)
        {
            var userId = claimsPrincipal.GetUserId();
            if (userId == null) return 0;

            var galleryMember = applicationDbContext.GalleryMembers
                .FirstOrDefault(gm => gm.UserId == userId && gm.GalleryId == galleryId);
            
            return galleryMember?.DirectoryVisibility ?? 0;
        }

        // Check directory visibility using GalleryMember
        public bool IsDirectoryVisible(ClaimsPrincipal claimsPrincipal, PhotoDirectory directory)
        {
            return claimsPrincipal.IsAdministrator() || 
                   (directory.Visibility & GetDirectoryVisibility(claimsPrincipal, directory.GalleryId)) != 0;
        }

        public static bool IsVideo(Photo photo)
        {
            return MimeTypes.TryGetValue(Path.GetExtension(photo.FileName).ToLowerInvariant(), out var mimeType) && mimeType.StartsWith("video");
        }

        public string GetMimeType(Photo photo)
        {
            return MimeTypes[Path.GetExtension(photo.FileName).ToLowerInvariant()];
        }

        public async Task<string?> GetThumbnailPath(PhotoDirectory photoDirectory, Photo photo)
        {
            // Use gallery-specific thumbnails directory, fallback to global setting for backwards compatibility
            var thumbnailsDirectory = photoDirectory.Gallery?.ThumbnailsDirectory ?? options.Value.ThumbnailsDirectory;
            if (thumbnailsDirectory == null || photoDirectory.Gallery == null) return null;
            var thumbnailPath = Path.Combine(thumbnailsDirectory, Path.ChangeExtension(photo.FileName, "jpg"));
            var dataProvider = dataService.GetDataProvider(photoDirectory.Gallery);
            if (!dataProvider.FileExists(thumbnailPath))
            {
                var imagePath = GetAbsoluteImagePath(photoDirectory, photo);
                if (imagePath == null) return null;

                if (IsVideo(photo))
                {
                    IConversion conversion = await FFmpeg.Conversions.FromSnippet.Snapshot(imagePath, thumbnailPath, TimeSpan.FromSeconds(0));
                    IConversionResult result = await conversion.Start();
                }
                else
                {
                    using var image = await Image.LoadAsync(imagePath);
                    image.Mutate(x => x.Resize(new ResizeOptions { Mode = ResizeMode.Min, Size = new Size { Width = 400, Height = 400 } }));
                    image.Save(thumbnailPath);
                }
            }
            return thumbnailPath;
        }

        public int GetNumberOfPhotos(PhotoDirectory photoDirectory)
        {
            var path = GetAbsoluteDirectoryPath(photoDirectory);
            if (path == null) return 0;

            return GetDirectoryPhotosFileNames(path, photoDirectory).Length;
        }

        private string[] GetDirectoryPhotosFileNames(string path, PhotoDirectory photoDirectory)
        {
            var dataProvider = dataService.GetDataProvider(photoDirectory.Gallery);
            return dataProvider.GetFiles(path).Select(x => Path.GetFileName(x)).Where(x => MimeTypes.ContainsKey(Path.GetExtension(x).ToLowerInvariant())).ToArray();
        }

        public async Task<Photo[]?> GetDirectoryImages(PhotoDirectory photoDirectory)
        {
            var path = GetAbsoluteDirectoryPath(photoDirectory);
            if (path == null) return null;

            var fileNames = GetDirectoryPhotosFileNames(path, photoDirectory);

            var photos = await applicationDbContext.Photos.Where(x => fileNames.Contains(x.FileName)).ToListAsync();

            var duplicates = photos.GroupBy(x => x.FileName).Where(x => x.Count() > 1).ToArray();
            foreach (var duplicate in duplicates)
            {
                var toDelete = duplicate.OrderBy(x => x.Id).Skip(1).ToArray();
                applicationDbContext.Photos.RemoveRange(toDelete);
            }

            foreach (var fileName in fileNames)
            {
                if (!photos.Any(x => x.FileName == fileName))
                {
                    var photo = new Photo(fileName) { Gallery = photoDirectory.Gallery };
                    photo.GalleryId = photoDirectory.GalleryId;
                    var imagePath = Path.Combine(path, fileName);

                    if (!IsVideo(photo))
                    {
                        using var fileStream = new FileStream(imagePath, FileMode.Open);
                        try
                        {
                            var image = Image.Identify(fileStream);
                            if (image.Metadata.ExifProfile != null)
                            {
                                var dateTimeValue = image.Metadata.ExifProfile.Values.FirstOrDefault(x => x.Tag == SixLabors.ImageSharp.Metadata.Profiles.Exif.ExifTag.DateTime);
                                if (dateTimeValue != null)
                                {
                                    if (DateTime.TryParseExact((string)dateTimeValue.GetValue()!, "yyyy:MM:dd HH:mm:ss", CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
                                    {
                                        photo.DateTime = DateTime.SpecifyKind(date, DateTimeKind.Utc);
                                    }
                                }

                                var latitudeValue = image.Metadata.ExifProfile.Values.FirstOrDefault(x => x.Tag == SixLabors.ImageSharp.Metadata.Profiles.Exif.ExifTag.GPSLatitude);
                                var latitudeRef = image.Metadata.ExifProfile.Values.FirstOrDefault(x => x.Tag == SixLabors.ImageSharp.Metadata.Profiles.Exif.ExifTag.GPSLatitudeRef);
                                if (latitudeValue != null && latitudeRef != null) photo.Latitude = Convert((string)latitudeRef.GetValue()!, (Rational[])latitudeValue.GetValue()!);
                                var longitudeValue = image.Metadata.ExifProfile.Values.FirstOrDefault(x => x.Tag == SixLabors.ImageSharp.Metadata.Profiles.Exif.ExifTag.GPSLongitude);
                                var longitudeRef = image.Metadata.ExifProfile.Values.FirstOrDefault(x => x.Tag == SixLabors.ImageSharp.Metadata.Profiles.Exif.ExifTag.GPSLongitudeRef);
                                if (longitudeValue != null && longitudeRef != null) photo.Longitude = Convert((string)longitudeRef.GetValue()!, (Rational[])longitudeValue.GetValue()!);
                                var camera = image.Metadata.ExifProfile.Values.FirstOrDefault(x => x.Tag == SixLabors.ImageSharp.Metadata.Profiles.Exif.ExifTag.Model);
                                if (camera != null) photo.Camera = (string)camera.GetValue()!;
                            }
                        }
                        catch { }
                    }

                    if (photo.DateTime == default)
                    {
                        var dataProvider = dataService.GetDataProvider(photoDirectory.Gallery);
                        photo.DateTime = dataProvider.GetFileCreationTimeUtc(imagePath);
                    }

                    applicationDbContext.Photos.Add(photo);
                    photos.Add(photo);
                }
            }

            await applicationDbContext.SaveChangesAsync();

            if (photoDirectory.CoverPhotoId == null && photos.Count > 0)
            {
                photoDirectory.CoverPhotoId = photos.First().Id;
                applicationDbContext.Update(photoDirectory);
                await applicationDbContext.SaveChangesAsync();
            }

            return photos.OrderBy(x => x.DateTime).ToArray();
        }

        public async Task<PhotoDirectory?> GetPhotoDirectoryAsync(int id)
        {
            return await applicationDbContext.PhotoDirectories.Include(x => x.Gallery).FirstOrDefaultAsync(x => x.Id == id);
        }

        public async Task<PhotoDirectory[]?> GetSubDirectories(PhotoDirectory photoDirectory)
        {
            var photoDirectoryPath = GetAbsoluteDirectoryPath(photoDirectory);
            if (photoDirectoryPath == null) return null;
            var dataProvider = dataService.GetDataProvider(photoDirectory.Gallery);
            string[] directoryPaths = GetSubDirectoryPaths(photoDirectory, photoDirectoryPath, dataProvider);
            var directories = await applicationDbContext.PhotoDirectories.Include(x => x.Gallery).Where(x => directoryPaths.Contains(x.Path)).ToListAsync();
            foreach (var path in directoryPaths)
            {
                if (!directories.Any(x => x.Path == path))
                {
                    var subPhotoDirectory = new PhotoDirectory(path, 0, null)
                    { 
                        Gallery = photoDirectory.Gallery,
                        GalleryId = photoDirectory.GalleryId
                    };
                    applicationDbContext.PhotoDirectories.Add(subPhotoDirectory);
                    directories.Add(subPhotoDirectory);
                }
            }

            var numberOfPhotosInDirectory = GetNumberOfPhotos(photoDirectory);
            logger.LogInformation($"Récupération des sous-dossiers de {photoDirectory.Path} ({photoDirectory.Id}) ({numberOfPhotosInDirectory} photos, {directories.Count} sous-dossiers). Couverture : {photoDirectory.CoverPhotoId}.");
            if (photoDirectory.CoverPhotoId == null && GetNumberOfPhotos(photoDirectory) == 0 && directories.Count > 0)
            {
                var newCoverPhotoId = directories.FirstOrDefault(x => x.CoverPhotoId.HasValue)?.CoverPhotoId;
                logger.LogInformation($"Mise-à-jour de la photo de couverture de {photoDirectory.Path} en {newCoverPhotoId}");
                photoDirectory.CoverPhotoId = newCoverPhotoId;
                applicationDbContext.Update(photoDirectory);
            }

            await applicationDbContext.SaveChangesAsync();
            return directories.OrderBy(x => x.Path).ToArray();
        }

        public void MoveToPrivate(PhotoDirectory photoDirectory, Photo photo)
        {
            if (photoDirectory.Path.EndsWith(PrivateDirectory)) return;
            var photoDirectoryPath = GetAbsoluteDirectoryPath(photoDirectory);
            if (photoDirectoryPath == null) return;
            var currentPath = Path.Combine(photoDirectoryPath, photo.FileName);
            var newPath = Path.Combine(photoDirectoryPath, PrivateDirectory, photo.FileName);
            string privateDirectoryPath = Path.Combine(photoDirectoryPath, PrivateDirectory);
            var dataProvider = dataService.GetDataProvider(photoDirectory.Gallery);
            if (!dataProvider.DirectoryExists(privateDirectoryPath)) dataProvider.CreateDirectory(Path.Combine(photoDirectoryPath, PrivateDirectory));
            dataProvider.MoveFile(currentPath, newPath);
        }

        public bool IsPrivate(PhotoDirectory photoDirectory)
        {
            return photoDirectory.Path.EndsWith(PrivateDirectory);
        }

        public void MoveToPublic(PhotoDirectory photoDirectory, Photo photo)
        {
            if (!photoDirectory.Path.EndsWith(PrivateDirectory)) return;
            var photoDirectoryPath = GetAbsoluteDirectoryPath(photoDirectory);
            if (photoDirectoryPath == null) return;
            var currentPath = Path.Combine(photoDirectoryPath, photo.FileName);
            var newPath = Path.Combine(photoDirectoryPath, "..", photo.FileName);
            var dataProvider = dataService.GetDataProvider(photoDirectory.Gallery);
            dataProvider.MoveFile(currentPath, newPath);
        }

        private static string[] GetSubDirectoryPaths(PhotoDirectory photoDirectory, string photoDirectoryPath, IDataProvider dataProvider)
        {
            var directoryAbsolutePaths = dataProvider.GetDirectories(photoDirectoryPath);
            var directoryPaths = directoryAbsolutePaths.Select(x => Path.GetFileName(x)).Where(x => !x.StartsWith(".") && !x.StartsWith("_")).Select(x => Path.Combine(photoDirectory.Path, x)).ToArray();
            return directoryPaths;
        }

        internal int GetNumberOfSubDirectories(PhotoDirectory photoDirectory)
        {
            var photoDirectoryPath = GetAbsoluteDirectoryPath(photoDirectory);
            if (photoDirectoryPath == null) return 0;
            var dataProvider = dataService.GetDataProvider(photoDirectory.Gallery);
            return GetSubDirectoryPaths(photoDirectory, photoDirectoryPath, dataProvider).Length;
        }

        private static double Convert(string reference, Rational[] values)
        {
            double v = 0;
            double ratio = 1;
            for (var i = 0; i < values.Length; i++)
            {
                v += values[i].Numerator * ratio / values[i].Denominator;
                ratio /= 60;
            }
            if (reference.ToUpperInvariant() == "S" || reference.ToUpperInvariant() == "W")
            {
                v = -v;
            }
            return v;
        }

        /// <summary>
        /// Fait pivoter une photo de 90°, 180° ou 270° dans le sens horaire.
        /// </summary>
        /// <param name="photoDirectory">Le répertoire contenant la photo.</param>
        /// <param name="photo">La photo à faire pivoter.</param>
        /// <param name="angle">L'angle de rotation (90, 180 ou 270 degrés).</param>
        /// <returns>True si la rotation a réussi, false sinon.</returns>
        public async Task<bool> RotatePhoto(PhotoDirectory photoDirectory, Photo photo, int angle)
        {
            if (angle != 90 && angle != 180 && angle != 270)
                throw new ArgumentException("L'angle doit être 90, 180 ou 270.", nameof(angle));

            var imagePath = GetAbsoluteImagePath(photoDirectory, photo);
            var thumbnailPath = await GetThumbnailPath(photoDirectory, photo);
            var dataProvider = dataService.GetDataProvider(photoDirectory.Gallery);
            
            if (imagePath == null || !dataProvider.FileExists(imagePath) || thumbnailPath == null || !dataProvider.FileExists(thumbnailPath))
                return false;

            
            try
            {
                using var image = await Image.LoadAsync(imagePath);
                using var thumbnail = await Image.LoadAsync(thumbnailPath);
                switch (angle)
                {
                    case 90:
                        image.Mutate(x => x.Rotate(RotateMode.Rotate90));
                        thumbnail.Mutate(x => x.Rotate(RotateMode.Rotate90));
                        break;
                    case 180:
                        image.Mutate(x => x.Rotate(RotateMode.Rotate180));
                        thumbnail.Mutate(x => x.Rotate(RotateMode.Rotate180));
                        break;
                    case 270:
                        image.Mutate(x => x.Rotate(RotateMode.Rotate270));
                        thumbnail.Mutate(x => x.Rotate(RotateMode.Rotate270));
                        break;
                }
                await image.SaveAsync(imagePath);
                await thumbnail.SaveAsync(thumbnailPath);
                return true;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, $"Erreur lors de la rotation de la photo {photo.FileName}.");
                return false;
            }
        }
    }
}
