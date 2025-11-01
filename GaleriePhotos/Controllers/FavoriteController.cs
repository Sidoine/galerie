using System;
using System.Linq;
using System.Threading.Tasks;
using Galerie.Server.ViewModels;
using GaleriePhotos.Data;
using GaleriePhotos.Models;
using GaleriePhotos.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Galerie.Server.Controllers
{
    [Route("api/galleries")]
    [Authorize]
    public class FavoriteController : Controller
    {
        private readonly ApplicationDbContext applicationDbContext;
        private readonly ILogger<FavoriteController> logger;
        private readonly GalleryService galleryService;

        public FavoriteController(ApplicationDbContext applicationDbContext, ILogger<FavoriteController> logger, GalleryService galleryService)
        {
            this.applicationDbContext = applicationDbContext;
            this.logger = logger;
            this.galleryService = galleryService;
        }

        [HttpGet("{galleryId}/favorites/photos")]
        public async Task<ActionResult<PhotoViewModel[]>> GetFavoritePhotos(int galleryId, string sortOrder = "asc", int offset = 0, int count = 25, DateTime? startDate = null)
        {
            var userId = User.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            try
            {
                var galleryMember = await galleryService.GetMember(galleryId, userId);
                if (galleryMember == null) return Forbid();

                var query = applicationDbContext.Photos
                    .Include(p => p.Place)
                    .Where(p => p.Directory.GalleryId == galleryId && applicationDbContext.PhotoFavorites.Any(f =>
                        f.UserId == userId &&
                        f.PhotoId == p.Id))
                    .ApplyRights(galleryMember)
                    .ApplySortingAndOffset(sortOrder, offset, count, startDate);
                var photos = await query.ToArrayAsync();

                return Ok(photos.Select(p => new PhotoViewModel(p, isFavorite: true)).ToArray());
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting favorite photos for user {UserId}", userId);
                return StatusCode(500, "Internal server error");
            }
        }
    }
}
