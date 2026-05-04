using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using GaleriePhotos.Data;
using GaleriePhotos.Models;
using GaleriePhotos.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GaleriePhotos.Controllers
{
    [Route("api/background-services")]
    [Authorize(Policy = Policies.Administrator)]
    public class BackgroundServiceController : Controller
    {
        private const string GalleryScanServiceId = "gallery-scan";

        private readonly ApplicationDbContext applicationDbContext;
        private static readonly JsonSerializerOptions JsonSerializerOptions = new()
        {
            PropertyNameCaseInsensitive = true,
        };

        public BackgroundServiceController(ApplicationDbContext applicationDbContext)
        {
            this.applicationDbContext = applicationDbContext;
        }

        [HttpGet("states")]
        public async Task<ActionResult<BackgroundServicesStateViewModel>> GetStates()
        {
            var states = await applicationDbContext.BackgroundServiceStates
                .AsNoTracking()
                .ToArrayAsync();

            var stateById = states.ToDictionary(s => s.Id, s => s.State);

            var response = new BackgroundServicesStateViewModel
            {
                FaceAutoNaming = Deserialize<FaceAutoNamingStateViewModel>(stateById, "face-auto-naming"),
                PhotoCaptureDateBackfill = Deserialize<PhotoCaptureDateBackfillStateViewModel>(stateById, "photo-capture-date-backfill"),
                GalleryScanByGallery = await DeserializeGalleryScanAsync(stateById),
                PlaceLocation = Deserialize<PlaceLocationStateViewModel>(stateById, "place-location-background"),
                PhotoGpsBackfill = Deserialize<PhotoGpsBackfillStateViewModel>(stateById, "photo-gps-backfill"),
            };

            return Ok(response);
        }

        [HttpPost("gallery-scan/{galleryId}/reset")]
        public async Task<ActionResult> ResetGalleryScan(int galleryId)
        {
            var galleryExists = await applicationDbContext.Galleries
                .AsNoTracking()
                .AnyAsync(x => x.Id == galleryId);
            if (!galleryExists)
            {
                return NotFound();
            }

            var stateEntity = await applicationDbContext.BackgroundServiceStates
                .SingleOrDefaultAsync(x => x.Id == GalleryScanServiceId);
            if (stateEntity == null || string.IsNullOrWhiteSpace(stateEntity.State))
            {
                return NotFound();
            }

            Dictionary<int, GalleryScanStateStorage>? stateMap;
            try
            {
                stateMap = JsonSerializer.Deserialize<Dictionary<int, GalleryScanStateStorage>>(stateEntity.State, JsonSerializerOptions);
            }
            catch (JsonException)
            {
                return BadRequest("Invalid gallery scan state.");
            }

            if (stateMap == null)
            {
                stateMap = new Dictionary<int, GalleryScanStateStorage>();
            }

            if (!stateMap.TryGetValue(galleryId, out var galleryState) || galleryState == null)
            {
                galleryState = new GalleryScanStateStorage();
                stateMap[galleryId] = galleryState;
            }

            // Force a full rescan on next cycle.
            galleryState.LastCompletedScanDate = null;
            galleryState.LastScannedDirectoryId = null;

            stateEntity.State = JsonSerializer.Serialize(stateMap, JsonSerializerOptions);
            await applicationDbContext.SaveChangesAsync();

            return NoContent();
        }

        private static T? Deserialize<T>(System.Collections.Generic.Dictionary<string, string> stateById, string serviceId)
        {
            if (!stateById.TryGetValue(serviceId, out var rawState) || string.IsNullOrWhiteSpace(rawState))
            {
                return default;
            }

            try
            {
                return JsonSerializer.Deserialize<T>(rawState, JsonSerializerOptions);
            }
            catch (JsonException)
            {
                return default;
            }
        }

        private async Task<GalleryScanStateByGalleryViewModel[]> DeserializeGalleryScanAsync(Dictionary<string, string> stateById)
        {
            var stateMap = Deserialize<Dictionary<int, GalleryScanStateByGalleryViewModel>>(stateById, GalleryScanServiceId);
            if (stateMap == null || stateMap.Count == 0)
            {
                return [];
            }

            var galleryIds = stateMap.Keys.ToArray();
            var galleryNames = await applicationDbContext.Galleries
                .AsNoTracking()
                .Where(x => galleryIds.Contains(x.Id))
                .ToDictionaryAsync(x => x.Id, x => x.Name);

            return stateMap
                .Select(kvp =>
                {
                    var value = kvp.Value ?? new GalleryScanStateByGalleryViewModel();
                    value.GalleryId = kvp.Key;
                    if (galleryNames.TryGetValue(kvp.Key, out var galleryName))
                    {
                        value.GalleryName = galleryName;
                    }
                    return value;
                })
                .OrderBy(x => x.GalleryId)
                .ToArray();
        }

        private sealed class GalleryScanStateStorage
        {
            public int? LastScannedDirectoryId { get; set; }

            public System.DateTime? LastCompletedScanDate { get; set; }
        }
    }
}