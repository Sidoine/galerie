using System;
using System.Threading;
using System.Threading.Tasks;
using GaleriePhotos.Models;
using GaleriePhotos.Services.Background;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Xunit;

namespace GaleriePhotosTest.Services
{
    public class PhotoGpsBackfillBackgroundServiceTests : IDisposable
    {
        private readonly DbContextOptions<TestApplicationDbContext> _dbOptions;
        private readonly BackgroundStateService _stateService;
        private readonly int _galleryId;
        private readonly int _directoryId;
        private readonly string _databaseName;

        public PhotoGpsBackfillBackgroundServiceTests()
        {
            _databaseName = Guid.NewGuid().ToString();
            _dbOptions = new DbContextOptionsBuilder<TestApplicationDbContext>()
                .UseInMemoryDatabase(_databaseName)
                .Options;

            var logger = new LoggerFactory().CreateLogger<BackgroundStateService>();
            _stateService = new BackgroundStateService(logger);

            // Initialize database with test data
            using var db = new TestApplicationDbContext(_dbOptions);
            var tempPath = System.IO.Path.Combine(System.IO.Path.GetTempPath(), "PhotoGpsBackfillTest_" + Guid.NewGuid());
            var gallery = new Gallery("Test Gallery", tempPath, tempPath, DataProviderType.FileSystem, null, null);
            db.Galleries.Add(gallery);
            
            var directory = new PhotoDirectory("/test", 0, null, null, PhotoDirectoryType.Regular)
            {
                Gallery = gallery,
                GalleryId = gallery.Id
            };
            db.PhotoDirectories.Add(directory);
            db.SaveChanges();
            
            _galleryId = gallery.Id;
            _directoryId = directory.Id;
        }

        public void Dispose()
        {
            // Database will be disposed automatically with InMemory provider
        }

        private TestApplicationDbContext CreateDbContext()
        {
            return new TestApplicationDbContext(_dbOptions);
        }

        [Fact]
        public async Task ProcessPhotosWithoutGpsAsync_ShouldBackfillFromClosestPhoto()
        {
            // Arrange
            var baseTime = new DateTime(2024, 1, 1, 12, 0, 0);
            int photoWithoutGpsId;
            
            using (var db = CreateDbContext())
            {
                var directory = db.PhotoDirectories.Find(_directoryId)!;
                
                // Photo with GPS
                var photoWithGps = new Photo("photo1.jpg")
                {
                    DateTime = baseTime,
                    Latitude = 48.8566,
                    Longitude = 2.3522,
                    Directory = directory
                };
                db.Photos.Add(photoWithGps);
                
                // Photo without GPS, taken 30 minutes later
                var photoWithoutGps = new Photo("photo2.jpg")
                {
                    DateTime = baseTime.AddMinutes(30),
                    Latitude = null,
                    Longitude = null,
                    Directory = directory
                };
                db.Photos.Add(photoWithoutGps);
                await db.SaveChangesAsync();
                photoWithoutGpsId = photoWithoutGps.Id;
            }

            var serviceProvider = CreateServiceProvider();
            var service = CreateService(serviceProvider);

            // Act
            await service.StartAsync(CancellationToken.None);
            await Task.Delay(500); // Give the service time to process
            await service.StopAsync(CancellationToken.None);

            // Assert
            using (var db = CreateDbContext())
            {
                var photoWithoutGps = await db.Photos.FindAsync(photoWithoutGpsId);
                Assert.NotNull(photoWithoutGps);
                Assert.NotNull(photoWithoutGps.Latitude);
                Assert.NotNull(photoWithoutGps.Longitude);
                Assert.Equal(48.8566, photoWithoutGps.Latitude.Value, 4);
                Assert.Equal(2.3522, photoWithoutGps.Longitude.Value, 4);
            }
        }

