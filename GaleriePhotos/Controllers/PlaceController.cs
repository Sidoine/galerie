using Galerie.Server.ViewModels;
using GaleriePhotos.Data;
using GaleriePhotos.Models;
using GaleriePhotos.Services;
using GaleriePhotos.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Galerie.Server.Controllers
{
    [Route("api/places")]
    [Authorize]
    public class PlaceController : Controller
    {
        private readonly PlaceService placeService;
        private readonly ILogger<PlaceController> logger;
        private readonly GalleryService galleryService;
        private readonly ApplicationDbContext applicationDbContext;

        public PlaceController(PlaceService placeService, ILogger<PlaceController> logger, GalleryService galleryService, ApplicationDbContext applicationDbContext)
        {
            this.placeService = placeService;
            this.logger = logger;
            this.galleryService = galleryService;
            this.applicationDbContext = applicationDbContext;
        }

        [HttpGet("gallery/{galleryId}/countries")]
        public async Task<ActionResult<List<PlaceViewModel>>> GetCountriesByGallery(int galleryId)
        {
            try
            {
                var gallery = await galleryService.Get(galleryId);
                if (gallery == null) return NotFound();
                if (!User.IsGalleryMember(gallery)) return Forbid();

                var countries = await placeService.GetCountriesByGalleryAsync(galleryId);
                return Ok(countries);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting countries for gallery {GalleryId}", galleryId);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("gallery/{galleryId}/countries/{countryId}/cities")]
        public async Task<ActionResult<List<PlaceViewModel>>> GetCitiesByCountry(int galleryId, int countryId)
        {
            try
            {
                var gallery = await galleryService.Get(galleryId);
                if (gallery == null) return NotFound();
                if (!User.IsGalleryMember(gallery)) return Forbid();

                var cities = await placeService.GetCitiesByCountryAsync(countryId, galleryId);
                return Ok(cities);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting cities for country {CountryId} in gallery {GalleryId}", countryId, galleryId);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("gallery/{galleryId}")]
        public async Task<ActionResult<List<PlaceViewModel>>> GetPlacesByGallery(int galleryId)
        {
            try
            {
                var gallery = await galleryService.Get(galleryId);
                if (gallery == null) return NotFound();
                if (!User.IsGalleryMember(gallery)) return Forbid();

                var places = await placeService.GetPlacesByGalleryAsync(galleryId);
                return Ok(places);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting places for gallery {GalleryId}", galleryId);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<PlaceFullViewModel>> GetPlaceById(int id)
        {
            var place = await placeService.GetPlaceByIdAsync(id);
            if (place == null) return NotFound();
            
            var gallery = await galleryService.Get(place.GalleryId);
            if (gallery == null) return NotFound();
            if (!User.IsGalleryMember(gallery)) return Forbid();

            return Ok(place);
        }

        [HttpGet("{id}/photos")]
        public async Task<ActionResult<PhotoViewModel[]>> GetPlacePhotos(int id, int? year, int? month, string sortOrder = "asc", int offset = 0, int count = 25, DateTime? startDate = null)
        {
            try
            {
                var place = await placeService.GetPlaceByIdAsync(id);
                if (place == null) return NotFound();
                
                var gallery = await galleryService.Get(place.GalleryId);
                if (gallery == null) return NotFound();
                if (!User.IsGalleryMember(gallery)) return Forbid();

                // Build query instead of loading all photos
                var query = applicationDbContext.Photos
                    .Include(p => p.Place)
                    .Where(p => p.PlaceId == id);

                if (year.HasValue)
                {
                    query = query.Where(p => p.DateTime.Year == year.Value);
                }

                if (month.HasValue)
                {
                    query = query.Where(p => p.DateTime.Month == month.Value);
                }

                var orderedQuery = PhotoQueryHelper.ApplySortingAndOffset(query, sortOrder, offset, count, startDate);
                var photos = await orderedQuery.ToArrayAsync();

                // If we used negative offset, reverse the results
                if (PhotoQueryHelper.ShouldReverseResults(offset))
                {
                    photos = photos.Reverse().ToArray();
                }

                return Ok(photos.Select(x => new PhotoViewModel(x)));
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting photos for place {PlaceId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("{id}/photos/count")]
        public async Task<ActionResult<int>> GetPlacePhotoCount(int id, int? year, int? month)
        {
            var place = await placeService.GetPlaceByIdAsync(id);
            if (place == null) return NotFound();
            
            var gallery = await galleryService.Get(place.GalleryId);
            if (gallery == null) return NotFound();
            if (!User.IsGalleryMember(gallery)) return Forbid();

            return Ok(await placeService.GetPlaceNumberOfPhotosAsync(id, year, month));
        }

        [HttpGet("{id}/years")]
        public async Task<ActionResult<YearViewModel[]>> GetPlaceYears(int id)
        {
            var place = await placeService.GetPlaceByIdAsync(id);
            if (place == null) return NotFound();
            
            var gallery = await galleryService.Get(place.GalleryId);
            if (gallery == null) return NotFound();
            if (!User.IsGalleryMember(gallery)) return Forbid();

            return Ok(await placeService.GetPlaceYearsAsync(id));
        }

        [HttpGet("{id}/years/{year}/monthes")]
        public async Task<ActionResult<MonthViewModel[]>> GetPlaceMonths(int id, int year)
        {
            var place = await placeService.GetPlaceByIdAsync(id);
            if (place == null) return NotFound();
            
            var gallery = await galleryService.Get(place.GalleryId);
            if (gallery == null) return NotFound();
            if (!User.IsGalleryMember(gallery)) return Forbid();

            return Ok(await placeService.GetPlaceMonthsAsync(id, year));
        }

        [HttpGet("{id}/years/{year}")]
        public async Task<ActionResult<YearFullViewModel>> GetPlaceYear(int id, int year)
        {
            var place = await placeService.GetPlaceByIdAsync(id);
            if (place == null) return NotFound();
            
            var gallery = await galleryService.Get(place.GalleryId);
            if (gallery == null) return NotFound();
            if (!User.IsGalleryMember(gallery)) return Forbid();

            var result = await placeService.GetPlaceYearAsync(id, year);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpGet("{id}/years/{year}/months/{month}")]
        public async Task<ActionResult<MonthFullViewModel>> GetPlaceMonth(int id, int year, int month)
        {
            var place = await placeService.GetPlaceByIdAsync(id);
            if (place == null) return NotFound();
            
            var gallery = await galleryService.Get(place.GalleryId);
            if (gallery == null) return NotFound();
            if (!User.IsGalleryMember(gallery)) return Forbid();

            var result = await placeService.GetPlaceMonthAsync(id, year, month);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpPost("{placeId}/photos/{photoId}")]
        public async Task<ActionResult> AssignPhotoToPlace(int placeId, int photoId)
        {
            try
            {
                var place = await placeService.GetPlaceByIdAsync(placeId);
                if (place == null) return NotFound();
                
                var gallery = await galleryService.Get(place.GalleryId);
                if (gallery == null) return NotFound();
                if (!User.IsGalleryAdministrator(gallery)) return Forbid();

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

        [HttpPost("{placeId}/cover/{photoId}")]
        public async Task<ActionResult> SetPlaceCover(int placeId, int photoId)
        {
            try
            {
                var place = await placeService.GetPlaceByIdAsync(placeId);
                if (place == null) return NotFound();
                
                var gallery = await galleryService.Get(place.GalleryId);
                if (gallery == null) return NotFound();
                if (!User.IsGalleryAdministrator(gallery)) return Forbid();

                var success = await placeService.SetPlaceCoverAsync(placeId, photoId);
                if (!success)
                {
                    return BadRequest("Could not set cover photo for place");
                }
                return Ok();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error setting cover photo {PhotoId} for place {PlaceId}", photoId, placeId);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("gallery/{galleryId}/merge-duplicates")]
        public async Task<ActionResult<int>> MergeDuplicatePlaces(int galleryId)
        {
            try
            {
                var gallery = await galleryService.Get(galleryId);
                if (gallery == null) return NotFound();
                if (!User.IsGalleryAdministrator(gallery)) return Forbid();

                var mergedCount = await placeService.MergeDuplicatePlacesAsync(galleryId);
                return Ok(new { mergedCount, message = $"Successfully merged {mergedCount} duplicate places" });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error merging duplicate places for gallery {GalleryId}", galleryId);
                return StatusCode(500, "Internal server error");
            }
        }
    }
}