using System.Linq;
using System.Threading.Tasks;
using GaleriePhotos.Data;
using GaleriePhotos.ViewModels;
using GaleriePhotos.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GaleriePhotos.Controllers
{
    [Route("api/galleries/{galleryId}/dashboard")]
    [Authorize(Policy = Policies.Administrator)]
    public class DashboardController : Controller
    {
        private readonly ApplicationDbContext applicationDbContext;

        public DashboardController(ApplicationDbContext applicationDbContext)
        {
            this.applicationDbContext = applicationDbContext;
        }

        [HttpGet("statistics")]
        public async Task<ActionResult<DashboardStatisticsViewModel>> GetStatistics(int galleryId)
        {
            // Find photos that have no GPS coordinates (both Latitude and Longitude are null or both are 0) for the specific gallery
            var photosWithoutGps = await applicationDbContext.Photos
                .Where(p => p.Directory.GalleryId == galleryId
                    && (p.Latitude == null || p.Longitude == null || (p.Latitude == 0 && p.Longitude == 0))
                    && p.Directory.PhotoDirectoryType != PhotoDirectoryType.Private
                    && p.Directory.PhotoDirectoryType != PhotoDirectoryType.Trash)
                .Include(p => p.Directory)
                .ThenInclude(d => d.Gallery)
                .OrderBy(p => p.Directory.GalleryId)
                .ThenBy(p => p.Directory.Path)
                .ThenBy(p => p.FileName)
                .ToListAsync();

            var statistics = new DashboardStatisticsViewModel
            {
                PhotosWithoutGpsCount = photosWithoutGps.Count,
                PhotosWithoutGpsAlbums = photosWithoutGps.Select(p => new PhotoWithoutGpsAlbumInfo(
                    p.Id,
                    p.FileName,
                    p.DirectoryId,
                    System.IO.Path.GetFileName(p.Directory.Path) ?? p.Directory.Path,
                    p.Directory.Path,
                    p.Directory.GalleryId,
                    p.Directory.Gallery.Name ?? "Unknown Gallery"
                )).ToList()
            };

            return Ok(statistics);
        }
    }
}