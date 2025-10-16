using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text.RegularExpressions;
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

            var dateMismatchCandidates = await galleryPhotosQuery
                .Where(p => p.FileName != null && p.FileName.Length >= 8)
                .AsNoTracking()
                .Select(p => new
                {
                    p.Id,
                    p.DateTime,
                    p.FileName,
                    p.DirectoryId,
                    DirectoryPath = p.Directory.Path
                })
                .OrderBy(p => p.DateTime)
                .ThenBy(p => p.Id)
                .ToListAsync();

            var mismatchedPhotos = new List<(int DirectoryId, string DirectoryPath, int PhotoId, DateOnly PhotoDate)>();
            foreach (var photo in dateMismatchCandidates)
            {
                if (!TryExtractDateFromFileName(photo.FileName, out var fileDate))
                {
                    continue;
                }

                var photoDate = DateOnly.FromDateTime(photo.DateTime);
                if (fileDate != photoDate)
                {
                    mismatchedPhotos.Add((
                        photo.DirectoryId,
                        photo.DirectoryPath ?? string.Empty,
                        photo.Id,
                        photoDate));
                }
            }

            var mismatchedAlbums = mismatchedPhotos
                .GroupBy(p => p.DirectoryId)
                .Select(group =>
                {
                    var firstPhoto = group
                        .OrderBy(x => x.PhotoDate)
                        .ThenBy(x => x.PhotoId)
                        .FirstOrDefault();

                    return new
                    {
                        DirectoryId = group.Key,
                        DirectoryPath = firstPhoto.DirectoryPath,
                        Count = group.Count(),
                        FirstPhotoId = firstPhoto.PhotoId
                    };
                })
                .OrderByDescending(x => x.Count)
                .ThenBy(x => x.DirectoryPath)
                .Take(limit)
                .ToList();

            var statistics = new DashboardStatisticsViewModel
            {
                PhotosWithoutGpsCount = photosWithoutGpsCount,
                AlbumsWithPhotosWithoutGpsCount = grouped.Count,
                AlbumsWithoutGps = grouped.Select(a => new AlbumWithoutGpsInfoViewModel(
                    a.DirectoryId,
                    a.DirectoryPath,
                    a.MissingCount
                )).ToList(),
                PhotosWithFilenameDateMismatchCount = mismatchedPhotos.Count,
                AlbumsWithPhotosWithFilenameDateMismatchCount = mismatchedAlbums.Count,
                AlbumsWithFilenameDateMismatch = mismatchedAlbums
                    .Select(a => new AlbumFilenameDateMismatchInfoViewModel(
                        a.DirectoryId,
                        a.DirectoryPath,
                        a.Count,
                        a.FirstPhotoId
                    ))
                    .ToList()
            };

            return Ok(statistics);
        }

        private static bool TryExtractDateFromFileName(string fileName, out DateOnly date)
        {
            date = default;
            if (string.IsNullOrWhiteSpace(fileName))
            {
                return false;
            }

            var match = Regex.Match(fileName, @"^(?<year>\d{4})[-_.]?(?<month>\d{2})[-_.]?(?<day>\d{2})");
            if (!match.Success)
            {
                return false;
            }

            if (!int.TryParse(match.Groups["year"].Value, out var year) ||
                !int.TryParse(match.Groups["month"].Value, out var month) ||
                !int.TryParse(match.Groups["day"].Value, out var day))
            {
                return false;
            }

            try
            {
                date = new DateOnly(year, month, day);
                return true;
            }
            catch (ArgumentOutOfRangeException)
            {
                return false;
            }
        }
    }
}