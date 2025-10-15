using System;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;
using Galerie.Server.ViewModels;
using GaleriePhotos.Data;
using GaleriePhotos.Models;
using GaleriePhotos.Services;
using GaleriePhotos.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GaleriePhotos.Controllers
{
    [Authorize]
    [Route("api/gallery/{galleryId}/search")]
    public class SearchController : Controller
    {
        private static readonly CultureInfo[] DateCultures =
        {
            CultureInfo.InvariantCulture,
            CultureInfo.GetCultureInfo("fr-FR")
        };

        private static readonly string[] DateFormats =
        {
            "yyyy-MM-dd",
            "yyyy/MM/dd",
            "dd/MM/yyyy",
            "dd-MM-yyyy",
            "MM/dd/yyyy",
            "MM-dd-yyyy"
        };

        private readonly ApplicationDbContext applicationDbContext;
        private readonly GalleryService galleryService;

        public SearchController(ApplicationDbContext applicationDbContext, GalleryService galleryService)
        {
            this.applicationDbContext = applicationDbContext;
            this.galleryService = galleryService;
        }

        [HttpGet("summary")]
        public async Task<ActionResult<SearchResultFullViewModel>> GetSummary(int galleryId, [FromQuery] string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return BadRequest("La requête de recherche ne peut pas être vide.");
            }

            var gallery = await galleryService.Get(galleryId);
            if (gallery == null)
            {
                return NotFound();
            }

            if (!User.IsGalleryMember(gallery))
            {
                return Forbid();
            }

            var photosQuery = BuildSearchQuery(gallery, query);

            var count = await photosQuery.CountAsync();
            if (count == 0)
            {
                return Ok(new SearchResultFullViewModel { NumberOfPhotos = 0, MinDate = null, MaxDate = null, Name = query, CoverPhotoId = null  });
            }

            var minDate = await photosQuery.MinAsync(p => p.DateTime);
            var maxDate = await photosQuery.MaxAsync(p => p.DateTime);

            return Ok(new SearchResultFullViewModel
            {
                NumberOfPhotos = count,
                MinDate = minDate,
                MaxDate = maxDate,
                Name = query,
                CoverPhotoId = null,
            });
        }

        [HttpGet("photos")]
        public async Task<ActionResult<PhotoViewModel[]>> GetPhotos(int galleryId, [FromQuery] string query, DateTime? minDate = null, DateTime? maxDate = null)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return BadRequest("La requête de recherche ne peut pas être vide.");
            }

            var gallery = await galleryService.Get(galleryId);
            if (gallery == null)
            {
                return NotFound();
            }

            if (!User.IsGalleryMember(gallery))
            {
                return Forbid();
            }

            var photosQuery = BuildSearchQuery(gallery, query);

            if (minDate.HasValue)
            {
                photosQuery = photosQuery.Where(p => p.DateTime >= minDate.Value.ToUniversalTime());
            }

            if (maxDate.HasValue)
            {
                photosQuery = photosQuery.Where(p => p.DateTime <= maxDate.Value.ToUniversalTime());
            }

            var photos = await photosQuery
                .OrderBy(p => p.DateTime)
                .ToListAsync();

            return Ok(photos.Select(p => new PhotoViewModel(p)).ToArray());
        }

        private IQueryable<Photo> BuildSearchQuery(Gallery gallery, string query)
        {
            var photos = applicationDbContext.Photos
                .Include(p => p.Directory)
                .Where(p => p.Directory.GalleryId == gallery.Id &&
                            p.Directory.PhotoDirectoryType != PhotoDirectoryType.Private &&
                            p.Directory.PhotoDirectoryType != PhotoDirectoryType.Trash);

            var userId = User.GetUserId();
            if (!User.IsGalleryAdministrator(gallery) && userId != null)
            {
                var member = gallery.Members.FirstOrDefault(m => m.UserId == userId);
                if (member != null && !member.IsAdministrator)
                {
                    var mask = member.DirectoryVisibility;
                    photos = photos.Where(p => (p.Directory.Visibility & mask) != 0);
                }
            }

            var tokens = query.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            foreach (var token in tokens)
            {
                if (TryApplyDateFilter(ref photos, token))
                {
                    continue;
                }

                var pattern = $"%{token}%";
                photos = photos.Where(p =>
                    applicationDbContext.Faces.Any(f => f.PhotoId == p.Id && f.FaceNameId != null && EF.Functions.ILike(f.FaceName!.Name, pattern)) ||
                    (p.Place != null && EF.Functions.ILike(p.Place.Name, pattern)));
            }

            return photos;
        }

        private bool TryApplyDateFilter(ref IQueryable<Photo> query, string token)
        {
            if (token.Length == 4 && int.TryParse(token, out var year))
            {
                var localYear = year;
                query = query.Where(p => p.DateTime.Year == localYear);
                return true;
            }

            if (TryParseYearMonth(token, out var yearMonth))
            {
                var localYear = yearMonth.Year;
                var localMonth = yearMonth.Month;
                query = query.Where(p => p.DateTime.Year == localYear && p.DateTime.Month == localMonth);
                return true;
            }

            if (TryParseFullDate(token, out var date))
            {
                var dateOnly = date.Date;
                query = query.Where(p => p.DateTime.Date == dateOnly);
                return true;
            }

            return false;
        }

        private static bool TryParseYearMonth(string token, out (int Year, int Month) result)
        {
            var formats = new[] { "yyyy-MM", "yyyy/MM", "yyyy.MM" };
            foreach (var format in formats)
            {
                if (DateTime.TryParseExact(token, format, CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
                {
                    result = (date.Year, date.Month);
                    return true;
                }
            }

            result = default;
            return false;
        }

        private static bool TryParseFullDate(string token, out DateTime date)
        {
            foreach (var culture in DateCultures)
            {
                if (DateTime.TryParseExact(token, DateFormats, culture, DateTimeStyles.None, out date))
                {
                    return true;
                }

                if (DateTime.TryParse(token, culture, DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out date))
                {
                    return true;
                }
            }

            date = default;
            return false;
        }
    }
}