        [Fact]
        public async Task ProcessPhotosWithoutGpsAsync_ShouldHandleZeroCoordinates()
        {
            // Arrange
            var baseTime = new DateTime(2024, 1, 1, 12, 0, 0);
            int photoWithZeroCoordsId;
            
            using (var db = CreateDbContext())
            {
                var directory = db.PhotoDirectories.Find(_directoryId)!;
                
                // Photo with valid GPS
                var photoWithGps = new Photo("photo1.jpg")
                {
                    DateTime = baseTime,
                    Latitude = 48.8566,
                    Longitude = 2.3522,
                    Directory = directory
                };
                db.Photos.Add(photoWithGps);
                
                // Photo with (0, 0) coordinates (should be considered as missing GPS)
                var photoWithZeroCoords = new Photo("photo2.jpg")
                {
                    DateTime = baseTime.AddMinutes(10),
                    Latitude = 0,
                    Longitude = 0,
                    Directory = directory
                };
                db.Photos.Add(photoWithZeroCoords);
                await db.SaveChangesAsync();
                photoWithZeroCoordsId = photoWithZeroCoords.Id;
            }

            var serviceProvider = CreateServiceProvider();
            var service = CreateService(serviceProvider);

            // Act
            await service.StartAsync(CancellationToken.None);
            await Task.Delay(500);
            await service.StopAsync(CancellationToken.None);

            // Assert
            using (var db = CreateDbContext())
            {
                var photoWithZeroCoords = await db.Photos.FindAsync(photoWithZeroCoordsId);
                Assert.NotNull(photoWithZeroCoords);
                Assert.NotNull(photoWithZeroCoords.Latitude);
                Assert.NotNull(photoWithZeroCoords.Longitude);
                Assert.Equal(48.8566, photoWithZeroCoords.Latitude.Value, 4);
                Assert.Equal(2.3522, photoWithZeroCoords.Longitude.Value, 4);
            }
        }

        [Fact]
        public async Task ProcessPhotosWithoutGpsAsync_ShouldNotBackfillFromZeroCoordinates()
        {
            // Arrange
            var baseTime = new DateTime(2024, 1, 1, 12, 0, 0);
            int photoWithoutGpsId;
            
            using (var db = CreateDbContext())
            {
                var directory = db.PhotoDirectories.Find(_directoryId)!;
                
                // Photo with (0, 0) coordinates (invalid GPS)
                var photoWithZeroCoords = new Photo("photo1.jpg")
                {
                    DateTime = baseTime,
                    Latitude = 0,
                    Longitude = 0,
                    Directory = directory
                };
                db.Photos.Add(photoWithZeroCoords);
                
                // Photo without GPS
                var photoWithoutGps = new Photo("photo2.jpg")
                {
                    DateTime = baseTime.AddMinutes(10),
                    Latitude = null,
                    Longitude = null,
                    Directory = directory
                };
                db.Photos.Add(photoWithoutGps);
                await db.SaveChangesAsync();
                photoWithoutGpsId = photoWithoutGps.Id;
            }

            var serviceProvider = CreateServiceProvider();
            var service = CreateService(serviceProvider);

            // Act
            await service.StartAsync(CancellationToken.None);
            await Task.Delay(500);
            await service.StopAsync(CancellationToken.None);

            // Assert
            using (var db = CreateDbContext())
            {
                var photoWithoutGps = await db.Photos.FindAsync(photoWithoutGpsId);
                Assert.NotNull(photoWithoutGps);
                // Should remain null since no valid GPS source is available
                Assert.Null(photoWithoutGps.Latitude);
                Assert.Null(photoWithoutGps.Longitude);
            }
        }

