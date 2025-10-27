using System;
using System.Collections.Generic;
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

            var galleryPhotosQuery = applicationDbContext.Photos
                .Where(p => p.Directory.GalleryId == galleryId
                            && p.Directory.PhotoDirectoryType != PhotoDirectoryType.Private
                            && p.Directory.PhotoDirectoryType != PhotoDirectoryType.Trash);

            var photosWithoutGpsQuery = galleryPhotosQuery
                .Where(p => p.Latitude == null || p.Longitude == null || (p.Latitude == 0 && p.Longitude == 0));

            // Total photos without GPS
            var photosWithoutGpsCount = await photosWithoutGpsQuery.CountAsync();

            // Group by directory to get aggregated missing GPS counts
            var grouped = await photosWithoutGpsQuery
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
            // Faces automatically named from other detected faces
            var autoNamedFacesQuery = from f in applicationDbContext.Faces
                                      join p in applicationDbContext.Photos on f.PhotoId equals p.Id
                                      where f.AutoNamedFromFaceId.HasValue
                                          && p.Directory.GalleryId == galleryId
                                          && p.Directory.PhotoDirectoryType != PhotoDirectoryType.Private
                                          && p.Directory.PhotoDirectoryType != PhotoDirectoryType.Trash
                                      select new { f.Id, AutoNamedFromFaceId = f.AutoNamedFromFaceId!.Value };
            var autoNamedFacesCount = await autoNamedFacesQuery.CountAsync();
            var autoNamedFaceSamples = await autoNamedFacesQuery
                .Take(limit)
                .Select(x => new AutoNamedFaceSampleInfoViewModel(x.Id, x.AutoNamedFromFaceId))
                .ToListAsync();
            statistics.AutoNamedFacesCount = autoNamedFacesCount;
            statistics.AutoNamedFaceSamples = autoNamedFaceSamples;

            return Ok(statistics);
        }

        [HttpGet("gps-backfill-progress")]
        public async Task<ActionResult<GpsBackfillProgressViewModel>> GetGpsBackfillProgress(int galleryId)
        {
            // Get total count of photos without GPS in gallery
            var totalPhotosWithoutGps = await applicationDbContext.Photos
                .Where(p => p.Directory.GalleryId == galleryId
                    && (p.Latitude == null || p.Longitude == null || (p.Latitude == 0 && p.Longitude == 0))
                    && p.Directory.PhotoDirectoryType != PhotoDirectoryType.Private
                    && p.Directory.PhotoDirectoryType != PhotoDirectoryType.Trash)
                .CountAsync();

            // Get the last processed photo ID from background service state
            var serviceState = await applicationDbContext.BackgroundServiceStates
                .SingleOrDefaultAsync(s => s.Id == "photo-gps-backfill");

            int lastProcessedPhotoId = 0;
            if (serviceState != null && !string.IsNullOrWhiteSpace(serviceState.State))
            {
                try
                {
                    var state = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(serviceState.State);
                    if (state != null && state.ContainsKey("LastProcessedPhotoId"))
                    {
                        var value = state["LastProcessedPhotoId"];
                        if (value != null)
                        {
                            lastProcessedPhotoId = Convert.ToInt32(value.ToString());
                        }
                    }
                }
                catch
                {
                    // If deserialization fails, keep lastProcessedPhotoId as 0
                }
            }

            // Get count of photos that have been processed (photos with ID <= lastProcessedPhotoId)
            var processedCount = lastProcessedPhotoId > 0
                ? await applicationDbContext.Photos
                    .Where(p => p.Directory.GalleryId == galleryId
                        && p.Id <= lastProcessedPhotoId
                        && p.Directory.PhotoDirectoryType != PhotoDirectoryType.Private
                        && p.Directory.PhotoDirectoryType != PhotoDirectoryType.Trash)
                    .CountAsync()
                : 0;

            return Ok(new GpsBackfillProgressViewModel
            {
                TotalPhotosWithoutGps = totalPhotosWithoutGps,
                ProcessedCount = processedCount,
                LastProcessedPhotoId = lastProcessedPhotoId
            });
        }
    }
}