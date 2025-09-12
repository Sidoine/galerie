using System.Linq;
using System.Threading.Tasks;
using GaleriePhotos.Data;
using GaleriePhotos.ViewModels;
using GaleriePhotos.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GaleriePhotos.Controllers
{
    [Authorize(Policy = Policies.Administrator)]
    [Route("api/galleries")]
    public class GalleryController : Controller
    {
        private readonly ApplicationDbContext applicationDbContext;

        public GalleryController(ApplicationDbContext applicationDbContext)
        {
            this.applicationDbContext = applicationDbContext;
        }

        [HttpGet("")]
        public async Task<ActionResult<GalleryViewModel[]>> GetAll()
        {
            var galleries = await applicationDbContext.Galleries
                .Include(g => g.Members)
                .ThenInclude(gm => gm.User)
                .ToArrayAsync();

            var galleryViewModels = galleries.Select(gallery =>
            {
                var administratorNames = gallery.Members
                    .Where(gm => gm.IsAdministrator)
                    .Select(gm => gm.User?.UserName ?? "Unknown")
                    .ToArray();
                
                return new GalleryViewModel(gallery, administratorNames);
            }).ToArray();

            return Ok(galleryViewModels);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<GalleryViewModel>> GetById(int id)
        {
            var gallery = await applicationDbContext.Galleries
                .Include(g => g.Members)
                .ThenInclude(gm => gm.User)
                .FirstOrDefaultAsync(g => g.Id == id);

            if (gallery == null)
            {
                return NotFound();
            }

            var administratorNames = gallery.Members
                .Where(gm => gm.IsAdministrator)
                .Select(gm => gm.User?.UserName ?? "Unknown")
                .ToArray();

            return Ok(new GalleryViewModel(gallery, administratorNames));
        }

        [HttpPost("")]
        public async Task<ActionResult<GalleryViewModel>> Create([FromBody] GalleryCreateViewModel model)
        {
            // Check if user exists
            var user = await applicationDbContext.Users.FindAsync(model.UserId);
            if (user == null)
            {
                return BadRequest("User not found");
            }

            // Create the gallery
            var gallery = new Gallery(model.Name, model.RootDirectory, model.ThumbnailsDirectory);
            applicationDbContext.Galleries.Add(gallery);
            await applicationDbContext.SaveChangesAsync();

            // Create the gallery member with administrator privileges
            var galleryMember = new GalleryMember(gallery.Id, model.UserId, 0, true)
            {
                Gallery = gallery,
                User = user
            };
            applicationDbContext.GalleryMembers.Add(galleryMember);
            await applicationDbContext.SaveChangesAsync();

            // Return the created gallery
            var administratorNames = new[] { user.UserName ?? "Unknown" };
            var galleryViewModel = new GalleryViewModel(gallery, administratorNames);

            return CreatedAtAction(nameof(GetAll), galleryViewModel);
        }

        [HttpPatch("{id}")]
        public async Task<ActionResult<GalleryViewModel>> Update(int id, [FromBody] GalleryPatchViewModel model)
        {
            var gallery = await applicationDbContext.Galleries
                .Include(g => g.Members)
                .ThenInclude(gm => gm.User)
                .FirstOrDefaultAsync(g => g.Id == id);

            if (gallery == null)
            {
                return NotFound();
            }

            // Update gallery properties if provided
            if (!string.IsNullOrEmpty(model.Name))
            {
                gallery.Name = model.Name;
            }

            if (!string.IsNullOrEmpty(model.RootDirectory))
            {
                gallery.RootDirectory = model.RootDirectory;
            }

            if (model.ThumbnailsDirectory != null)
            {
                gallery.ThumbnailsDirectory = model.ThumbnailsDirectory;
            }

            await applicationDbContext.SaveChangesAsync();

            // Return updated gallery
            var administratorNames = gallery.Members
                .Where(gm => gm.IsAdministrator)
                .Select(gm => gm.User?.UserName ?? "Unknown")
                .ToArray();

            return Ok(new GalleryViewModel(gallery, administratorNames));
        }
    }
}