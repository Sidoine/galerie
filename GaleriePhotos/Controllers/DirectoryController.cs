using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Galerie.Server.ViewModels;
using GaleriePhotos;
using GaleriePhotos.Data;
using GaleriePhotos.Models;
using GaleriePhotos.Services;
using GaleriePhotos.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Galerie.Server.Controllers
{
    [Authorize]
    [Route("api/directories")]
    public class DirectoryController : Controller
    {
        private readonly PhotoService photoService;
        private readonly ApplicationDbContext applicationDbContext;
        private readonly DataService dataService;

        public DirectoryController(PhotoService photoService, ApplicationDbContext applicationDbContext, DataService dataService)
        {
            this.photoService = photoService;
            this.applicationDbContext = applicationDbContext;
            this.dataService = dataService;
        }

        // New: get root directory for a specific gallery (used when galleryId is in the URL)
        [HttpGet("root/{galleryId}")]
        public async Task<ActionResult<DirectoryViewModel>> GetGalleryRoot(int galleryId)
        {
            var userId = User.GetUserId();
            if (userId == null) return Unauthorized();

            var isMember = await applicationDbContext.GalleryMembers.AnyAsync(gm => gm.UserId == userId && gm.GalleryId == galleryId);
            if (!isMember) return Forbid();

            var gallery = await applicationDbContext.Galleries.FindAsync(galleryId);

            if (gallery == null || !dataService.GetDataProvider(gallery).IsSetup) return NotFound();

            var galleryRootDirectory = await photoService.GetRootDirectory(gallery);
            var coverPhoto = galleryRootDirectory.CoverPhotoId != null ? await photoService.GetPhoto(galleryRootDirectory.CoverPhotoId.Value) : null;
            return Ok(new DirectoryViewModel(galleryRootDirectory, coverPhoto, await photoService.GetNumberOfPhotos(galleryRootDirectory), await photoService.GetNumberOfSubDirectories(galleryRootDirectory)));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<DirectoryFullViewModel>> Get(int id)
        {
            var directory = await photoService.GetPhotoDirectoryAsync(id);
            if (directory == null) return NotFound();

            // Use new gallery-aware visibility check, fallback to claims-based for administrators
            if (!User.IsAdministrator() && !photoService.IsDirectoryVisible(User, directory))
            {
                return Forbid();
            }

            var parent = directory.Path != "" ? Path.GetDirectoryName(directory.Path) : null;
            var parentDirectory = parent != null ? await applicationDbContext.PhotoDirectories.Include(x => x.Gallery).FirstOrDefaultAsync(x => x.Path == parent && x.GalleryId == directory.GalleryId) : null;
            var coverPhoto = directory.CoverPhotoId != null ? await photoService.GetPhoto(directory.CoverPhotoId.Value) : null;
            return Ok(new DirectoryFullViewModel(directory, coverPhoto, parentDirectory, await photoService.GetNumberOfPhotos(directory), await photoService.GetNumberOfSubDirectories(directory)));
        }

        // GET: api/values
        [HttpGet("{id}/directories")]
        public async Task<ActionResult<IEnumerable<DirectoryViewModel>>> GetSubdirectories(int id)
        {
            var directory = await photoService.GetPhotoDirectoryAsync(id);
            if (directory == null) return NotFound();

            if (!photoService.IsDirectoryVisible(User, directory))
            {
                return Forbid();
            }

            var subDirectories = await photoService.GetSubDirectories(directory);
            if (subDirectories == null) return NotFound();
       
            var visible = subDirectories.Where(x => photoService.IsDirectoryVisible(User, x));
            var coverPhoto = directory.CoverPhotoId != null ? await photoService.GetPhoto(directory.CoverPhotoId.Value) : null;
            var tasks = visible.Select(async x => new DirectoryViewModel(x, coverPhoto, await photoService.GetNumberOfPhotos(x), await photoService.GetNumberOfSubDirectories(x)));
            var results = await Task.WhenAll(tasks);
            return Ok(results);
        }

        [HttpGet("{id}/photos")]
        public async Task<ActionResult<IEnumerable<PhotoViewModel>>> GetPhotos(int id)
        {
            var directory = await photoService.GetPhotoDirectoryAsync(id);
            if (directory == null) return NotFound();

            // Use new gallery-aware visibility check, fallback to claims-based for administrators
            if (!photoService.IsDirectoryVisible(User, directory))
            {
                return Forbid();
            }

            var photos = await photoService.GetDirectoryImages(directory);
            if (photos == null) return NotFound();
            return Ok(photos.Select(x => new PhotoViewModel(x)));
        }

        [Authorize(Policy = Policies.Administrator)]
        [HttpPatch("{id}")]
        public async Task<ActionResult> Patch(int id, [FromBody] DirectoryPatchViewModel viewModel)
        {
            var directory = await photoService.GetPhotoDirectoryAsync(id);
            if (directory == null) return NotFound();
            if (viewModel.Visibility.IsSet)
            {
                directory.Visibility = viewModel.Visibility.Value;
            }

            if (viewModel.CoverPhotoId.IsSet)
            {
                directory.CoverPhotoId = viewModel.CoverPhotoId.Value;
            }

            await applicationDbContext.SaveChangesAsync();
            return Ok();
        }

        [HttpPost("{id}/set-parent-cover")]
        public async Task<ActionResult> SetParentCover(int id)
        {
            var directory = await photoService.GetPhotoDirectoryAsync(id);
            if (directory == null) return NotFound();
            if (!User.IsGalleryAdministrator(directory.Gallery))
            {
                return Forbid();
            }
            
            var parentDirectory = await photoService.GetParentDirectory(directory);
            if (parentDirectory == null) return BadRequest("No parent directory found");

            if (directory.CoverPhotoId == null)
                return BadRequest("Directory has no cover photo");

            parentDirectory.CoverPhotoId = directory.CoverPhotoId;
            await applicationDbContext.SaveChangesAsync();
            return Ok();
        }
    }
}