        [Fact]
        public async Task ProcessPhotosWithoutGpsAsync_ShouldSelectClosestInTime()
        {
            // Arrange
            var baseTime = new DateTime(2024, 1, 1, 12, 0, 0);
            int photoWithoutGpsId;
            
            using (var db = CreateDbContext())
            {
                var directory = db.PhotoDirectories.Find(_directoryId)!;
                
                // Photo with GPS - 2 hours before
                var photo1 = new Photo("photo1.jpg")
                {
                    DateTime = baseTime.AddHours(-2),
                    Latitude = 45.0,
                    Longitude = 3.0,
                    Directory = directory
                };
                db.Photos.Add(photo1);
                
                // Photo with GPS - 30 minutes after
                var photo2 = new Photo("photo2.jpg")
                {
                    DateTime = baseTime.AddMinutes(30),
                    Latitude = 48.8566,
                    Longitude = 2.3522,
                    Directory = directory
                };
                db.Photos.Add(photo2);
                
                // Photo without GPS
                var photoWithoutGps = new Photo("photo3.jpg")
                {
                    DateTime = baseTime,
                    Latitude = null,
                    Longitude = null,
                    Directory = directory
                };
                db.Photos.Add(photoWithoutGps);
                await db.SaveChangesAsync();
                photoWithoutGpsId = photoWithoutGps.Id;
            }

            var serviceProvider = CreateServiceProvider();
            var service = CreateService(serviceProvider);

            // Act
            await service.StartAsync(CancellationToken.None);
            await Task.Delay(500);
            await service.StopAsync(CancellationToken.None);

            // Assert
            using (var db = CreateDbContext())
            {
                var photoWithoutGps = await db.Photos.FindAsync(photoWithoutGpsId);
                Assert.NotNull(photoWithoutGps);
                Assert.NotNull(photoWithoutGps.Latitude);
                Assert.NotNull(photoWithoutGps.Longitude);
                // Should use photo2 since it's closer in time (30 min vs 2 hours)
                Assert.Equal(48.8566, photoWithoutGps.Latitude.Value, 4);
                Assert.Equal(2.3522, photoWithoutGps.Longitude.Value, 4);
            }
        }

        [Fact]
        public async Task ProcessPhotosWithoutGpsAsync_ShouldRespectMaxTimeDifference()
        {
            // Arrange
            var baseTime = new DateTime(2024, 1, 1, 12, 0, 0);
            int photoWithoutGpsId;
            
            using (var db = CreateDbContext())
            {
                var directory = db.PhotoDirectories.Find(_directoryId)!;
                
                // Photo with GPS - 25 hours before (exceeds 24-hour limit)
                var photoWithGps = new Photo("photo1.jpg")
                {
                    DateTime = baseTime.AddHours(-25),
                    Latitude = 48.8566,
                    Longitude = 2.3522,
                    Directory = directory
                };
                db.Photos.Add(photoWithGps);
                
                // Photo without GPS
                var photoWithoutGps = new Photo("photo2.jpg")
                {
                    DateTime = baseTime,
                    Latitude = null,
                    Longitude = null,
                    Directory = directory
                };
                db.Photos.Add(photoWithoutGps);
                await db.SaveChangesAsync();
                photoWithoutGpsId = photoWithoutGps.Id;
            }

            var serviceProvider = CreateServiceProvider();
            var service = CreateService(serviceProvider);

            // Act
            await service.StartAsync(CancellationToken.None);
            await Task.Delay(500);
            await service.StopAsync(CancellationToken.None);

            // Assert
            using (var db = CreateDbContext())
            {
                var photoWithoutGps = await db.Photos.FindAsync(photoWithoutGpsId);
                Assert.NotNull(photoWithoutGps);
                // Should remain null since the only candidate exceeds the time limit
                Assert.Null(photoWithoutGps.Latitude);
                Assert.Null(photoWithoutGps.Longitude);
            }
        }

