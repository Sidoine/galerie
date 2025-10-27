using System;
using System.Linq;
using System.Threading.Tasks;
using GaleriePhotos.Controllers;
using GaleriePhotos.Data;
using GaleriePhotos.Models;
using GaleriePhotos.ViewModels;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace GaleriePhotosTest.Controllers
{
    public class DashboardControllerTests
    {
        private TestApplicationDbContext CreateDb()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            return new TestApplicationDbContext(options);
        }

        [Fact]
        public async Task GetStatistics_GroupsPhotosByAlbum()
        {
            using var db = CreateDb();

            var gallery = new Gallery("Test", "/orig", "/thumbs", DataProviderType.FileSystem, null, null);
            db.Galleries.Add(gallery);
            await db.SaveChangesAsync();

            var dir1 = new PhotoDirectory("Album1", 0, null, null) { Gallery = gallery };
            var dir2 = new PhotoDirectory("Album2", 0, null, dir1.Id) { Gallery = gallery };
            db.PhotoDirectories.AddRange(dir1, dir2);
            await db.SaveChangesAsync();

            // dir1: 2 photos sans GPS, 1 avec GPS
            db.Photos.Add(new Photo("a.jpg") { Directory = dir1, Latitude = null, Longitude = null, DateTime = DateTime.UtcNow });
            db.Photos.Add(new Photo("b.jpg") { Directory = dir1, Latitude = 0, Longitude = 0, DateTime = DateTime.UtcNow });
            db.Photos.Add(new Photo("c.jpg") { Directory = dir1, Latitude = 48.0, Longitude = 2.0, DateTime = DateTime.UtcNow });

            // dir2: 1 photo sans GPS
            db.Photos.Add(new Photo("d.jpg") { Directory = dir2, Latitude = null, Longitude = null, DateTime = DateTime.UtcNow });
            await db.SaveChangesAsync();

            var controller = new DashboardController(db);

            var result = await controller.GetStatistics(gallery.Id, limit: 10);
            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var stats = Assert.IsType<DashboardStatisticsViewModel>(ok.Value);

            Assert.Equal(3, stats.PhotosWithoutGpsCount); // 2 in dir1 + 1 in dir2
            Assert.Equal(2, stats.AlbumsWithPhotosWithoutGpsCount);
            Assert.Equal(2, stats.AlbumsWithoutGps.Count);

            var album1 = stats.AlbumsWithoutGps.First(a => a.DirectoryPath == "Album1");
            Assert.Equal(2, album1.MissingGpsPhotoCount);
            var album2 = stats.AlbumsWithoutGps.First(a => a.DirectoryPath == "Album2");
            Assert.Equal(1, album2.MissingGpsPhotoCount);
        }

        [Fact]
        public async Task GetGpsBackfillProgress_ReturnsCorrectProgress()
        {
            using var db = CreateDb();

            var gallery = new Gallery("Test", "/orig", "/thumbs", DataProviderType.FileSystem, null, null);
            db.Galleries.Add(gallery);
            await db.SaveChangesAsync();

            var dir = new PhotoDirectory("Album1", 0, null, null) { Gallery = gallery };
            db.PhotoDirectories.Add(dir);
            await db.SaveChangesAsync();

            // Add 5 photos without GPS
            for (int i = 1; i <= 5; i++)
            {
                db.Photos.Add(new Photo($"photo{i}.jpg") { Directory = dir, Latitude = null, Longitude = null, DateTime = DateTime.UtcNow });
            }
            await db.SaveChangesAsync();

            // Simulate background service progress - photo ID 2 was last processed
            db.BackgroundServiceStates.Add(new BackgroundServiceState
            {
                Id = "photo-gps-backfill",
                State = "{\"LastProcessedPhotoId\":2}"
            });
            await db.SaveChangesAsync();

            var controller = new DashboardController(db);

            var result = await controller.GetGpsBackfillProgress(gallery.Id);
            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var progress = Assert.IsType<GpsBackfillProgressViewModel>(ok.Value);

            Assert.Equal(5, progress.TotalPhotosWithoutGps);
            Assert.Equal(2, progress.LastProcessedPhotoId);
            Assert.Equal(2, progress.ProcessedCount);
        }

        [Fact]
        public async Task GetGpsBackfillProgress_NoState_ReturnsZeroProgress()
        {
            using var db = CreateDb();

            var gallery = new Gallery("Test", "/orig", "/thumbs", DataProviderType.FileSystem, null, null);
            db.Galleries.Add(gallery);
            await db.SaveChangesAsync();

            var dir = new PhotoDirectory("Album1", 0, null, null) { Gallery = gallery };
            db.PhotoDirectories.Add(dir);
            await db.SaveChangesAsync();

            // Add photos without GPS but no background service state
            db.Photos.Add(new Photo("photo1.jpg") { Directory = dir, Latitude = null, Longitude = null, DateTime = DateTime.UtcNow });
            await db.SaveChangesAsync();

            var controller = new DashboardController(db);

            var result = await controller.GetGpsBackfillProgress(gallery.Id);
            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var progress = Assert.IsType<GpsBackfillProgressViewModel>(ok.Value);

            Assert.Equal(1, progress.TotalPhotosWithoutGps);
            Assert.Equal(0, progress.LastProcessedPhotoId);
            Assert.Equal(0, progress.ProcessedCount);
        }
    }
}
