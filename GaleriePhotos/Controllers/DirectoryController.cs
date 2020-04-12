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

        [HttpGet("root")]
        public async Task<ActionResult<DirectoryViewModel>> GetRoot()
        {
            return Ok(new DirectoryViewModel(await photoService.GetRootDirectory()));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<DirectoryFullViewModel>> Get(int id)
        {
            var isAdministrator = User.IsAdministrator();
            var visibility = User.GetDirectoryVisibility();
            var directory = await applicationDbContext.PhotoDirectories.FindAsync(id);
            if (directory == null) return NotFound();
            if (!isAdministrator && (directory.Visibility & visibility) == 0) return Forbid();
                var parent = directory.Path != "" ? Path.GetDirectoryName(directory.Path) : null;
            var parentDirectory = parent != null ? await applicationDbContext.PhotoDirectories.FirstOrDefaultAsync(x => x.Path == parent) : null;
            return Ok(new DirectoryFullViewModel(directory, parentDirectory));
        }

        // GET: api/values
        [HttpGet("{id}/directories")]
        public async Task<ActionResult<IEnumerable<DirectoryViewModel>>> GetSubdirectories(int id)
        {
            var directory = await applicationDbContext.PhotoDirectories.FindAsync(id);
            if (directory == null) return NotFound();
            var subDirectories = await photoService.GetSubDirectories(directory);
            if (subDirectories == null) return NotFound();
            var isAdministrator = User.IsAdministrator();
            var visibility = User.GetDirectoryVisibility();
            return Ok(subDirectories.Where(x => isAdministrator || (x.Visibility & visibility) > 0).Select(x => new DirectoryViewModel(x)));
        }

        [HttpGet("{id}/photos")]
        public async Task<ActionResult<IEnumerable<PhotoViewModel>>> GetPhotos(int id)
        {
            var directory = await applicationDbContext.PhotoDirectories.FindAsync(id);
            if (directory == null) return NotFound();
            var photos = await photoService.GetDirectoryImages(directory);
            var isAdministrator = User.IsAdministrator();
            return Ok(photos.Where(x => x.Visible || isAdministrator).Select(x => new PhotoViewModel(x)));
        }

        [Authorize(Policy = Policies.Administrator)]
        [HttpPatch("{id}")]
        public async Task<ActionResult> Patch(int id, [FromBody]DirectoryPatchViewModel viewModel)
        {
            var directory = await applicationDbContext.PhotoDirectories.FindAsync(id);
            if (directory == null) return NotFound();
            if (viewModel.Visibility.IsSet)
            {
                directory.Visibility = viewModel.Visibility.Value;
            }
            await applicationDbContext.SaveChangesAsync();
            return Ok();
        }
    }
}