        [Fact]
        public async Task ProcessPhotosWithoutGpsAsync_ShouldIgnorePrivateDirectories()
        {
            // Arrange
            var baseTime = new DateTime(2024, 1, 1, 12, 0, 0);
            int privatePhotoId;
            
            using (var db = CreateDbContext())
            {
                var gallery = db.Galleries.Find(_galleryId)!;
                var directory = db.PhotoDirectories.Find(_directoryId)!;
                
                var privateDirectory = new PhotoDirectory("/private", 0, null, null, PhotoDirectoryType.Private)
                {
                    Gallery = gallery,
                    GalleryId = gallery.Id
                };
                db.PhotoDirectories.Add(privateDirectory);
                db.SaveChanges();
                
                // Photo with GPS in regular directory
                var photoWithGps = new Photo("photo1.jpg")
                {
                    DateTime = baseTime,
                    Latitude = 48.8566,
                    Longitude = 2.3522,
                    Directory = directory
                };
                db.Photos.Add(photoWithGps);
                
                // Photo without GPS in private directory
                var privatePhoto = new Photo("photo2.jpg")
                {
                    DateTime = baseTime.AddMinutes(10),
                    Latitude = null,
                    Longitude = null,
                    Directory = privateDirectory
                };
                db.Photos.Add(privatePhoto);
                await db.SaveChangesAsync();
                privatePhotoId = privatePhoto.Id;
            }

            var serviceProvider = CreateServiceProvider();
            var service = CreateService(serviceProvider);

            // Act
            await service.StartAsync(CancellationToken.None);
            await Task.Delay(500);
            await service.StopAsync(CancellationToken.None);

            // Assert
            using (var db = CreateDbContext())
            {
                var privatePhoto = await db.Photos.FindAsync(privatePhotoId);
                Assert.NotNull(privatePhoto);
                // Should remain null since private photos are skipped
                Assert.Null(privatePhoto.Latitude);
                Assert.Null(privatePhoto.Longitude);
            }
        }

        [Fact]
        public async Task ProcessPhotosWithoutGpsAsync_ShouldIgnoreTrashDirectories()
        {
            // Arrange
            var baseTime = new DateTime(2024, 1, 1, 12, 0, 0);
            int trashPhotoId;
            
            using (var db = CreateDbContext())
            {
                var gallery = db.Galleries.Find(_galleryId)!;
                var directory = db.PhotoDirectories.Find(_directoryId)!;
                
                var trashDirectory = new PhotoDirectory("/trash", 0, null, null, PhotoDirectoryType.Trash)
                {
                    Gallery = gallery,
                    GalleryId = gallery.Id
                };
                db.PhotoDirectories.Add(trashDirectory);
                db.SaveChanges();
                
                // Photo with GPS in regular directory
                var photoWithGps = new Photo("photo1.jpg")
                {
                    DateTime = baseTime,
                    Latitude = 48.8566,
                    Longitude = 2.3522,
                    Directory = directory
                };
                db.Photos.Add(photoWithGps);
                
                // Photo without GPS in trash directory
                var trashPhoto = new Photo("photo2.jpg")
                {
                    DateTime = baseTime.AddMinutes(10),
                    Latitude = null,
                    Longitude = null,
                    Directory = trashDirectory
                };
                db.Photos.Add(trashPhoto);
                await db.SaveChangesAsync();
                trashPhotoId = trashPhoto.Id;
            }

            var serviceProvider = CreateServiceProvider();
            var service = CreateService(serviceProvider);

            // Act
            await service.StartAsync(CancellationToken.None);
            await Task.Delay(500);
            await service.StopAsync(CancellationToken.None);

            // Assert
            using (var db = CreateDbContext())
            {
                var trashPhoto = await db.Photos.FindAsync(trashPhotoId);
                Assert.NotNull(trashPhoto);
                // Should remain null since trash photos are skipped
                Assert.Null(trashPhoto.Latitude);
                Assert.Null(trashPhoto.Longitude);
            }
        }

