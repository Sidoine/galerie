using System;
using System.IO;
using Galerie.Server.ViewModels;
using GaleriePhotos;
using GaleriePhotos.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using System.Linq;
using GaleriePhotos.ViewModels;
using System.Threading.Tasks;
using GaleriePhotos.Data;
using GaleriePhotos.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace Galerie.Server.Controllers
{
    [Route("api/photos")]
    public class PhotoController : Controller
    {
        private readonly IOptions<GalerieOptions> options;
        private readonly PhotoService photoService;
        private readonly ApplicationDbContext applicationDbContext;
        private readonly DataService dataService;
        private readonly GalleryService galleryService;

        public PhotoController(IOptions<GalerieOptions> options, PhotoService photoService, ApplicationDbContext applicationDbContext, DataService dataService, GalleryService galleryService)
        {
            this.options = options;
            this.photoService = photoService;
            this.applicationDbContext = applicationDbContext;
            this.dataService = dataService;
            this.galleryService = galleryService;
        }

        /// <summary>
        /// Gets the full image for a photo by its public ID.
        /// NOTE: This endpoint allows anonymous access for public sharing via the publicId (GUID) which acts as a secret token.
        /// This is a design decision to enable photo sharing without authentication, but anyone with the URL can access the photo.
        /// </summary>
        [HttpGet("{publicId}/image")]
        [AllowAnonymous]
        public async Task<IActionResult> GetImage(Guid publicId)
        {
            var photo = await photoService.GetPhoto(publicId);
            if (photo == null) return NotFound();
            var dataProvider = dataService.GetDataProvider(photo.Directory.Gallery);
            var bytes = await dataProvider.OpenFileRead(photo);
            if (bytes == null) return NotFound();
            return File(bytes, photoService.GetMimeType(photo), photo.FileName);
        }

        /// <summary>
        /// Gets the thumbnail for a photo by its public ID.
        /// NOTE: This endpoint allows anonymous access for public sharing via the publicId (GUID) which acts as a secret token.
        /// This is a design decision to enable photo sharing without authentication, but anyone with the URL can access the photo.
        /// </summary>
        [HttpGet("{publicId}/thumbnail")]
        [AllowAnonymous]
        public async Task<IActionResult> GetThumbnail(Guid publicId)
        {
            var photo = await photoService.GetPhoto(publicId);
            if (photo == null) return NotFound();

            var bytes = await photoService.GetThumbnail(photo);
            if (bytes == null) return NotFound();
            return File(bytes, "image/jpeg", photo.FileName);
        }

        private (Photo? previous, Photo? next) GetNextAndPrevious(Photo photo, Photo[] images)
        {
            var index = Array.IndexOf(images, photo);
            Photo? previous = null;
            Photo? next = null;
            if (index != -1)
            {
                if (index > 0) previous = images[index - 1];
                if (index < images.Length - 1) next = images[index + 1];
            }
            return (previous, next);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<PhotoFullViewModel>> Get(int id)
        {
            var photo = await photoService.GetPhoto(id);
            if (photo == null) return NotFound();
            if (!photoService.IsDirectoryVisible(User, photo.Directory)) return Forbid();
            var images = await photoService.GetDirectoryImages(photo.Directory);
            if (images == null) return NotFound();
            var (previous, next) = GetNextAndPrevious(photo, images);
            var isPrivate = photoService.IsPrivate(photo.Directory);
            var isFavorite = await photoService.IsPhotoFavorite(id, User);
            var viewModel = new PhotoFullViewModel(photo, previous, next, isPrivate, isFavorite);
            return Ok(viewModel);
        }

        [Authorize(Policy = Policies.Administrator)]
        [HttpPatch("{id}")]
        public async Task<ActionResult> Patch(int id, [FromBody] PhotoPatchViewModel viewModel)
        {
            var photo = await photoService.GetPhoto(id);
            if (photo == null) return NotFound();
            await applicationDbContext.SaveChangesAsync();
            return Ok();
        }

        [Authorize(Policy = Policies.Administrator)]
        [HttpPatch("{id}/access")]
        public async Task<ActionResult> SetAccess(int id, [FromBody] PhotoAccessViewModel viewModel)
        {
            var photo = await photoService.GetPhoto(id);
            if (photo == null) return NotFound();
            if (viewModel.Private) await photoService.MoveToPrivate(photo);
            else await photoService.MoveToPublic(photo);
            return Ok();
        }

        [Authorize(Policy = Policies.Administrator)]
        [HttpPatch("{id}/rotate")]
        public async Task<ActionResult> Rotate(int id, [FromBody] PhotoRotateViewModel viewModel)
        {
            var photo = await photoService.GetPhoto(id);
            if (photo == null) return NotFound();
            if (!await photoService.RotatePhoto(photo, viewModel.Angle))
                return BadRequest("Impossible de faire pivoter la photo (angle invalide ou erreur interne).");
            return Ok();
        }

        [Authorize(Policy = Policies.Administrator)]
        [HttpPost("bulk-update-location")]
        public async Task<ActionResult> BulkUpdateLocation([FromBody] PhotoBulkUpdateLocationViewModel viewModel)
        {
            if (viewModel.PhotoIds == null || viewModel.PhotoIds.Length == 0)
                return BadRequest("Aucune photo spécifiée");

            await photoService.BulkUpdatePhotosLocation(viewModel.PhotoIds, viewModel.Latitude, viewModel.Longitude, viewModel.OverwriteExisting);
            return Ok();
        }

        [Authorize(Policy = Policies.Administrator)]
        [HttpPost("bulk-update-date")]
        public async Task<ActionResult> BulkUpdateDate([FromBody] PhotoBulkUpdateDateViewModel viewModel)
        {
            if (viewModel.PhotoIds == null || viewModel.PhotoIds.Length == 0)
                return BadRequest("Aucune photo spécifiée");

            await photoService.BulkUpdatePhotosDate(viewModel.PhotoIds, viewModel.DateTime);
            return Ok();
        }

        [Authorize(Policy = Policies.Administrator)]
        [HttpPost("galleries/{galleryId}/move")]
        public async Task<ActionResult> MovePhotos(int galleryId, [FromBody] PhotoMoveViewModel viewModel)
        {
            if (viewModel.PhotoIds == null || viewModel.PhotoIds.Length == 0)
                return BadRequest("Aucune photo spécifiée");

            var gallery = await galleryService.Get(galleryId);
            if (gallery == null) return NotFound("Galerie introuvable");
            if (!User.IsGalleryAdministrator(gallery)) return Forbid();

            try
            {
                await photoService.MovePhotosToDirectory(galleryId, viewModel.PhotoIds, viewModel.TargetDirectoryId);
                return Ok();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [Authorize]
        [HttpPost("{id}/favorite")]
        public async Task<ActionResult<bool>> ToggleFavorite(int id)
        {
            var photo = await photoService.GetPhoto(id);
            if (photo == null) return NotFound();
            if (!photoService.IsDirectoryVisible(User, photo.Directory)) return Forbid();

            var isFavorite = await photoService.TogglePhotoFavorite(id, User);
            return Ok(isFavorite);
        }
    }
}
