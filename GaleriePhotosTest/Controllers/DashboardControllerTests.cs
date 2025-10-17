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
    }
}
