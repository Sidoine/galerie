using System.Linq;
using System.Threading.Tasks;
using GaleriePhotos.Data;
using GaleriePhotos.ViewModels;
using GaleriePhotos.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Net;

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
            var gallery = new Gallery(
                model.Name, 
                model.RootDirectory, 
                model.ThumbnailsDirectory,
                model.DataProvider,
                model.SeafileServerUrl,
                model.SeafileApiKey);
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

            if (model.DataProvider.HasValue)
            {
                gallery.DataProvider = model.DataProvider.Value;
            }

            if (model.SeafileServerUrl != null)
            {
                gallery.SeafileServerUrl = model.SeafileServerUrl;
            }

            if (model.SeafileApiKey != null)
            {
                gallery.SeafileApiKey = model.SeafileApiKey;
            }

            await applicationDbContext.SaveChangesAsync();

            // Return updated gallery
            var administratorNames = gallery.Members
                .Where(gm => gm.IsAdministrator)
                .Select(gm => gm.User?.UserName ?? "Unknown")
                .ToArray();

            return Ok(new GalleryViewModel(gallery, administratorNames));
        }

        [HttpPost("{id}/seafile/apikey")]
        public async Task<ActionResult<SeafileApiKeyResponse>> GetSeafileApiKey(int id, [FromBody] SeafileApiKeyRequest request)
        {
            var gallery = await applicationDbContext.Galleries.FirstOrDefaultAsync(g => g.Id == id);
            if (gallery == null) return NotFound();
            if (gallery.DataProvider != DataProviderType.Seafile) return BadRequest("Gallery is not configured for Seafile");
            if (string.IsNullOrEmpty(gallery.SeafileServerUrl)) return BadRequest("Seafile server URL is not set on gallery");

            // Seafile auth endpoint: POST /api2/auth-token/ with username & password form-urlencoded returns {"token":"API_KEY"}
            var authUrl = gallery.SeafileServerUrl.TrimEnd('/') + "/api2/auth-token/";
            using var client = new HttpClient();
            var content = new StringContent($"username={WebUtility.UrlEncode(request.Username)}&password={WebUtility.UrlEncode(request.Password)}", Encoding.UTF8, "application/x-www-form-urlencoded");
            try
            {
                var response = await client.PostAsync(authUrl, content);
                if (!response.IsSuccessStatusCode)
                {
                    return StatusCode((int)response.StatusCode, await response.Content.ReadAsStringAsync());
                }
                var stream = await response.Content.ReadAsStreamAsync();
                var json = await JsonDocument.ParseAsync(stream);
                if (!json.RootElement.TryGetProperty("token", out var tokenElement))
                {
                    return BadRequest("Token not found in response");
                }
                var token = tokenElement.GetString() ?? string.Empty;
                return Ok(new SeafileApiKeyResponse { ApiKey = token });
            }
            catch (HttpRequestException ex)
            {
                return BadRequest($"HTTP error while contacting Seafile server: {ex.Message}");
            }
        }
    }
}