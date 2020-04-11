using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Galerie.Server.ViewModels;
using GaleriePhotos;
using GaleriePhotos.Data;
using GaleriePhotos.Services;
using GaleriePhotos.ViewModels;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Galerie.Server.Controllers
{
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

        // GET: api/values
        [HttpGet("{id}/directories")]
        public async Task<ActionResult<IEnumerable<DirectoryViewModel>>> Get(int id)
        {
            var directory = await applicationDbContext.PhotoDirectories.FindAsync(id);
            if (directory == null) return NotFound();
            var subDirectories = await photoService.GetSubDirectories(directory);
            if (subDirectories == null) return NotFound();
            return Ok(subDirectories.Select(x => new DirectoryViewModel(x)));
        }

        [HttpGet("{id}/photos")]
        public async Task<ActionResult<IEnumerable<PhotoViewModel>>> GetContent(int id)
        {
            var directory = await applicationDbContext.PhotoDirectories.FindAsync(id);
            if (directory == null) return NotFound();
            var photos = await photoService.GetDirectoryImages(directory);
            return Ok(photos.Select(x => new PhotoViewModel(x)));
        }

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
