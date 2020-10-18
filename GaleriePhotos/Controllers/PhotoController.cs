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

        public PhotoController(IOptions<GalerieOptions> options, PhotoService photoService, ApplicationDbContext applicationDbContext)
        {
            this.options = options;
            this.photoService = photoService;
            this.applicationDbContext = applicationDbContext;
        }

        private async Task<(PhotoDirectory?, Photo?)> GetPhoto(int directoryId, int id)
        {
            var directory = await applicationDbContext.PhotoDirectories.FindAsync(directoryId);
            var image = await applicationDbContext.Photos.FindAsync(id);
            return (directory, image);
        }

        [HttpGet("{directoryId}/photos/{id}/image")]
        [Authorize(Policies.Images)]
        public async Task<IActionResult> GetImage(int directoryId, int id)
        {
            var (directory, photo) = await GetPhoto(directoryId, id);
            if (directory == null || photo == null) return NotFound();
            var imagePath = photoService.GetAbsoluteImagePath(directory, photo);
            if (imagePath == null) return NotFound();
            if (!User.IsAdministrator() && !photo.Visible) return Forbid();
            return PhysicalFile(imagePath, photoService.GetMimeType(photo), Path.GetFileName(imagePath));
        }

        [HttpGet("{directoryId}/photos/{id}/thumbnail")]
        [Authorize(Policies.Images)]
        public async Task<IActionResult> GetThumbnail(int directoryId, int id)
        {
            var (directory, photo) = await GetPhoto(directoryId, id);
            if (directory == null || photo == null) return NotFound();
            
            if (!User.IsAdministrator() && !photo.Visible) return Forbid();
            var thumbnailPath = await photoService.GetThumbnailPath(directory, photo);
            return File(System.IO.File.ReadAllBytes(thumbnailPath), "image/jpeg", photo.FileName);
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
            if (!User.IsAdministrator() && !photo.Visible) return Forbid();
            var imagePath = photoService.GetAbsoluteImagePath(directory, photo);
            if (imagePath == null) return NotFound();
            var images = await photoService.GetDirectoryImages(directory);
            if (images == null) return NotFound();
            var visibleImages = images.Where(x => x.Visible).ToArray();
            if (!User.IsAdministrator()) images = visibleImages;
            var (previous, next) = GetNextAndPrevious(photo, images);
            var (previousVisible, nextVisible) = GetNextAndPrevious(photo, visibleImages);
            var viewModel = new PhotoFullViewModel(photo, previous, next, previousVisible, nextVisible);
            return Ok(viewModel);
        }        

        [Authorize(Policy =  Policies.Administrator)]
        [HttpPatch("{directoryId}/photos/{id}")]
        public async Task<ActionResult> Patch(int directoryId, int id, [FromBody]PhotoPatchViewModel viewModel)
        {
            var photo = await applicationDbContext.Photos.FindAsync(id);
            if (photo == null) return NotFound();
            if (viewModel.Visible.IsSet)
            {
                photo.Visible = viewModel.Visible.Value;
            }
            await applicationDbContext.SaveChangesAsync();
            return Ok();
        }

        [Authorize(Policy = Policies.Administrator)]
        [HttpPatch("{directoryId}/photos/all")]
        public async Task<ActionResult> PatchAll(int directoryId, [FromBody]PhotoPatchViewModel viewModel)
        {
            var directory = await applicationDbContext.PhotoDirectories.FindAsync(directoryId);
            if (directory == null) return NotFound();
            var photos = await photoService.GetDirectoryImages(directory);
            if (photos == null) return NotFound();
            foreach (var photo in photos)
            {
                if (viewModel.Visible.IsSet)
                {
                    photo.Visible = viewModel.Visible.Value;
                }
            }
            await applicationDbContext.SaveChangesAsync();
            return Ok();
        }
    }
}
