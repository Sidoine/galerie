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

        public DirectoryController(PhotoService photoService, ApplicationDbContext applicationDbContext)
        {
            this.photoService = photoService;
            this.applicationDbContext = applicationDbContext;
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

            if (gallery == null) return NotFound();

            var galleryRootDirectory = await photoService.GetRootDirectory(gallery);
            return Ok(new DirectoryViewModel(galleryRootDirectory, await photoService.GetNumberOfPhotos(galleryRootDirectory), await photoService.GetNumberOfSubDirectories(galleryRootDirectory)));
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
            return Ok(new DirectoryFullViewModel(directory, parentDirectory, await photoService.GetNumberOfPhotos(directory), await photoService.GetNumberOfSubDirectories(directory)));
        }

        // GET: api/values
        [HttpGet("{id}/directories")]
        public async Task<ActionResult<IEnumerable<DirectoryViewModel>>> GetSubdirectories(int id)
        {
            var directory = await photoService.GetPhotoDirectoryAsync(id);
            if (directory == null) return NotFound();
            var subDirectories = await photoService.GetSubDirectories(directory);
            if (subDirectories == null) return NotFound();
            var isAdministrator = User.IsAdministrator();

            // For administrators, use the old visibility approach; for regular users, use gallery membership
            if (isAdministrator)
            {
                return Ok(subDirectories.Select(async x => new DirectoryViewModel(x, await photoService.GetNumberOfPhotos(x), await photoService.GetNumberOfSubDirectories(x))).Select(t => t.Result));
            }
            else
            {
                var visible = subDirectories.Where(x => photoService.IsDirectoryVisible(User, x));
                var tasks = visible.Select(async x => new DirectoryViewModel(x, await photoService.GetNumberOfPhotos(x), await photoService.GetNumberOfSubDirectories(x)));
                var results = await Task.WhenAll(tasks);
                return Ok(results);
            }
        }

        [HttpGet("{id}/photos")]
        public async Task<ActionResult<IEnumerable<PhotoViewModel>>> GetPhotos(int id)
        {
            var directory = await photoService.GetPhotoDirectoryAsync(id);
            if (directory == null) return NotFound();

            // Use new gallery-aware visibility check, fallback to claims-based for administrators
            if (!User.IsAdministrator() && !photoService.IsDirectoryVisible(User, directory))
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
    }
}
