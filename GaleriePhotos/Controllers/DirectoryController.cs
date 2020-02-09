using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Galerie.Server.ViewModels;
using GaleriePhotos;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Galerie.Server.Controllers
{
    [Route("api/[controller]")]
    public class DirectoryController : Controller
    {
        private readonly string? rootPath;
        private readonly IOptions<GalerieOptions> options;

        public DirectoryController(IOptions<GalerieOptions> options)
        {
            this.options = options;
            rootPath = options.Value.Root;
        }

        // GET: api/values
        [HttpGet("")]
        public ActionResult<IEnumerable<DirectoryViewModel>> Get([FromQuery] string? baseDirectory = null)
        {
            if (baseDirectory != null && (baseDirectory.Contains("..") || baseDirectory.StartsWith("/"))) return BadRequest("No");
            if (rootPath == null) return BadRequest("The root path has not been defined");
            var path = baseDirectory!=null ? Path.Combine(rootPath,baseDirectory): rootPath;
            if (!Directory.Exists(path)) return NotFound();
            return Ok(Directory.EnumerateDirectories(path).Select(x => Path.GetFileName(x)).Where(x => !x.StartsWith(".")).Select(x => new DirectoryViewModel(
                    
                        path: baseDirectory != null ? Path.Combine(baseDirectory, x) : x,
                        name: x
                    
                )));
        }

        [HttpGet("file-names")]
        public ActionResult<IEnumerable<PhotoViewModel>> GetContent([FromQuery] string? baseDirectory = null)
        {
            if (baseDirectory != null && (baseDirectory.Contains("..") || baseDirectory.StartsWith("/"))) return BadRequest("No");
            if (rootPath == null) return BadRequest();
            var path = baseDirectory != null ? Path.Combine(rootPath, baseDirectory) : rootPath;
            if (!Directory.Exists(path)) return NotFound();
            return Ok(Directory.EnumerateFiles(path).Select(x => Path.GetFileName(x)).Where(x => new[] { ".jpg", ".jpeg", ".png" }.Contains(Path.GetExtension(x))).Select(x => new PhotoViewModel
            (
                path: baseDirectory != null ? Path.Combine(baseDirectory, x) : x,
                name: x,
                url: "/api/photo/image?path=" + Uri.EscapeUriString(baseDirectory != null ? Path.Combine(baseDirectory, x) : x)
            )
            ));
        }

        // GET api/values/5
        [HttpGet("{id}")]
        public string GetById(int id)
        {
            return "value";
        }

        // POST api/values
        [HttpPost]
        public void Post([FromBody]string value)
        {
        }

        // PUT api/values/5
        [HttpPut("{id}")]
        public void Put(int id, [FromBody]string value)
        {
        }

        // DELETE api/values/5
        [HttpDelete("{id}")]
        public void Delete(int id)
        {
        }
    }
}
