using System;
using System.IO;
using Galerie.Server.ViewModels;
using GaleriePhotos;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Galerie.Server.Controllers
{
    [Route("api/[controller]")]
    public class PhotoController : Controller
    {
        private readonly IOptions<GalerieOptions> options;

        public PhotoController(IOptions<GalerieOptions> options)
        {
            this.options = options;
        }

        [HttpGet("image")]
        public IActionResult GetImage([FromQuery] string path)
        {
            if (options.Value.Root == null) return BadRequest("Le chemin racine n'a pas été configuré");
            return File(System.IO.File.ReadAllBytes(Path.Combine(options.Value.Root, path)), "image/jpeg");
        }

        [HttpGet]
        public ActionResult<PhotoFullViewModel> Get([FromQuery] string path)
        {
            var name = Path.GetFileName(path);
            var directoryPath = Path.GetDirectoryName(path);
            if (directoryPath == null) return NotFound();
            return Ok(new PhotoFullViewModel(
            
                path: path,
                directoryPath: directoryPath,
                name: name,
                url: "/api/photo/image?path=" + Uri.EscapeUriString(path)
            ));;
        }
    }
}