        [Fact]
        public async Task ProcessPhotosWithoutGpsAsync_ShouldOnlyBackfillWithinSameGallery()
        {
            // Arrange
            var baseTime = new DateTime(2024, 1, 1, 12, 0, 0);
            int photoInGallery1Id;
            
            using (var db = CreateDbContext())
            {
                var directory1 = db.PhotoDirectories.Find(_directoryId)!;
                
                var gallery2 = new Gallery("Gallery 2", "/temp2", "/temp2", DataProviderType.FileSystem, null, null);
                db.Galleries.Add(gallery2);
                
                var directory2 = new PhotoDirectory("/test2", 0, null, null, PhotoDirectoryType.Regular)
                {
                    Gallery = gallery2,
                    GalleryId = gallery2.Id
                };
                db.PhotoDirectories.Add(directory2);
                db.SaveChanges();
                
                // Photo with GPS in gallery 2
                var photoInGallery2 = new Photo("photo1.jpg")
                {
                    DateTime = baseTime,
                    Latitude = 48.8566,
                    Longitude = 2.3522,
                    Directory = directory2
                };
                db.Photos.Add(photoInGallery2);
                
                // Photo without GPS in gallery 1
                var photoInGallery1 = new Photo("photo2.jpg")
                {
                    DateTime = baseTime.AddMinutes(10),
                    Latitude = null,
                    Longitude = null,
                    Directory = directory1
                };
                db.Photos.Add(photoInGallery1);
                await db.SaveChangesAsync();
                photoInGallery1Id = photoInGallery1.Id;
            }

            var serviceProvider = CreateServiceProvider();
            var service = CreateService(serviceProvider);

            // Act
            await service.StartAsync(CancellationToken.None);
            await Task.Delay(500);
            await service.StopAsync(CancellationToken.None);

            // Assert
            using (var db = CreateDbContext())
            {
                var photoInGallery1 = await db.Photos.FindAsync(photoInGallery1Id);
                Assert.NotNull(photoInGallery1);
                // Should remain null since candidates must be from the same gallery
                Assert.Null(photoInGallery1.Latitude);
                Assert.Null(photoInGallery1.Longitude);
            }
        }

        [Fact]
        public async Task ProcessPhotosWithoutGpsAsync_ShouldHandlePartialCoordinates_NullLatitude()
        {
            // Arrange
            var baseTime = new DateTime(2024, 1, 1, 12, 0, 0);
            int photoWithPartialGpsId;
            
            using (var db = CreateDbContext())
            {
                var directory = db.PhotoDirectories.Find(_directoryId)!;
                
                // Photo with valid GPS
                var photoWithGps = new Photo("photo1.jpg")
                {
                    DateTime = baseTime,
                    Latitude = 48.8566,
                    Longitude = 2.3522,
                    Directory = directory
                };
                db.Photos.Add(photoWithGps);
                
                // Photo with only longitude (latitude is null)
                var photoWithPartialGps = new Photo("photo2.jpg")
                {
                    DateTime = baseTime.AddMinutes(10),
                    Latitude = null,
                    Longitude = 2.3522,
                    Directory = directory
                };
                db.Photos.Add(photoWithPartialGps);
                await db.SaveChangesAsync();
                photoWithPartialGpsId = photoWithPartialGps.Id;
            }

            var serviceProvider = CreateServiceProvider();
            var service = CreateService(serviceProvider);

            // Act
            await service.StartAsync(CancellationToken.None);
            await Task.Delay(500);
            await service.StopAsync(CancellationToken.None);

            // Assert
            using (var db = CreateDbContext())
            {
                var photoWithPartialGps = await db.Photos.FindAsync(photoWithPartialGpsId);
                Assert.NotNull(photoWithPartialGps);
                Assert.NotNull(photoWithPartialGps.Latitude);
                Assert.NotNull(photoWithPartialGps.Longitude);
                Assert.Equal(48.8566, photoWithPartialGps.Latitude.Value, 4);
            }
        }

