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
using System.Security.Claims;
using System;
using Galerie.Server.ViewModels;
using GaleriePhotos.Services;

namespace GaleriePhotos.Controllers
{
    [Route("api/galleries")]
    public class GalleryController : Controller
    {
        private readonly ApplicationDbContext applicationDbContext;
        private readonly GalleryService galleryService;

        public GalleryController(ApplicationDbContext applicationDbContext, GalleryService galleryService)
        {
            this.applicationDbContext = applicationDbContext;
            this.galleryService = galleryService;
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<GalleryFullViewModel>> GetById(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var gallery = await applicationDbContext.Galleries
                .Include(g => g.Members)
                .Where(g => g.Id == id && g.Members.Any(m => m.UserId == userId))
                .FirstOrDefaultAsync();

            if (gallery == null)
            {
                return NotFound();
            }

            var isAdministrator = User.IsGalleryAdministrator(gallery);

            var result = new GalleryFullViewModel
            {
                Id = gallery.Id,
                Name = gallery.Name,
                NumberOfPhotos = await applicationDbContext.Photos
                    .Where(d => d.Directory.GalleryId == gallery.Id)
                    .CountAsync(),
                MinDate = await applicationDbContext.Photos
                    .Where(d => d.Directory.GalleryId == gallery.Id)
                    .Select(p => p.DateTime)
                    .DefaultIfEmpty()
                    .MinAsync(),
                MaxDate = await applicationDbContext.Photos
                    .Where(d => d.Directory.GalleryId == gallery.Id)
                    .Select(p => p.DateTime)
                    .DefaultIfEmpty()
                    .MaxAsync(),
                RootDirectoryId = await applicationDbContext.PhotoDirectories
                    .Where(d => d.GalleryId == gallery.Id && (d.PhotoDirectoryType == PhotoDirectoryType.Root || d.Path == ""))
                    .Select(d => d.Id)
                    .FirstAsync(),
                CoverPhotoId = null,
                IsAdministrator = isAdministrator
            };

            return Ok(result);
        }

        [HttpGet("{id}/photos")]
        public async Task<ActionResult<PhotoViewModel[]>> GetPhotos(int id, string sortOrder = "desc", int offset = 0, int count = 25)
        {
            var gallery = await galleryService.Get(id);
            if (gallery == null) return NotFound();
            if (!User.IsGalleryMember(gallery)) return Forbid();

            var query = applicationDbContext.Photos
                .Include(p => p.Place)
                .Where(d => d.Directory.GalleryId == id);

            // Apply sorting
            var orderedQuery = sortOrder == "asc"
                ? query.OrderBy(p => p.DateTime)
                : query.OrderByDescending(p => p.DateTime);

            // Apply pagination
            var photos = await orderedQuery
                .Skip(offset)
                .Take(count)
                .ToArrayAsync();

            return Ok(photos.Select(x => new PhotoViewModel(x)).ToArray());
        }

        [HttpGet("")]
        [Authorize(Policy = Policies.Administrator)]
        public async Task<ActionResult<GallerySettingsViewModel[]>> GetAllSettings()
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
                
                return new GallerySettingsViewModel(gallery, administratorNames);
            }).ToArray();

