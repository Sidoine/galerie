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
    [Route("api")]
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

        [HttpGet("directories/{id}")]
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
            
            // Get photo query for date jumps - do the calculation in SQL
            var photoQuery = applicationDbContext.Photos.Where(p => p.DirectoryId == directory.Id);
            
            var dirVm = new DirectoryFullViewModel(directory, parentDirectory,
                numberOfPhotos,
                numberOfSubDirectories)
            {
                MinDate = min,
                MaxDate = max,
                DateJumps = await DateJumpHelper.CalculateDateJumpsAsync(min, max, photoQuery)
            };
            return Ok(dirVm);
        }

        // GET: api/values
        [HttpGet("directories/{id}/subdirectories")]
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

        [HttpGet("directories/{id}/photos")]
        public async Task<ActionResult<IEnumerable<PhotoViewModel>>> GetPhotos(int id, string sortOrder = "desc", int offset = 0, int count = 25, DateTime? startDate = null)
        {
            var directory = await photoService.GetPhotoDirectoryAsync(id);
            if (directory == null) return NotFound();

            // Use new gallery-aware visibility check, fallback to claims-based for administrators
            if (!photoService.IsDirectoryVisible(User, directory))
            {
                return Forbid();
            }

            var userId = User.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var galleryMember = await photoService.GetGalleryMemberAsync(userId, directory.GalleryId);
            if (galleryMember == null) return Forbid();

            // Use query instead of loading all photos into memory
            var query = applicationDbContext.Photos
                .Include(p => p.Place)
                .Where(p => p.DirectoryId == directory.Id)
                .ApplyRights(galleryMember);

            var orderedQuery = query.ApplySortingAndOffset(sortOrder, offset, count, startDate);
            var photos = await orderedQuery.ToArrayAsync();

            return Ok(photos.Select(x => new PhotoViewModel(x)));
        }

        [HttpPatch("directories/{id}")]
        public async Task<ActionResult> Patch(int id, [FromBody] DirectoryPatchViewModel viewModel)
        {
            var directory = await photoService.GetPhotoDirectoryAsync(id);
            if (directory == null) return NotFound();

            if (!User.IsGalleryAdministrator(directory.Gallery))
            {
                return Forbid();
            }

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

        [HttpPost("directories/{id}/set-parent-cover")]
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

        /// <summary>
        /// Creates a new directory (album) at the root of a gallery and optionally moves photos into it.
        /// </summary>
        /// <param name="galleryId">Gallery ID where the album will be created</param>
        /// <param name="model">Album name and optional photo IDs to move</param>
        /// <returns>Created album or error</returns>
        [HttpPost("galleries/{galleryId}/directories")]
        public async Task<ActionResult<DirectoryViewModel>> CreateDirectory(int galleryId, [FromBody] DirectoryCreateViewModel model)
        {
            if (string.IsNullOrWhiteSpace(model.Name))
            {
                return BadRequest("Le nom ne peut pas être vide");
            }

            // Validate that the name doesn't contain path separators or other invalid characters
            var invalidChars = Path.GetInvalidFileNameChars();
            if (model.Name.Contains('/') || model.Name.Contains('\\') ||
                model.Name.Contains('*') || model.Name.Contains('.') ||
                model.Name.IndexOfAny(invalidChars) >= 0)
            {
                return BadRequest("Le nom ne peut pas contenir de caractères invalides");
            }

            // Get the gallery and check permissions
            var gallery = await applicationDbContext.Galleries
                .Include(g => g.Members)
                .FirstOrDefaultAsync(g => g.Id == galleryId);

            if (gallery == null) return NotFound("Galerie introuvable");

            if (!User.IsGalleryAdministrator(gallery))
            {
                return Forbid();
            }

            // Get the root directory
            var rootDirectory = await applicationDbContext.PhotoDirectories
                .FirstOrDefaultAsync(d => d.GalleryId == galleryId && d.ParentDirectoryId == null);

            if (rootDirectory == null) return NotFound("Répertoire racine introuvable");

            // Check if a directory with the same name already exists at root
            var existingDirectory = await applicationDbContext.PhotoDirectories
                .Where(d => d.ParentDirectoryId == rootDirectory.Id)
                .ToListAsync();

            if (existingDirectory.Any(d => Path.GetFileName(d.Path) == model.Name.Trim()))
            {
                return BadRequest("Un album avec ce nom existe déjà");
            }

            // Create the new directory
            var newPath = string.IsNullOrEmpty(rootDirectory.Path)
                ? model.Name.Trim()
                : Path.Combine(rootDirectory.Path, model.Name.Trim());

            var newDirectory = new PhotoDirectory(newPath, 0, null, rootDirectory.Id)
            {
                Gallery = gallery
            };

            applicationDbContext.PhotoDirectories.Add(newDirectory);
            await applicationDbContext.SaveChangesAsync();

            // Create the physical directory
            await directoryService.CreateDirectoryAsync(newDirectory);

            // Move photos if specified
            if (model.PhotoIds.Length > 0)
            {
                try
                {
                    await photoService.MovePhotosToDirectory(galleryId, model.PhotoIds, newDirectory.Id);
                }
                catch (InvalidOperationException ex)
                {
                    // Rollback directory creation if photo move fails
                    applicationDbContext.PhotoDirectories.Remove(newDirectory);
                    await applicationDbContext.SaveChangesAsync();
                    return BadRequest(ex.Message);
                }
            }

            var numberOfPhotos = await photoService.GetNumberOfPhotos(newDirectory);
            var numberOfSubDirectories = await photoService.GetNumberOfSubDirectories(newDirectory);

            return Ok(new DirectoryViewModel(newDirectory, numberOfPhotos, numberOfSubDirectories));
        }

        /// <summary>
        /// Renames a directory (album).
        /// </summary>
        /// <param name="id">Directory ID</param>
        /// <param name="model">New name</param>
        /// <returns>Success or error</returns>
        [HttpPatch("directories/{id}/rename")]
        public async Task<ActionResult> RenameDirectory(int id, [FromBody] DirectoryRenameViewModel model)
        {
            if (string.IsNullOrWhiteSpace(model.Name))
            {
                return BadRequest("Le nom ne peut pas être vide");
            }

            // Validate that the name doesn't contain path separators or other invalid characters
            var invalidChars = Path.GetInvalidFileNameChars();
            if (model.Name.Contains('/') || model.Name.Contains('\\') ||
                model.Name.Contains('*') || model.Name.Contains('.') ||
                model.Name.IndexOfAny(invalidChars) >= 0)
            {
                return BadRequest("Le nom ne peut pas contenir de caractères invalides");
            }

            var directory = await photoService.GetPhotoDirectoryAsync(id);
            if (directory == null) return NotFound();

            if (!User.IsGalleryAdministrator(directory.Gallery))
            {
                return Forbid();
            }

            // Do not allow renaming the root directory
            if (directory.ParentDirectoryId == null)
            {
                return BadRequest("Impossible de renommer le répertoire racine");
            }

            // Check if a sibling directory with the same name already exists
            if (directory.ParentDirectoryId != null)
            {
                var siblings = await applicationDbContext.PhotoDirectories
                    .Where(d => d.ParentDirectoryId == directory.ParentDirectoryId && d.Id != directory.Id)
                    .ToListAsync();

                if (siblings.Any(s => Path.GetFileName(s.Path) == model.Name.Trim()))
                {
                    return BadRequest("Un répertoire avec ce nom existe déjà au même emplacement");
                }
            }

            await directoryService.RenameDirectoryAsync(directory, model.Name.Trim());

            return Ok();
        }

    }
}