        [Fact]
        public async Task ProcessPhotosWithoutGpsAsync_ShouldHandlePartialCoordinates_NullLongitude()
        {
            // Arrange
            var baseTime = new DateTime(2024, 1, 1, 12, 0, 0);
            int photoWithPartialGpsId;
            
            using (var db = CreateDbContext())
            {
                var directory = db.PhotoDirectories.Find(_directoryId)!;
                
                // Photo with valid GPS
                var photoWithGps = new Photo("photo1.jpg")
                {
                    DateTime = baseTime,
                    Latitude = 48.8566,
                    Longitude = 2.3522,
                    Directory = directory
                };
                db.Photos.Add(photoWithGps);
                
                // Photo with only latitude (longitude is null)
                var photoWithPartialGps = new Photo("photo2.jpg")
                {
                    DateTime = baseTime.AddMinutes(10),
                    Latitude = 48.8566,
                    Longitude = null,
                    Directory = directory
                };
                db.Photos.Add(photoWithPartialGps);
                await db.SaveChangesAsync();
                photoWithPartialGpsId = photoWithPartialGps.Id;
            }

            var serviceProvider = CreateServiceProvider();
            var service = CreateService(serviceProvider);

            // Act
            await service.StartAsync(CancellationToken.None);
            await Task.Delay(500);
            await service.StopAsync(CancellationToken.None);

            // Assert
            using (var db = CreateDbContext())
            {
                var photoWithPartialGps = await db.Photos.FindAsync(photoWithPartialGpsId);
                Assert.NotNull(photoWithPartialGps);
                Assert.NotNull(photoWithPartialGps.Latitude);
                Assert.NotNull(photoWithPartialGps.Longitude);
                Assert.Equal(2.3522, photoWithPartialGps.Longitude.Value, 4);
            }
        }

        [Fact]
        public async Task ProcessPhotosWithoutGpsAsync_ShouldNotUsePartialCoordinatesAsSource()
        {
            // Arrange
            var baseTime = new DateTime(2024, 1, 1, 12, 0, 0);
            int photoWithoutGpsId;
            
            using (var db = CreateDbContext())
            {
                var directory = db.PhotoDirectories.Find(_directoryId)!;
                
                // Photo with only latitude (invalid as GPS source)
                var photoWithPartialGps = new Photo("photo1.jpg")
                {
                    DateTime = baseTime,
                    Latitude = 48.8566,
                    Longitude = null,
                    Directory = directory
                };
                db.Photos.Add(photoWithPartialGps);
                
                // Photo without GPS
                var photoWithoutGps = new Photo("photo2.jpg")
                {
                    DateTime = baseTime.AddMinutes(10),
                    Latitude = null,
                    Longitude = null,
                    Directory = directory
                };
                db.Photos.Add(photoWithoutGps);
                await db.SaveChangesAsync();
                photoWithoutGpsId = photoWithoutGps.Id;
            }

            var serviceProvider = CreateServiceProvider();
            var service = CreateService(serviceProvider);

            // Act
            await service.StartAsync(CancellationToken.None);
            await Task.Delay(500);
            await service.StopAsync(CancellationToken.None);

            // Assert
            using (var db = CreateDbContext())
            {
                var photoWithoutGps = await db.Photos.FindAsync(photoWithoutGpsId);
                Assert.NotNull(photoWithoutGps);
                // Should remain null since the only candidate has partial GPS data
                Assert.Null(photoWithoutGps.Latitude);
                Assert.Null(photoWithoutGps.Longitude);
            }
        }

