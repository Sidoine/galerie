using GaleriePhotos.Data;
using GaleriePhotos.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Primitives;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace GaleriePhotos.Services
{
    public class PhotoService
    {
        private readonly IOptions<GalerieOptions> options;
        private readonly ApplicationDbContext applicationDbContext;

        public PhotoService(IOptions<GalerieOptions> options, ApplicationDbContext applicationDbContext)
        {
            this.options = options;
            this.applicationDbContext = applicationDbContext;
        }

        public string? GetAbsoluteDirectoryPath(string? relativeDirectoryPath)
        {
            var rootPath = options.Value.Root;
            if (relativeDirectoryPath != null && (relativeDirectoryPath.Contains("..") || relativeDirectoryPath.StartsWith("/"))) return null;
            if (rootPath == null) return null;
            var path = relativeDirectoryPath != null ? Path.Combine(rootPath, relativeDirectoryPath) : rootPath;
            if (!Directory.Exists(path)) return null;
            return path;
        }

        public string? GetAbsoluteDirectoryPath(PhotoDirectory photoDirectory)
        {
            var rootPath = options.Value.Root;
            if (rootPath == null) return null;
            var path = Path.Combine(rootPath, photoDirectory.Path);
            if (!Directory.Exists(path)) return null;
            return path;
        }

        public string? GetAbsoluteImagePath(PhotoDirectory photoDirectory, Photo photo)
        {
            if (options.Value.Root == null) return null;
            var photoDirectoryPath = GetAbsoluteDirectoryPath(photoDirectory);
            if (photoDirectoryPath == null) return null;
            var imagePath = Path.Combine(photoDirectoryPath,  photo.FileName);
            if (!File.Exists(imagePath)) return null;
            return imagePath;
        }

        public async Task<PhotoDirectory> GetRootDirectory()
        {
            var root = applicationDbContext.PhotoDirectories.FirstOrDefault(x => x.Path == "");
            if (root == null)
            {
                root = new PhotoDirectory("", DirectoryVisibility.None);
                applicationDbContext.PhotoDirectories.Add(root);
                await applicationDbContext.SaveChangesAsync();
            }

            return root;
        }

        public async Task<Photo[]?> GetDirectoryImages(PhotoDirectory photoDirectory)
        {
            var path = GetAbsoluteDirectoryPath(photoDirectory);
            if (path == null) return null;
            var fileNames = Directory.EnumerateFiles(path).Select(x => Path.GetFileName(x)).Where(x => new[] { ".jpg", ".jpeg" }.Contains(Path.GetExtension(x).ToLowerInvariant()));
            var photos = await applicationDbContext.Photos.Where(x => fileNames.Contains(x.FileName)).ToListAsync();
            foreach (var fileName in fileNames)
            {
                if (!photos.Any(x => x.FileName == fileName))
                {
                    var photo = new Photo(fileName);
                    var imagePath = Path.Combine(path, fileName);
                    using (var image = Image.Load(imagePath))
                    {
                        var dateTimeValue = image.Metadata.ExifProfile.Values.FirstOrDefault(x => x.Tag == SixLabors.ImageSharp.Metadata.Profiles.Exif.ExifTag.DateTime);
                        if (dateTimeValue != null)
                        {
                            if (DateTime.TryParseExact((string)dateTimeValue.Value, "yyyy:MM:dd HH:mm:ss", CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
                            {
                                photo.DateTime = date;
                            }
                        }
                        var latitudeValue = image.Metadata.ExifProfile.Values.FirstOrDefault(x => x.Tag == SixLabors.ImageSharp.Metadata.Profiles.Exif.ExifTag.GPSLatitude);
                        var latitudeRef = image.Metadata.ExifProfile.Values.FirstOrDefault(x => x.Tag == SixLabors.ImageSharp.Metadata.Profiles.Exif.ExifTag.GPSLatitudeRef);
                        if (latitudeValue != null && latitudeRef != null) photo.Latitude = Convert((string)latitudeRef.Value, (Rational[])latitudeValue.Value);
                        var longitudeValue = image.Metadata.ExifProfile.Values.FirstOrDefault(x => x.Tag == SixLabors.ImageSharp.Metadata.Profiles.Exif.ExifTag.GPSLongitude);
                        var longitudeRef = image.Metadata.ExifProfile.Values.FirstOrDefault(x => x.Tag == SixLabors.ImageSharp.Metadata.Profiles.Exif.ExifTag.GPSLongitudeRef);
                        if (longitudeValue != null && longitudeRef != null) photo.Longitude = Convert((string)longitudeRef.Value, (Rational[])longitudeValue.Value);
                        var camera = image.Metadata.ExifProfile.Values.FirstOrDefault(x => x.Tag == SixLabors.ImageSharp.Metadata.Profiles.Exif.ExifTag.Model);
                        if (camera != null) photo.Camera = (string)camera.Value;
                    }

                    if (photo.DateTime == default)
                    {
                        photo.DateTime =  File.GetCreationTimeUtc(imagePath);
                    }

                    applicationDbContext.Photos.Add(photo);
                    photos.Add(photo);
                }
            }
            await applicationDbContext.SaveChangesAsync();
            return photos.OrderBy(x => x.DateTime).ToArray();
        }

        public async Task<PhotoDirectory[]?> GetSubDirectories(PhotoDirectory photoDirectory)
        {
            var photoDirectoryPath = GetAbsoluteDirectoryPath(photoDirectory);
            if (photoDirectoryPath == null) return null;
            var directoryAbsolutePaths = Directory.EnumerateDirectories(photoDirectoryPath);
            var directoryPaths = directoryAbsolutePaths.Select(x => Path.GetFileName(x)).Where(x => !x.StartsWith(".") && !x.StartsWith("_")).Select(x => Path.Combine(photoDirectory.Path,x )).ToArray();
            var directories = await applicationDbContext.PhotoDirectories.Where(x => directoryPaths.Contains(x.Path)).ToListAsync();
            foreach (var path in directoryPaths)
            {
                if (!directories.Any(x => x.Path == path))
                {
                    var subPhotoDirectory = new PhotoDirectory(path, DirectoryVisibility.None);
                    applicationDbContext.PhotoDirectories.Add(subPhotoDirectory);
                    directories.Add(subPhotoDirectory);
                }
            }
            await applicationDbContext.SaveChangesAsync();
            return directories.OrderBy(x => x.Path).ToArray();
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
    }
}
