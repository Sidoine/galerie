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
using System.Threading;
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

        private static readonly object ThumbnailSemaphoreLock = new object();
        private static SemaphoreSlim? thumbnailGenerationSemaphore;

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

            EnsureThumbnailSemaphore(options.Value.MaxConcurrentThumbnailGenerations);
        }

        private static void EnsureThumbnailSemaphore(int maxConcurrentGenerations)
        {
            var effectiveMax = Math.Max(1, maxConcurrentGenerations);
            if (thumbnailGenerationSemaphore != null)
            {
                return;
            }

            lock (ThumbnailSemaphoreLock)
            {
                if (thumbnailGenerationSemaphore == null)
                {
                    thumbnailGenerationSemaphore = new SemaphoreSlim(effectiveMax, effectiveMax);
                }
            }
        }

        public async Task<PhotoDirectory> GetRootDirectory(Gallery gallery)
        {
            var root = applicationDbContext.PhotoDirectories
                .Include(pd => pd.Gallery)
                .Include(x => x.CoverPhoto)
                .FirstOrDefault(x => (x.Path == "" || x.PhotoDirectoryType == PhotoDirectoryType.Root) && x.GalleryId == gallery.Id);
            if (root == null)
            {
                root = new PhotoDirectory("", 0, null, null, PhotoDirectoryType.Root) { Gallery = gallery };
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


        public async Task<Stream?> GetThumbnail(Photo photo)
        {
            var dataProvider = dataService.GetDataProvider(photo.Directory.Gallery);
            if (!await dataProvider.ThumbnailExists(photo))
            {
                var semaphore = thumbnailGenerationSemaphore ?? throw new InvalidOperationException("Thumbnail generation semaphore not initialized.");
                await semaphore.WaitAsync(); // throttle concurrent thumbnail generation
                try
                {
                    if (!await dataProvider.ThumbnailExists(photo))
                    {
                        using var imagePath = await dataProvider.GetLocalFileName(photo);
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
                }
                finally
                {
                    semaphore.Release();
                }
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

        public async Task<bool> DirectoryExists(PhotoDirectory photoDirectory)
        {
            var dataProvider = dataService.GetDataProvider(photoDirectory.Gallery);
            return await dataProvider.DirectoryExists(photoDirectory);
        }

        public async Task ScanDirectory(PhotoDirectory photoDirectory)
        {
            var dataProvider = dataService.GetDataProvider(photoDirectory.Gallery);

            // Scan for new photos
            var fileNames = await GetDirectoryPhotosFileNames(photoDirectory);

            var photos = await applicationDbContext.Photos.Where(x => fileNames.Contains(x.FileName) && x.DirectoryId == photoDirectory.Id).ToListAsync();

            foreach (var fileName in fileNames)
            {
                if (!photos.Any(x => x.FileName == fileName))
                {
                    var photo = new Photo(fileName) { Directory = photoDirectory };

                    if (!IsVideo(photo))
                    {
                        using var fileStream = await dataProvider.OpenFileRead(photo);
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
                        var inferredDate = PhotoFileNameDateHelper.DeduceCaptureDateFromFileName(photo.FileName);
                        if (inferredDate.HasValue)
                        {
                            photo.DateTime = inferredDate.Value;
                        }
                        else
                        {
                            photo.DateTime = await dataProvider.GetFileCreationTimeUtc(photo);
                        }
                    }

                    applicationDbContext.Photos.Add(photo);
                    photos.Add(photo);
                }
            }

            // Remove deleted photos
            foreach (var photo in photos)
            {
                if (!fileNames.Contains(photo.FileName))
                {
                    applicationDbContext.Photos.Remove(photo);
                }
            }

            await applicationDbContext.SaveChangesAsync();

            // Scan for subdirectories
            string[] directoryPaths = await GetSubDirectoryPaths(photoDirectory);
            var directories = await applicationDbContext.PhotoDirectories.Include(x => x.Gallery).Include(x => x.CoverPhoto).Where(x => directoryPaths.Contains(x.Path) && x.GalleryId == photoDirectory.GalleryId).ToListAsync();

            // Update existing directories and remove deleted ones
            foreach (var dir in directories)
            {
                if (!directoryPaths.Contains(dir.Path))
                {
                    applicationDbContext.PhotoDirectories.Remove(dir);
                }
                else
                {
                    dir.ParentDirectoryId = photoDirectory.Id;
                    dir.GalleryId = photoDirectory.GalleryId;
                    if (Path.GetFileName(dir.Path).Equals(PrivateDirectory, StringComparison.OrdinalIgnoreCase))
                    {
                        dir.PhotoDirectoryType = PhotoDirectoryType.Private;
                    }
                    else if (string.IsNullOrEmpty(dir.Path))
                    {
                        dir.PhotoDirectoryType = PhotoDirectoryType.Root;
                    }
                    else
                    {
                        dir.PhotoDirectoryType = PhotoDirectoryType.Regular;
                    }
                    applicationDbContext.PhotoDirectories.Update(dir);
                }
            }

            // Add new directories
            foreach (var path in directoryPaths)
            {
                if (!directories.Any(x => x.Path == path))
                {
                    var subPhotoDirectory = new PhotoDirectory(path, 0, null, photoDirectory.Id, path.EndsWith(PrivateDirectory) ? PhotoDirectoryType.Private : PhotoDirectoryType.Regular) { Gallery = photoDirectory.Gallery };
                    applicationDbContext.PhotoDirectories.Add(subPhotoDirectory);
                    directories.Add(subPhotoDirectory);
                }
            }

            await applicationDbContext.SaveChangesAsync();

            var numberOfPhotosInDirectory = await GetNumberOfPhotos(photoDirectory);
            logger.LogInformation($"Récupération des sous-dossiers de {photoDirectory.Path} ({photoDirectory.Id}) ({numberOfPhotosInDirectory} photos, {directories.Count} sous-dossiers). Couverture : {photoDirectory.CoverPhotoId}.");
            if (photoDirectory.CoverPhotoId == null && await GetNumberOfPhotos(photoDirectory) == 0 && directories.Count > 0)
            {
                var newCoverPhoto = directories.FirstOrDefault(x => x.CoverPhoto != null)?.CoverPhoto;
                logger.LogInformation($"Mise-à-jour de la photo de couverture de {photoDirectory.Path} en {newCoverPhoto?.Id}");
                photoDirectory.CoverPhotoId = newCoverPhoto?.Id;
                photoDirectory.CoverPhoto = newCoverPhoto;
                applicationDbContext.Update(photoDirectory);
            }

            await applicationDbContext.SaveChangesAsync();

            if (photoDirectory.Path == "" && photoDirectory.PhotoDirectoryType != PhotoDirectoryType.Root)
            {
                photoDirectory.PhotoDirectoryType = PhotoDirectoryType.Root;
                applicationDbContext.Update(photoDirectory);
                await applicationDbContext.SaveChangesAsync();
            }

            if (photoDirectory.CoverPhotoId == null && photos.Count > 0)
            {
                photoDirectory.CoverPhotoId = photos.First().Id;
                applicationDbContext.Update(photoDirectory);
                await applicationDbContext.SaveChangesAsync();
            }
        }

        public async Task<Photo[]?> GetDirectoryImages(PhotoDirectory photoDirectory)
        {
            return await applicationDbContext.Photos
                .Include(x => x.Place)
                .Where(x => x.DirectoryId == photoDirectory.Id)
                .ToArrayAsync();
        }

        public async Task<PhotoDirectory?> GetPhotoDirectoryAsync(int id)
        {
            return await applicationDbContext.PhotoDirectories.Include(x => x.Gallery).ThenInclude(x => x.Members).FirstOrDefaultAsync(x => x.Id == id);
        }

        public async Task<Photo?> GetPhoto(int id)
        {
            return await applicationDbContext.Photos
                .Include(x => x.Place)
                .Include(x => x.Directory)
                    .ThenInclude(x => x.Gallery)
                        .ThenInclude(x => x.Members)
                .FirstOrDefaultAsync(x => x.Id == id);
        }

        public async Task<Photo?> GetPhoto(Guid publicId)
        {
            return await applicationDbContext.Photos
                .Include(x => x.Place)
                .Include(x => x.Directory)
                    .ThenInclude(x => x.Gallery)
                        .ThenInclude(x => x.Members)
                .FirstOrDefaultAsync(x => x.PublicId == publicId);
        }

        public async Task<PhotoDirectory[]?> GetSubDirectories(PhotoDirectory photoDirectory)
        {
            return await applicationDbContext.PhotoDirectories.Include(x => x.Gallery).Include(x => x.CoverPhoto).Where(x => x.ParentDirectoryId == photoDirectory.Id).OrderBy(x => x.Path).ToArrayAsync();
        }

        public async Task<PhotoDirectory> GetOrCreatePrivateDirectory(PhotoDirectory parentDirectory)
        {
            var privateDirectoryPath = Path.Combine(parentDirectory.Path, PrivateDirectory);
            var privateDirectory = await applicationDbContext.PhotoDirectories.Include(x => x.Gallery).FirstOrDefaultAsync(x => x.Path == privateDirectoryPath && x.GalleryId == parentDirectory.GalleryId);
            if (privateDirectory == null)
            {
                privateDirectory = new PhotoDirectory(privateDirectoryPath, 1, null, parentDirectory.Id, PhotoDirectoryType.Private) { Gallery = parentDirectory.Gallery };
                applicationDbContext.PhotoDirectories.Add(privateDirectory);
                await applicationDbContext.SaveChangesAsync();
                var dataProvider = dataService.GetDataProvider(parentDirectory.Gallery);
                await dataProvider.CreateDirectory(privateDirectory);
            }
            return privateDirectory;
        }

        public async Task<PhotoDirectory?> GetParentDirectory(PhotoDirectory directory)
        {
            if (string.IsNullOrEmpty(directory.Path))
                return null;

            var parentPath = Path.GetDirectoryName(directory.Path);
            if (string.IsNullOrEmpty(parentPath))
                return null;

            return await applicationDbContext.PhotoDirectories
                .Include(x => x.Gallery)
                .FirstOrDefaultAsync(x => x.Path == parentPath && x.GalleryId == directory.GalleryId);
        }

        public async Task MoveToPrivate(Photo photo)
        {
            if (IsPrivate(photo.Directory)) return;
            var privateDirectory = await GetOrCreatePrivateDirectory(photo.Directory);
            var dataProvider = dataService.GetDataProvider(photo.Directory.Gallery);
            await dataProvider.MoveFile(privateDirectory, photo);
            photo.Directory = privateDirectory;
            photo.DirectoryId = privateDirectory.Id;
            applicationDbContext.Update(photo);
            await applicationDbContext.SaveChangesAsync();
        }

        public bool IsPrivate(PhotoDirectory photoDirectory)
        {
            return photoDirectory.PhotoDirectoryType == PhotoDirectoryType.Private;
        }

        public async Task MoveToPublic(Photo photo)
        {
            if (photo.Directory.PhotoDirectoryType != PhotoDirectoryType.Private || photo.Directory.ParentDirectoryId == null) return;
            var publicPath = await GetPhotoDirectoryAsync(photo.Directory.ParentDirectoryId.Value);
            if (publicPath == null) throw new InvalidOperationException("Le répertoire parent n'existe pas.");
            var dataProvider = dataService.GetDataProvider(photo.Directory.Gallery);
            await dataProvider.MoveFile(publicPath, photo);
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
        /// Calcule le rectangle (avec marge) contenant le visage, limité aux bornes de l'image.
        /// </summary>
        /// <param name="face">Le visage.</param>
        /// <param name="imageWidth">Largeur de l'image.</param>
        /// <param name="imageHeight">Hauteur de l'image.</param>
        /// <param name="padding">Marge relative (0.2 = 20%).</param>
        private static Rectangle CalculateFaceRectangle(Face face, int imageWidth, int imageHeight, float padding = 0.2f)
        {
            var paddedWidth = face.Width * (1 + padding * 2);
            var paddedHeight = face.Height * (1 + padding * 2);
            var paddedX = Math.Max(0, face.X - face.Width * padding);
            var paddedY = Math.Max(0, face.Y - face.Height * padding);

            // Limitation aux bornes de l'image
            paddedWidth = Math.Min(paddedWidth, imageWidth - paddedX);
            paddedHeight = Math.Min(paddedHeight, imageHeight - paddedY);

            return new Rectangle((int)paddedX, (int)paddedY, (int)paddedWidth, (int)paddedHeight);
        }

        /// <summary>
        /// Fait pivoter une photo de 90°, 180° ou 270° dans le sens horaire.
        /// </summary>
        /// <param name="photoDirectory">Le répertoire contenant la photo.</param>
        /// <param name="photo">La photo à faire pivoter.</param>
        /// <param name="angle">L'angle de rotation (90, 180 ou 270 degrés).</param>
        /// <returns>True si la rotation a réussi, false sinon.</returns>
        public async Task<bool> RotatePhoto(Photo photo, int angle)
        {
            if (angle != 90 && angle != 180 && angle != 270)
                throw new ArgumentException("L'angle doit être 90, 180 ou 270.", nameof(angle));

            var dataProvider = dataService.GetDataProvider(photo.Directory.Gallery);

            using var imagePath = await dataProvider.GetLocalFileName(photo);
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

        public async Task<Stream?> GetFaceThumbnail(Face face)
        {
            var photo = face.Photo;
            var dataProvider = dataService.GetDataProvider(photo.Directory.Gallery);

            if (!await dataProvider.FaceThumbnailExists(face))
            {
                // Get the original photo
                using var imagePath = await dataProvider.GetLocalFileName(photo);
                if (!imagePath.Exists) return null;

                // Get the face thumbnail path
                using var faceThumbnailPath = await dataProvider.GetLocalFaceThumbnailFileName(face);

                try
                {
                    using var image = await Image.LoadAsync(imagePath.Path);
                    image.Mutate(x => x.AutoOrient());
                    var faceRect = CalculateFaceRectangle(face, image.Width, image.Height);
                    using var faceImage = image.Clone(ctx => ctx.Crop(faceRect));

                    // Resize to a standard thumbnail size (square for round portraits)
                    var thumbnailSize = 150;
                    faceImage.Mutate(x => x.Resize(new ResizeOptions
                    {
                        Mode = ResizeMode.Crop,
                        Size = new Size(thumbnailSize, thumbnailSize)
                    }));

                    faceImage.Save(faceThumbnailPath.Path);
                    await faceThumbnailPath.SaveChanges();
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Error generating face thumbnail for face {FaceId}", face.Id);
                    return null;
                }
            }

            return await dataProvider.OpenFaceThumbnailRead(face);
        }

        /// <summary>
        /// Génère (si nécessaire) et retourne le flux de la miniature d'un visage en réutilisant une instance d'image déjà chargée.
        /// Utiliser cette surcharge dans un pipeline de détection de visages pour éviter de recharger le fichier disque.
        /// </summary>
        /// <param name="face">Le visage dont on veut la miniature.</param>
        /// <param name="baseImage">L'image complète contenant le visage (doit correspondre à face.Photo). Ne sera pas disposée par cette méthode.</param>
        /// <returns>Un flux en lecture de la miniature, ou null en cas d'erreur.</returns>
        public async Task<Stream?> GetFaceThumbnail(Face face, Image baseImage)
        {
            var photo = face.Photo;
            var dataProvider = dataService.GetDataProvider(photo.Directory.Gallery);

            if (!await dataProvider.FaceThumbnailExists(face))
            {
                using var faceThumbnailPath = await dataProvider.GetLocalFaceThumbnailFileName(face);
                try
                {
                    var faceRect = CalculateFaceRectangle(face, baseImage.Width, baseImage.Height);
                    using var faceImage = baseImage.Clone(ctx => ctx.Crop(faceRect));

                    var thumbnailSize = 150;
                    faceImage.Mutate(x => x.Resize(new ResizeOptions
                    {
                        Mode = ResizeMode.Crop,
                        Size = new Size(thumbnailSize, thumbnailSize)
                    }));

                    faceImage.Save(faceThumbnailPath.Path);
                    await faceThumbnailPath.SaveChanges();
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Error generating face thumbnail (preloaded image) for face {FaceId}", face.Id);
                    return null;
                }
            }

            return await dataProvider.OpenFaceThumbnailRead(face);
        }

        /// <summary>
        /// Updates the date/time of all photos in a directory
        /// </summary>
        public async Task BulkUpdatePhotosDate(int directoryId, DateTime dateTime)
        {
            var photos = await applicationDbContext.Photos
                .Where(p => p.DirectoryId == directoryId)
                .ToListAsync();

            foreach (var photo in photos)
            {
                photo.DateTime = dateTime;
            }

            await applicationDbContext.SaveChangesAsync();
        }
        /// <summary>
        /// Updates the date/time of a list of photos
        /// </summary>
        public async Task BulkUpdatePhotosDate(int[] photoIds, DateTime dateTime)
        {
            if (photoIds.Length == 0) return;
            var photos = await applicationDbContext.Photos
                .Where(p => photoIds.Contains(p.Id))
                .ToListAsync();

            foreach (var photo in photos)
            {
                photo.DateTime = dateTime;
            }

            await applicationDbContext.SaveChangesAsync();
        }

        /// <summary>
        /// Updates the GPS coordinates of all photos in a directory
        /// </summary>
        public async Task BulkUpdatePhotosLocation(int directoryId, double latitude, double longitude)
        {
            var photos = await applicationDbContext.Photos
                .Where(p => p.DirectoryId == directoryId)
                .ToListAsync();

            foreach (var photo in photos)
            {
                photo.Latitude = latitude;
                photo.Longitude = longitude;
            }

            await applicationDbContext.SaveChangesAsync();
        }

        /// <summary>
        /// Updates the GPS coordinates of a list of photos by their IDs
        /// </summary>
        public async Task BulkUpdatePhotosLocation(int[] photoIds, double latitude, double longitude, bool overwriteExisting = true)
        {
            if (photoIds.Length == 0) return;
            var photos = await applicationDbContext.Photos
                .Where(p => photoIds.Contains(p.Id))
                .ToListAsync();

            foreach (var photo in photos)
            {
                if (overwriteExisting || photo.Latitude == null || photo.Longitude == null)
                {
                    photo.Latitude = latitude;
                    photo.Longitude = longitude;
                }
            }

            await applicationDbContext.SaveChangesAsync();
        }

        /// <summary>
        /// Moves a list of photos to a target directory by updating their directory reference
        /// and physically moving the files on the file system
        /// </summary>
        public async Task MovePhotosToDirectory(int[] photoIds, int targetDirectoryId)
        {
            if (photoIds.Length == 0) return;

            var targetDirectory = await applicationDbContext.PhotoDirectories
                .Include(x => x.Gallery)
                .FirstOrDefaultAsync(x => x.Id == targetDirectoryId);
            
            if (targetDirectory == null)
                throw new InvalidOperationException("Le répertoire cible n'existe pas.");

            var photos = await applicationDbContext.Photos
                .Include(p => p.Directory)
                    .ThenInclude(d => d.Gallery)
                .Where(p => photoIds.Contains(p.Id))
                .ToListAsync();

            // Ensure all photos belong to the same gallery as the target directory
            if (photos.Any(p => p.Directory.GalleryId != targetDirectory.GalleryId))
                throw new InvalidOperationException("Toutes les photos doivent appartenir à la même galerie que le répertoire cible.");

            var dataProvider = dataService.GetDataProvider(targetDirectory.Gallery);

            foreach (var photo in photos)
            {
                // Skip if photo is already in the target directory
                if (photo.DirectoryId == targetDirectoryId)
                    continue;

                // Move the file physically
                await dataProvider.MoveFile(targetDirectory, photo);

                // Update the database reference
                photo.Directory = targetDirectory;
                photo.DirectoryId = targetDirectory.Id;
                applicationDbContext.Update(photo);
            }

            await applicationDbContext.SaveChangesAsync();
        }
    }
}
