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
        private readonly DirectoryService directoryService;

        public DirectoryController(PhotoService photoService, ApplicationDbContext applicationDbContext, DirectoryService directoryService)
        {
            this.photoService = photoService;
            this.applicationDbContext = applicationDbContext;
            this.directoryService = directoryService;
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<DirectoryFullViewModel>> Get(int id)
        {
            var directory = await photoService.GetPhotoDirectoryAsync(id);
            if (directory == null) return NotFound();

            if (!photoService.IsDirectoryVisible(User, directory))
            {
                return Forbid();
            }

            var parentDirectory = directory.ParentDirectoryId != null ?
                    await applicationDbContext.PhotoDirectories.Include(x => x.Gallery).Include(x => x.CoverPhoto).FirstOrDefaultAsync(x => x.Id == directory.ParentDirectoryId) : null;
            await photoService.ScanDirectory(directory);
            var numberOfPhotos = await photoService.GetNumberOfPhotos(directory);
            var numberOfSubDirectories = await photoService.GetNumberOfSubDirectories(directory);
            var (min, max) = await directoryService.GetPhotoDateRangeAsync(directory);
            var dirVm = new DirectoryFullViewModel(directory, parentDirectory,
                numberOfPhotos,
                numberOfSubDirectories)
            {
                MinDate = min,
                MaxDate = max
            };
            return Ok(dirVm);
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
            var tasks = visible.Select(async x => new DirectoryViewModel(x, await photoService.GetNumberOfPhotos(x), await photoService.GetNumberOfSubDirectories(x)));
            var results = await Task.WhenAll(tasks);
            return Ok(results);
        }

        [HttpGet("{id}/photos")]
        public async Task<ActionResult<IEnumerable<PhotoViewModel>>> GetPhotos(int id, string sortOrder = "desc", int offset = 0, int count = 25)
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

            // Apply sorting
            var orderedPhotos = sortOrder == "asc" 
                ? photos.OrderBy(p => p.DateTime) 
                : photos.OrderByDescending(p => p.DateTime);

            // Apply pagination
            var paginatedPhotos = orderedPhotos
                .Skip(offset)
                .Take(count)
                .ToArray();

            return Ok(paginatedPhotos.Select(x => new PhotoViewModel(x)));
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
