using GaleriePhotos.Models;
using GaleriePhotos.Services;
using GaleriePhotos.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Galerie.Server.Controllers
{
    [Route("api/places")]
    [Authorize]
    public class PlaceController : Controller
    {
        private readonly PlaceService placeService;
        private readonly ILogger<PlaceController> logger;

        public PlaceController(PlaceService placeService, ILogger<PlaceController> logger)
        {
            this.placeService = placeService;
            this.logger = logger;
        }

        [HttpGet("gallery/{galleryId}")]
        public async Task<ActionResult<List<PlaceViewModel>>> GetPlacesByGallery(int galleryId)
        {
            try
            {
                var places = await placeService.GetPlacesByGalleryAsync(galleryId);
                return Ok(places);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting places for gallery {GalleryId}", galleryId);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("{id}/photos")]
        public async Task<ActionResult<PlacePhotosViewModel>> GetPlacePhotos(int id)
        {
            try
            {
                var placePhotos = await placeService.GetPlacePhotosAsync(id);
                if (placePhotos == null)
                {
                    return NotFound();
                }
                return Ok(placePhotos);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting photos for place {PlaceId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost("{placeId}/photos/{photoId}")]
        [Authorize(Policy = Policies.Administrator)]
        public async Task<ActionResult> AssignPhotoToPlace(int placeId, int photoId)
        {
            try
            {
                var success = await placeService.AssignPhotoToPlaceAsync(photoId, placeId);
                if (!success)
                {
                    return BadRequest("Could not assign photo to place");
                }
                return Ok();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error assigning photo {PhotoId} to place {PlaceId}", photoId, placeId);
                return StatusCode(500, "Internal server error");
            }
        }
    }
}