        [Fact]
        public async Task ProcessPhotosWithoutGpsAsync_ShouldNotUseZeroLatitudeAsSource()
        {
            // Arrange - Tests the bug where (0, X) is accepted as valid GPS
            var baseTime = new DateTime(2024, 1, 1, 12, 0, 0);
            int photoWithoutGpsId;
            
            using (var db = CreateDbContext())
            {
                var directory = db.PhotoDirectories.Find(_directoryId)!;
                
                // Photo with latitude=0 but longitude non-zero (invalid GPS, but current code accepts it as source)
                var photoWithZeroLat = new Photo("photo1.jpg")
                {
                    DateTime = baseTime,
                    Latitude = 0,
                    Longitude = 2.3522,
                    Directory = directory
                };
                db.Photos.Add(photoWithZeroLat);
                
                // Photo without GPS
                var photoWithoutGps = new Photo("photo2.jpg")
                {
                    DateTime = baseTime.AddMinutes(10),
                    Latitude = null,
                    Longitude = null,
                    Directory = directory
                };
                db.Photos.Add(photoWithoutGps);
                await db.SaveChangesAsync();
                photoWithoutGpsId = photoWithoutGps.Id;
            }

            var serviceProvider = CreateServiceProvider();
            var service = CreateService(serviceProvider);

            // Act
            await service.StartAsync(CancellationToken.None);
            await Task.Delay(500);
            await service.StopAsync(CancellationToken.None);

            // Assert
            using (var db = CreateDbContext())
            {
                var photoWithoutGps = await db.Photos.FindAsync(photoWithoutGpsId);
                Assert.NotNull(photoWithoutGps);
                // Should remain null - (0, X) is not valid GPS data
                // BUG: Currently fails because the OR condition accepts it
                Assert.Null(photoWithoutGps.Latitude);
                Assert.Null(photoWithoutGps.Longitude);
            }
        }

        [Fact]
        public async Task ProcessPhotosWithoutGpsAsync_ShouldNotUseZeroLongitudeAsSource()
        {
            // Arrange - Tests the bug where (X, 0) is accepted as valid GPS
            var baseTime = new DateTime(2024, 1, 1, 12, 0, 0);
            int photoWithoutGpsId;
            
            using (var db = CreateDbContext())
            {
                var directory = db.PhotoDirectories.Find(_directoryId)!;
                
                // Photo with longitude=0 but latitude non-zero (invalid GPS, but current code accepts it as source)
                var photoWithZeroLon = new Photo("photo1.jpg")
                {
                    DateTime = baseTime,
                    Latitude = 48.8566,
                    Longitude = 0,
                    Directory = directory
                };
                db.Photos.Add(photoWithZeroLon);
                
                // Photo without GPS
                var photoWithoutGps = new Photo("photo2.jpg")
                {
                    DateTime = baseTime.AddMinutes(10),
                    Latitude = null,
                    Longitude = null,
                    Directory = directory
                };
                db.Photos.Add(photoWithoutGps);
                await db.SaveChangesAsync();
                photoWithoutGpsId = photoWithoutGps.Id;
            }

            var serviceProvider = CreateServiceProvider();
            var service = CreateService(serviceProvider);

            // Act
            await service.StartAsync(CancellationToken.None);
            await Task.Delay(500);
            await service.StopAsync(CancellationToken.None);

            // Assert
            using (var db = CreateDbContext())
            {
                var photoWithoutGps = await db.Photos.FindAsync(photoWithoutGpsId);
                Assert.NotNull(photoWithoutGps);
                // Should remain null - (X, 0) is not valid GPS data
                // BUG: Currently fails because the OR condition accepts it
                Assert.Null(photoWithoutGps.Latitude);
                Assert.Null(photoWithoutGps.Longitude);
            }
        }

        private IServiceProvider CreateServiceProvider()
        {
            var services = new ServiceCollection();
            services.AddScoped<GaleriePhotos.Data.ApplicationDbContext>(sp => new TestApplicationDbContext(_dbOptions));
            services.AddLogging();
            return services.BuildServiceProvider();
        }

        private PhotoGpsBackfillBackgroundService CreateService(IServiceProvider serviceProvider)
        {
            var logger = serviceProvider.GetRequiredService<ILoggerFactory>()
                .CreateLogger<PhotoGpsBackfillBackgroundService>();
            return new PhotoGpsBackfillBackgroundService(serviceProvider, logger, _stateService);
        }
    }
}
