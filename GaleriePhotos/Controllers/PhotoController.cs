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

namespace Galerie.Server.Controllers
{
    [Route("api/directory")]
    public class PhotoController : Controller
    {
        private readonly IOptions<GalerieOptions> options;
        private readonly PhotoService photoService;
        private readonly ApplicationDbContext applicationDbContext;
        private readonly DataService dataService;

        public PhotoController(IOptions<GalerieOptions> options, PhotoService photoService, ApplicationDbContext applicationDbContext, DataService dataService)
        {
            this.options = options;
            this.photoService = photoService;
            this.applicationDbContext = applicationDbContext;
            this.dataService = dataService;
        }

        private async Task<(PhotoDirectory?, Photo?)> GetPhoto(int directoryId, int id)
        {
            var directory = await photoService.GetPhotoDirectoryAsync(directoryId);
            var image = await applicationDbContext.Photos.FindAsync(id);
            return (directory, image);
        }

        [HttpGet("{directoryId}/photos/{id}/image")]
        [Authorize(Policies.Images)]
        public async Task<IActionResult> GetImage(int directoryId, int id)
        {
            var (directory, photo) = await GetPhoto(directoryId, id);
            if (directory == null || photo == null) return NotFound();
            if (!photoService.IsDirectoryVisible(User, directory)) return Forbid();
            var dataProvider = dataService.GetDataProvider(directory.Gallery);
            var bytes = await dataProvider.OpenFileRead(directory, photo);
            if (bytes == null) return NotFound();
            return File(bytes, photoService.GetMimeType(photo), photo.FileName);
        }

        [HttpGet("{directoryId}/photos/{id}/thumbnail")]
        [Authorize(Policies.Images)]
        public async Task<IActionResult> GetThumbnail(int directoryId, int id)
        {
            var (directory, photo) = await GetPhoto(directoryId, id);
            if (directory == null || photo == null) return NotFound();

            if (!photoService.IsDirectoryVisible(User, directory)) return Forbid();
            var bytes = await photoService.GetThumbnail(directory, photo);
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

        [HttpGet("{directoryId}/photos/{id}")]
        public async Task<ActionResult<PhotoFullViewModel>> Get(int directoryId, int id)
        {
            var (directory, photo) = await GetPhoto(directoryId, id);
            if (directory == null || photo == null) return NotFound();
            if (!photoService.IsDirectoryVisible(User, directory)) return Forbid();
            var images = await photoService.GetDirectoryImages(directory);
            if (images == null) return NotFound();
            var (previous, next) = GetNextAndPrevious(photo, images);
            var isPrivate = photoService.IsPrivate(directory);
            var viewModel = new PhotoFullViewModel(photo, previous, next, isPrivate);
            return Ok(viewModel);
        }

        [Authorize(Policy = Policies.Administrator)]
        [HttpPatch("{directoryId}/photos/{id}")]
        public async Task<ActionResult> Patch(int directoryId, int id, [FromBody] PhotoPatchViewModel viewModel)
        {
            var photo = await applicationDbContext.Photos.FindAsync(id);
            if (photo == null) return NotFound();
            await applicationDbContext.SaveChangesAsync();
            return Ok();
        }

        [Authorize(Policy = Policies.Administrator)]
        [HttpPatch("{directoryId}/photos/{id}/access")]
        public async Task<ActionResult> SetAccess(int directoryId, int id, [FromBody] PhotoAccessViewModel viewModel)
        {
            var (directory, photo) = await GetPhoto(directoryId, id);
            if (directory == null || photo == null) return NotFound();
            if (viewModel.Private) await photoService.MoveToPrivate(directory, photo);
            else await photoService.MoveToPublic(directory, photo);
            return Ok();
        }

        [Authorize(Policy = Policies.Administrator)]
        [HttpPatch("{directoryId}/photos/{id}/rotate")]
        public async Task<ActionResult> Rotate(int directoryId, int id, [FromBody] PhotoRotateViewModel viewModel)
        {
            var (directory, photo) = await GetPhoto(directoryId, id);
            if (directory == null || photo == null) return NotFound();
            if (!await photoService.RotatePhoto(directory, photo, viewModel.Angle))
                return BadRequest("Impossible de faire pivoter la photo (angle invalide ou erreur interne).");
            return Ok();
        }
    }
}