            return Ok(galleryViewModels);
        }

        [HttpGet("{id}/settings")]
        public async Task<ActionResult<GallerySettingsViewModel>> GetSettingsById(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var gallery = await applicationDbContext.Galleries
                .Include(g => g.Members)
                .ThenInclude(gm => gm.User)
                .FirstOrDefaultAsync(g => g.Id == id);

            if (gallery == null)
            {
                return NotFound();
            }

            if (!User.IsGalleryAdministrator(gallery))
            {
                return Forbid();
            }

            var administratorNames = gallery.Members
                .Where(gm => gm.IsAdministrator)
                .Select(gm => gm.User?.UserName ?? "Unknown")
                .ToArray();

            return Ok(new GallerySettingsViewModel(gallery, administratorNames));
        }

        [HttpPost("")]
        [Authorize(Policy = Policies.Administrator)]
        public async Task<ActionResult<GallerySettingsViewModel>> Create([FromBody] GalleryCreateViewModel model)
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
            var galleryViewModel = new GallerySettingsViewModel(gallery, administratorNames);

            return CreatedAtAction(nameof(GetAllSettings), galleryViewModel);
        }

        [HttpPatch("{id}")]
        public async Task<ActionResult<GallerySettingsViewModel>> Update(int id, [FromBody] GalleryPatchViewModel model)
        {
            var gallery = await applicationDbContext.Galleries
                .Include(g => g.Members)
                .ThenInclude(gm => gm.User)
                .FirstOrDefaultAsync(g => g.Id == id);

            if (gallery == null)
            {
                return NotFound();
            }

            if (!User.IsGalleryAdministrator(gallery))
            {
                return Forbid();
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

            return Ok(new GallerySettingsViewModel(gallery, administratorNames));
        }

        [HttpPost("{id}/seafile/apikey")]
        public async Task<ActionResult<SeafileApiKeyResponse>> GetSeafileApiKey(int id, [FromBody] SeafileApiKeyRequest request)
        {
            var gallery = await applicationDbContext.Galleries
                .Include(g => g.Members)
                .FirstOrDefaultAsync(g => g.Id == id);
            if (gallery == null) return NotFound();
            if (!User.IsGalleryAdministrator(gallery)) return Forbid();
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

        [HttpPost("seafile/repositories")]
        [Authorize]
        public async Task<ActionResult<SeafileRepositoriesResponse>> GetSeafileRepositories([FromBody] SeafileRepositoriesRequest request)
        {
            // This endpoint doesn't access gallery data directly, but requires authentication
            // It's used during gallery configuration to list available repositories
            var serverUrl = request.ServerUrl?.TrimEnd('/');
            if (string.IsNullOrEmpty(serverUrl)) return BadRequest("Seafile server URL is not set");
            if (string.IsNullOrWhiteSpace(request.ApiKey)) return BadRequest("API key is required");

            var apiBase = serverUrl + "/api2";
            try
            {
                using var client = new HttpClient();
                client.DefaultRequestHeaders.Add("Authorization", $"Token {request.ApiKey}");
                // Seafile docs: GET /api2/repos/ returns array of libraries
                var response = await client.GetAsync(apiBase + "/repos/");
                if (!response.IsSuccessStatusCode)
                {
                    return StatusCode((int)response.StatusCode, await response.Content.ReadAsStringAsync());
                }
                var json = await response.Content.ReadAsStringAsync();
                var doc = JsonDocument.Parse(json);
                var result = new SeafileRepositoriesResponse();
                foreach (var element in doc.RootElement.EnumerateArray())
                {
                    // Expect fields: id, name, size, permission, encrypted, owner (owner_name?)
                    var vm = new SeafileRepositoryViewModel
                    {
                        Id = element.GetProperty("id").GetString() ?? string.Empty,
                        Name = element.GetProperty("name").GetString() ?? string.Empty,
                        Size = element.TryGetProperty("size", out var sizeEl) && sizeEl.TryGetInt64(out var sizeVal) ? sizeVal : 0,
                        Permission = element.TryGetProperty("permission", out var permEl) ? permEl.GetString() ?? string.Empty : string.Empty,
                        Encrypted = element.TryGetProperty("encrypted", out var encEl) && encEl.ValueKind == JsonValueKind.True,
                        Owner = element.TryGetProperty("owner", out var ownerEl) ? ownerEl.GetString() ?? string.Empty : string.Empty
                    };
                    result.Repositories.Add(vm);
                }
                return Ok(result);
            }
            catch (HttpRequestException ex)
            {
                return BadRequest($"HTTP error while contacting Seafile server: {ex.Message}");
            }
        }
    }
}