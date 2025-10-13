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
        public async Task<ActionResult<DashboardStatisticsViewModel>> GetStatistics(int galleryId, [FromQuery] int limit = 20)
        {
            if (limit <= 0) limit = 20;
            if (limit > 200) limit = 200; // guardrail

            var photosQuery = applicationDbContext.Photos
                .Where(p => p.Directory.GalleryId == galleryId
                            && (p.Latitude == null || p.Longitude == null || (p.Latitude == 0 && p.Longitude == 0))
                            && p.Directory.PhotoDirectoryType != PhotoDirectoryType.Private
                            && p.Directory.PhotoDirectoryType != PhotoDirectoryType.Trash);

            // Total photos without GPS
            var photosWithoutGpsCount = await photosQuery.CountAsync();

            // Group by directory to get aggregated missing GPS counts
            var grouped = await photosQuery
                .GroupBy(p => new { p.DirectoryId, p.Directory.Path })
                .Select(g => new
                {
                    g.Key.DirectoryId,
                    DirectoryPath = g.Key.Path,
                    MissingCount = g.Count()
                })
                .OrderByDescending(x => x.MissingCount)
                .ThenBy(x => x.DirectoryPath)
                .Take(limit)
                .ToListAsync();

            var statistics = new DashboardStatisticsViewModel
            {
                PhotosWithoutGpsCount = photosWithoutGpsCount,
                AlbumsWithPhotosWithoutGpsCount = grouped.Count,
                AlbumsWithoutGps = grouped.Select(a => new AlbumWithoutGpsInfoViewModel(
                    a.DirectoryId,
                    a.DirectoryPath,
                    a.MissingCount
                )).ToList()
            };

            return Ok(statistics);
        }
    }
}