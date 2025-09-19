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
        private GalleryMember? GetGalleryMember(ClaimsPrincipal claimsPrincipal, int galleryId)
        {
            var userId = claimsPrincipal.GetUserId();
            if (userId == null) return null;

            var galleryMember = applicationDbContext.GalleryMembers
                .FirstOrDefault(gm => gm.UserId == userId && gm.GalleryId == galleryId);

            return galleryMember;
        }

        // Check directory visibility using GalleryMember
        public bool IsDirectoryVisible(ClaimsPrincipal claimsPrincipal, PhotoDirectory directory)
        {
            if (claimsPrincipal.IsAdministrator()) return true;
            var galleryMember = GetGalleryMember(claimsPrincipal, directory.GalleryId);
            if (galleryMember == null) return false;
            return galleryMember.IsAdministrator ||
                   (directory.Visibility & galleryMember.DirectoryVisibility) != 0;
        }

        public static bool IsVideo(Photo photo)
        {
            return MimeTypes.TryGetValue(Path.GetExtension(photo.FileName).ToLowerInvariant(), out var mimeType) && mimeType.StartsWith("video");
        }

        public string GetMimeType(Photo photo)
        {
            return MimeTypes[Path.GetExtension(photo.FileName).ToLowerInvariant()];
        }


        public async Task<Stream?> GetThumbnail(PhotoDirectory photoDirectory, Photo photo)
        {
            var dataProvider = dataService.GetDataProvider(photoDirectory.Gallery);
            if (!await dataProvider.ThumbnailExists(photo))
            {
                using var imagePath = await dataProvider.GetLocalFileName(photoDirectory, photo);
                if (imagePath == null) return null;
                using var thumbnailPath = await dataProvider.GetLocalThumbnailFileName(photo);
                if (IsVideo(photo))
                {
                    IConversion conversion = await FFmpeg.Conversions.FromSnippet.Snapshot(imagePath.Path, thumbnailPath.Path, TimeSpan.FromSeconds(0));
                    IConversionResult result = await conversion.Start();
                }
                else
                {
                    using var image = await Image.LoadAsync(imagePath.Path);
                    image.Mutate(x => x.Resize(new ResizeOptions { Mode = ResizeMode.Min, Size = new Size { Width = 400, Height = 400 } }));
                    image.Save(thumbnailPath.Path);
                }
                await thumbnailPath.SaveChanges();
            }
            return await dataProvider.OpenThumbnailRead(photo);
        }

        public async Task<int> GetNumberOfPhotos(PhotoDirectory photoDirectory)
        {
            var fileNames = await GetDirectoryPhotosFileNames(photoDirectory);
            return fileNames.Length;
        }

        private async Task<string[]> GetDirectoryPhotosFileNames(PhotoDirectory photoDirectory)
        {
            var dataProvider = dataService.GetDataProvider(photoDirectory.Gallery);
            var files = await dataProvider.GetFiles(photoDirectory);
            return files.Select(x => Path.GetFileName(x)).Where(x => MimeTypes.ContainsKey(Path.GetExtension(x).ToLowerInvariant())).ToArray();
        }

        public async Task<Photo[]?> GetDirectoryImages(PhotoDirectory photoDirectory)
        {
            var fileNames = await GetDirectoryPhotosFileNames(photoDirectory);

            var photos = await applicationDbContext.Photos.Where(x => fileNames.Contains(x.FileName)).ToListAsync();

            var duplicates = photos.GroupBy(x => x.FileName).Where(x => x.Count() > 1).ToArray();
            foreach (var duplicate in duplicates)
            {
                var toDelete = duplicate.OrderBy(x => x.Id).Skip(1).ToArray();
                applicationDbContext.Photos.RemoveRange(toDelete);
            }

            var dataProvider = dataService.GetDataProvider(photoDirectory.Gallery);

            foreach (var fileName in fileNames)
            {
                if (!photos.Any(x => x.FileName == fileName))
                {
                    var photo = new Photo(fileName) { Gallery = photoDirectory.Gallery };
                    photo.GalleryId = photoDirectory.GalleryId;

                    if (!IsVideo(photo))
                    {
                        using var fileStream = await dataProvider.OpenFileRead(photoDirectory, photo);
                        if (fileStream == null) continue;
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
                        photo.DateTime = await dataProvider.GetFileCreationTimeUtc(photoDirectory, photo);
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
            return await applicationDbContext.PhotoDirectories.Include(x => x.Gallery).ThenInclude(x => x.Members).FirstOrDefaultAsync(x => x.Id == id);
        }

        public async Task<PhotoDirectory[]?> GetSubDirectories(PhotoDirectory photoDirectory)
        {
            var dataProvider = dataService.GetDataProvider(photoDirectory.Gallery);
            string[] directoryPaths = await GetSubDirectoryPaths(photoDirectory);
            var directories = await applicationDbContext.PhotoDirectories.Include(x => x.Gallery).Where(x => directoryPaths.Contains(x.Path) && x.GalleryId == photoDirectory.GalleryId).ToListAsync();
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

            var numberOfPhotosInDirectory = await GetNumberOfPhotos(photoDirectory);
            logger.LogInformation($"Récupération des sous-dossiers de {photoDirectory.Path} ({photoDirectory.Id}) ({numberOfPhotosInDirectory} photos, {directories.Count} sous-dossiers). Couverture : {photoDirectory.CoverPhotoId}.");
            if (photoDirectory.CoverPhotoId == null && await GetNumberOfPhotos(photoDirectory) == 0 && directories.Count > 0)
            {
                var newCoverPhotoId = directories.FirstOrDefault(x => x.CoverPhotoId.HasValue)?.CoverPhotoId;
                logger.LogInformation($"Mise-à-jour de la photo de couverture de {photoDirectory.Path} en {newCoverPhotoId}");
                photoDirectory.CoverPhotoId = newCoverPhotoId;
                applicationDbContext.Update(photoDirectory);
            }

            await applicationDbContext.SaveChangesAsync();
            return directories.OrderBy(x => x.Path).ToArray();
        }

        public async Task<PhotoDirectory> GetPhotoDirectoryAsync(string path, Gallery gallery)
        {
            var directory = await applicationDbContext.PhotoDirectories.Include(x => x.Gallery).FirstOrDefaultAsync(x => x.Path == path && x.GalleryId == gallery.Id);
            if (directory == null)
            {
                directory = new PhotoDirectory(path, 0, null, gallery.Id) { Gallery = gallery };
                applicationDbContext.PhotoDirectories.Add(directory);
                await applicationDbContext.SaveChangesAsync();
            }
            return directory;
        }

        public async Task<PhotoDirectory> GetOrCreatePrivateDirectory(PhotoDirectory parentDirectory)
        {
            var privateDirectoryPath = Path.Combine(parentDirectory.Path, PrivateDirectory);
            var privateDirectory = await applicationDbContext.PhotoDirectories.Include(x => x.Gallery).FirstOrDefaultAsync(x => x.Path == privateDirectoryPath && x.GalleryId == parentDirectory.GalleryId);
            if (privateDirectory == null)
            {
                privateDirectory = new PhotoDirectory(privateDirectoryPath, 1, null)
                {
                    Gallery = parentDirectory.Gallery,
                    GalleryId = parentDirectory.GalleryId
                };
                applicationDbContext.PhotoDirectories.Add(privateDirectory);
                await applicationDbContext.SaveChangesAsync();
                var dataProvider = dataService.GetDataProvider(parentDirectory.Gallery);
                await dataProvider.CreateDirectory(privateDirectory);
            }
            return privateDirectory;
        }

        public async Task MoveToPrivate(PhotoDirectory photoDirectory, Photo photo)
        {
            if (IsPrivate(photoDirectory)) return;
            var privateDirectory = await GetOrCreatePrivateDirectory(photoDirectory);
            var dataProvider = dataService.GetDataProvider(photoDirectory.Gallery);
            await dataProvider.MoveFile(photoDirectory, privateDirectory, photo);
        }

        public bool IsPrivate(PhotoDirectory photoDirectory)
        {
            return photoDirectory.Path.EndsWith(PrivateDirectory);
        }

        public async Task MoveToPublic(PhotoDirectory photoDirectory, Photo photo)
        {
            if (!photoDirectory.Path.EndsWith(PrivateDirectory)) return;
            var newPath = Path.Combine(photoDirectory.Path, "..");
            var publicPath = await GetPhotoDirectoryAsync(newPath, photoDirectory.Gallery);
            var dataProvider = dataService.GetDataProvider(photoDirectory.Gallery);
            await dataProvider.MoveFile(photoDirectory, publicPath, photo);
        }

        private async Task<string[]> GetSubDirectoryPaths(PhotoDirectory photoDirectory)
        {
            var dataProvider = dataService.GetDataProvider(photoDirectory.Gallery);
            var directoryAbsolutePaths = await dataProvider.GetDirectories(photoDirectory);
            var directoryPaths = directoryAbsolutePaths.Select(x => Path.GetFileName(x)).Where(x => !x.StartsWith(".") && !x.StartsWith("_")).Select(x => Path.Combine(photoDirectory.Path, x)).ToArray();
            return directoryPaths;
        }

        internal async Task<int> GetNumberOfSubDirectories(PhotoDirectory photoDirectory)
        {
            return (await GetSubDirectoryPaths(photoDirectory)).Length;
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

            var dataProvider = dataService.GetDataProvider(photoDirectory.Gallery);

            using var imagePath = await dataProvider.GetLocalFileName(photoDirectory, photo);
            using var thumbnailFileName = await dataProvider.GetLocalThumbnailFileName(photo);

            if (!imagePath.Exists || !thumbnailFileName.Exists)
                return false;


            try
            {
                using var image = await Image.LoadAsync(imagePath.Path);
                using var thumbnail = await Image.LoadAsync(thumbnailFileName.Path);
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
                await image.SaveAsync(imagePath.Path);
                await thumbnail.SaveAsync(thumbnailFileName.Path);
                await imagePath.SaveChanges();
                await thumbnailFileName.SaveChanges();
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
