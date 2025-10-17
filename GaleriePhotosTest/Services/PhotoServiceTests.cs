using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using GaleriePhotos; // GalerieOptions
using GaleriePhotos.Models;
using GaleriePhotos.Data;
using GaleriePhotos.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;
using Xunit;

namespace GaleriePhotosTest.Services
{
    public class PhotoServiceTests : IDisposable
    {
        private readonly ApplicationDbContext _db;
        private readonly DataService _dataService;
        private readonly PhotoService _photoService;
        private readonly Gallery _gallery;
        private readonly PhotoDirectory _rootDirectory;
        private readonly string _tempOriginals;
        private readonly string _tempThumbs;

        public PhotoServiceTests()
        {
            var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString());
            _db = new ApplicationDbContext(optionsBuilder.Options);

            _tempOriginals = System.IO.Path.Combine(System.IO.Path.GetTempPath(), "GaleriePhotos_Orig_" + Guid.NewGuid());
            _tempThumbs = System.IO.Path.Combine(System.IO.Path.GetTempPath(), "GaleriePhotos_Thumbs_" + Guid.NewGuid());
            Directory.CreateDirectory(_tempOriginals);
            Directory.CreateDirectory(_tempThumbs);
            _gallery = new Gallery("Test Gallery", _tempOriginals, _tempThumbs, DataProviderType.FileSystem, null, null);
            _db.Galleries.Add(_gallery);
            _db.SaveChanges();

            _dataService = new DataService();

            var logger = new LoggerFactory().CreateLogger<PhotoService>();
            var galOptions = Options.Create(new GalerieOptions());
            _photoService = new PhotoService(galOptions, _db, logger, _dataService);

            // Création du répertoire racine via service
            _rootDirectory = _photoService.GetRootDirectory(_gallery).GetAwaiter().GetResult();
        }

        [Fact(Skip = "Can only be run on PostgreSQL")]
        public void IsVideo_ReturnsExpected()
        {
            var photoVideo = new Photo("video.mp4") { Directory = _rootDirectory };
            var photoImage = new Photo("image.jpg") { Directory = _rootDirectory };
            Assert.True(PhotoService.IsVideo(photoVideo));
            Assert.False(PhotoService.IsVideo(photoImage));
        }

        [Fact(Skip = "Can only be run on PostgreSQL")]
        public void GetMimeType_ReturnsCorrectMapping()
        {
            var photo = new Photo("test.PNG") { Directory = _rootDirectory };
            var mime = _photoService.GetMimeType(photo);
            Assert.Equal("image/png", mime);
        }

        [Fact(Skip = "Can only be run on PostgreSQL")]
        public void IsPrivate_DetectsPrivatePath()
        {
            var dir = new PhotoDirectory(Path.Combine(_rootDirectory.Path, "Privé"), 0, null, null, PhotoDirectoryType.Private) { Gallery = _gallery };
            Assert.True(_photoService.IsPrivate(dir));
            Assert.False(_photoService.IsPrivate(_rootDirectory));
        }

        [Fact(Skip = "Can only be run on PostgreSQL")]
        public async Task GetRootDirectory_CreatesIfMissing()
        {
            // Root déjà créé dans constructeur => on le supprime pour tester recréation
            _db.PhotoDirectories.RemoveRange(_db.PhotoDirectories);
            await _db.SaveChangesAsync();

            var root = await _photoService.GetRootDirectory(_gallery);
            Assert.NotNull(root);
            Assert.Equal("", root.Path);
            Assert.True(_db.PhotoDirectories.Any(x => x.Id == root.Id));
        }

        [Fact(Skip = "Can only be run on PostgreSQL")]
        public async Task GetDirectoryImages_AddsPhotoFromFileSystemAndSetsCover()
        {
            var fileName = "image1.jpg";
            var filePath = System.IO.Path.Combine(_tempOriginals, fileName);
            using (var img = new Image<Rgba32>(10, 5))
            {
                await img.SaveAsJpegAsync(filePath);
            }
            var creation = new DateTime(2020, 1, 2, 3, 4, 5, DateTimeKind.Utc);
            File.SetCreationTimeUtc(filePath, creation);

            var photos = await _photoService.GetDirectoryImages(_rootDirectory);
            Assert.NotNull(photos);
            Assert.Single(photos);
            var photo = photos![0];
            Assert.Equal(fileName, photo.FileName);
            Assert.Equal(creation, photo.DateTime); // fallback creation time
            Assert.Equal(photo.Id, _rootDirectory.CoverPhotoId); // cover défini
        }

        [Fact(Skip = "Can only be run on PostgreSQL")]
        public async Task RotatePhoto_InvalidAngle_Throws()
        {
            var photo = new Photo("rot2.jpg") { Directory = _rootDirectory };
            await Assert.ThrowsAsync<ArgumentException>(() => _photoService.RotatePhoto(photo, 45));
        }

        public void Dispose()
        {
            _db.Dispose();
            try
            {
                if (Directory.Exists(_tempOriginals)) Directory.Delete(_tempOriginals, true);
                if (Directory.Exists(_tempThumbs)) Directory.Delete(_tempThumbs, true);
            }
            catch { }
        }
    }
}
