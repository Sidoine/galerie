using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using GaleriePhotos.Data;
using GaleriePhotos.Models;
using GaleriePhotos.ViewModels;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace GaleriePhotos.Controllers
{
    [Route("api/galleries/{galleryId}/directory-visibilities")]
    [ApiController]
    [Authorize]
    public class DirectoryVisibilityController : Controller
    {
        private readonly ApplicationDbContext _context;

        public DirectoryVisibilityController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("")]
        public async Task<ActionResult<IEnumerable<GalleryDirectoryVisibilityViewModel>>> GetAll(int galleryId)
        {
            var visibilities = await _context.GalleryDirectoryVisibilities
                .Where(v => v.GalleryId == galleryId)
                .OrderBy(v => v.Value)
                .ToListAsync();

            return Ok(visibilities.Select(v => new GalleryDirectoryVisibilityViewModel(v)));
        }

        [HttpPost("")]
        [Authorize(Policy = Policies.Administrator)]
        public async Task<ActionResult<GalleryDirectoryVisibilityViewModel>> Post(int galleryId, [FromBody] GalleryDirectoryVisibilityCreateViewModel model)
        {
            // Check if gallery exists
            var gallery = await _context.Galleries.FindAsync(galleryId);
            if (gallery == null)
            {
                return NotFound();
            }

            // Check if value already exists for this gallery
            var existingVisibility = await _context.GalleryDirectoryVisibilities
                .FirstOrDefaultAsync(v => v.GalleryId == galleryId && v.Value == model.Value);
            if (existingVisibility != null)
            {
                return BadRequest("A visibility with this value already exists for this gallery.");
            }

            var visibility = new GalleryDirectoryVisibility
            {
                Name = model.Name,
                Icon = model.Icon,
                Value = model.Value,
                GalleryId = galleryId,
                Gallery = gallery
            };

            _context.GalleryDirectoryVisibilities.Add(visibility);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { galleryId, id = visibility.Id }, new GalleryDirectoryVisibilityViewModel(visibility));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<GalleryDirectoryVisibilityViewModel>> GetById(int galleryId, int id)
        {
            var visibility = await _context.GalleryDirectoryVisibilities
                .FirstOrDefaultAsync(v => v.Id == id && v.GalleryId == galleryId);

            if (visibility == null)
            {
                return NotFound();
            }

            return Ok(new GalleryDirectoryVisibilityViewModel(visibility));
        }

        [HttpPatch("{id}")]
        [Authorize(Policy = Policies.Administrator)]
        public async Task<ActionResult<GalleryDirectoryVisibilityViewModel>> Update(int galleryId, int id, [FromBody] GalleryDirectoryVisibilityPatchViewModel model)
        {
            var visibility = await _context.GalleryDirectoryVisibilities
                .FirstOrDefaultAsync(v => v.Id == id && v.GalleryId == galleryId);

            if (visibility == null)
            {
                return NotFound();
            }

            if (model.Name != null)
                visibility.Name = model.Name;
            if (model.Icon != null)
                visibility.Icon = model.Icon;
            if (model.Value.HasValue)
            {
                // Check if new value already exists for this gallery
                var existingVisibility = await _context.GalleryDirectoryVisibilities
                    .FirstOrDefaultAsync(v => v.GalleryId == galleryId && v.Value == model.Value.Value && v.Id != id);
                if (existingVisibility != null)
                {
                    return BadRequest("A visibility with this value already exists for this gallery.");
                }
                visibility.Value = model.Value.Value;
            }

            await _context.SaveChangesAsync();

            return Ok(new GalleryDirectoryVisibilityViewModel(visibility));
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = Policies.Administrator)]
        public async Task<ActionResult> Delete(int galleryId, int id)
        {
            var visibility = await _context.GalleryDirectoryVisibilities
                .FirstOrDefaultAsync(v => v.Id == id && v.GalleryId == galleryId);

            if (visibility == null)
            {
                return NotFound();
            }

            _context.GalleryDirectoryVisibilities.Remove(visibility);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}