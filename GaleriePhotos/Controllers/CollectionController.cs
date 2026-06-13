using System;
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
using Microsoft.Extensions.Logging;

namespace Galerie.Server.Controllers
{
    [Route("api/galleries")]
    [Authorize]
    public class CollectionController : Controller
    {
        private readonly ApplicationDbContext applicationDbContext;
        private readonly ILogger<CollectionController> logger;
        private readonly GalleryService galleryService;

        public CollectionController(
            ApplicationDbContext applicationDbContext,
            ILogger<CollectionController> logger,
            GalleryService galleryService)
        {
            this.applicationDbContext = applicationDbContext;
            this.logger = logger;
            this.galleryService = galleryService;
        }

        [HttpGet("{galleryId}/collections")]
        public async Task<ActionResult<PhotoCollectionViewModel[]>> GetCollections(int galleryId)
        {
            var userId = User.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            try
            {
                var galleryMember = await galleryService.GetMember(galleryId, userId);
                if (galleryMember == null) return Forbid();

                var collections = await applicationDbContext.PhotoCollections
                    .Where(c => c.GalleryId == galleryId && c.UserId == userId)
                    .OrderBy(c => c.Name)
                    .Select(c => new PhotoCollectionViewModel(
                        c.Id,
                        c.Name,
                        c.Photos.Count))
                    .ToArrayAsync();

                return Ok(collections);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting collections for user {UserId}", userId);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost("{galleryId}/collections")]
        public async Task<ActionResult<PhotoCollectionViewModel>> CreateCollection(int galleryId, [FromBody] PhotoCollectionCreateViewModel viewModel)
        {
            var userId = User.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var name = viewModel.Name?.Trim();
            if (string.IsNullOrWhiteSpace(name))
                return BadRequest("Le nom de la collection est requis.");

            if (name.Length > 100)
                return BadRequest("Le nom de la collection est trop long.");

            try
            {
                var galleryMember = await galleryService.GetMember(galleryId, userId);
                if (galleryMember == null) return Forbid();

                var alreadyExists = await applicationDbContext.PhotoCollections
                    .AnyAsync(c => c.GalleryId == galleryId
                                   && c.UserId == userId
                                   && c.Name.ToLower() == name.ToLower());

                if (alreadyExists)
                    return BadRequest("Une collection avec ce nom existe déjà.");

                var collection = new PhotoCollection(galleryId, userId, name);
                applicationDbContext.PhotoCollections.Add(collection);
                await applicationDbContext.SaveChangesAsync();

                return Ok(new PhotoCollectionViewModel(collection.Id, collection.Name, 0));
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error creating collection for user {UserId}", userId);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost("{galleryId}/collections/{collectionId}/photos")]
        public async Task<ActionResult<int>> AddPhotosToCollection(int galleryId, int collectionId, [FromBody] PhotoCollectionAddPhotosViewModel viewModel)
        {
            var userId = User.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            if (viewModel.PhotoIds == null || viewModel.PhotoIds.Length == 0)
                return BadRequest("Aucune photo spécifiée.");

            try
            {
                var galleryMember = await galleryService.GetMember(galleryId, userId);
                if (galleryMember == null) return Forbid();

                var collection = await applicationDbContext.PhotoCollections
                    .FirstOrDefaultAsync(c => c.Id == collectionId
                                              && c.GalleryId == galleryId
                                              && c.UserId == userId);

                if (collection == null) return NotFound();

                var normalizedPhotoIds = viewModel.PhotoIds.Distinct().ToArray();

                var accessiblePhotoIds = await applicationDbContext.Photos
                    .Where(p => normalizedPhotoIds.Contains(p.Id)
                                && p.Directory.GalleryId == galleryId)
                    .ApplyRights(galleryMember)
                    .Select(p => p.Id)
                    .ToArrayAsync();

                if (accessiblePhotoIds.Length == 0)
                    return BadRequest("Aucune photo accessible à ajouter.");

                var existingPhotoIds = await applicationDbContext.PhotoCollectionPhotos
                    .Where(cp => cp.PhotoCollectionId == collectionId
                                 && accessiblePhotoIds.Contains(cp.PhotoId))
                    .Select(cp => cp.PhotoId)
                    .ToArrayAsync();

                var photoIdsToAdd = accessiblePhotoIds.Except(existingPhotoIds).ToArray();
                foreach (var photoId in photoIdsToAdd)
                {
                    applicationDbContext.PhotoCollectionPhotos.Add(new PhotoCollectionPhoto(collectionId, photoId));
                }

                await applicationDbContext.SaveChangesAsync();
                return Ok(photoIdsToAdd.Length);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error adding photos to collection {CollectionId} for user {UserId}", collectionId, userId);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost("{galleryId}/collections/{collectionId}/photos/remove")]
        public async Task<ActionResult<int>> RemovePhotosFromCollection(
            int galleryId,
            int collectionId,
            [FromBody] PhotoCollectionRemovePhotosViewModel viewModel)
        {
            var userId = User.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            if (viewModel.PhotoIds == null || viewModel.PhotoIds.Length == 0)
                return BadRequest("Aucune photo spécifiée.");

            try
            {
                var galleryMember = await galleryService.GetMember(galleryId, userId);
                if (galleryMember == null) return Forbid();

                var collection = await applicationDbContext.PhotoCollections
                    .FirstOrDefaultAsync(c => c.Id == collectionId
                                              && c.GalleryId == galleryId
                                              && c.UserId == userId);

                if (collection == null) return NotFound();

                var photoIdsToRemove = viewModel.PhotoIds.Distinct().ToArray();

                var linksToRemove = await applicationDbContext.PhotoCollectionPhotos
                    .Where(cp => cp.PhotoCollectionId == collectionId
                                 && photoIdsToRemove.Contains(cp.PhotoId))
                    .ToArrayAsync();

                if (linksToRemove.Length == 0)
                    return Ok(0);

                applicationDbContext.PhotoCollectionPhotos.RemoveRange(linksToRemove);
                await applicationDbContext.SaveChangesAsync();

                return Ok(linksToRemove.Length);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error removing photos from collection {CollectionId} for user {UserId}", collectionId, userId);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("{galleryId}/collections/{collectionId}/photos")]
        public async Task<ActionResult<PhotoViewModel[]>> GetCollectionPhotos(
            int galleryId,
            int collectionId,
            string sortOrder = "asc",
            int offset = 0,
            int count = 25,
            DateTime? startDate = null)
        {
            var userId = User.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            try
            {
                var galleryMember = await galleryService.GetMember(galleryId, userId);
                if (galleryMember == null) return Forbid();

                var collection = await applicationDbContext.PhotoCollections
                    .FirstOrDefaultAsync(c => c.Id == collectionId
                                              && c.GalleryId == galleryId
                                              && c.UserId == userId);
                if (collection == null) return NotFound();

                var query = applicationDbContext.Photos
                    .Include(p => p.Place)
                    .Where(p => p.Directory.GalleryId == galleryId
                                && applicationDbContext.PhotoCollectionPhotos.Any(cp =>
                                    cp.PhotoCollectionId == collectionId
                                    && cp.PhotoId == p.Id))
                    .ApplyRights(galleryMember)
                    .ApplySortingAndOffset(sortOrder, offset, count, startDate);

                var photos = await query.ToArrayAsync();
                var photoIds = photos.Select(p => p.Id).ToArray();
                var favoriteIds = await applicationDbContext.PhotoFavorites
                    .Where(f => f.UserId == userId && photoIds.Contains(f.PhotoId))
                    .Select(f => f.PhotoId)
                    .ToArrayAsync();

                var favoriteSet = favoriteIds.ToHashSet();
                return Ok(photos.Select(p => new PhotoViewModel(p, isFavorite: favoriteSet.Contains(p.Id))).ToArray());
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting collection photos for user {UserId}", userId);
                return StatusCode(500, "Internal server error");
            }
        }
    }
}