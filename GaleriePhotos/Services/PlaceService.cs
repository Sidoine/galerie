using GaleriePhotos.Data;
using GaleriePhotos.Models;
using GaleriePhotos.ViewModels;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;

namespace GaleriePhotos.Services
{
    public class PlaceService
    {
        private readonly ApplicationDbContext context;
        private readonly ILogger<PlaceService> logger;
        private readonly HttpClient httpClient;

        public PlaceService(ApplicationDbContext context, ILogger<PlaceService> logger, HttpClient httpClient)
        {
            this.context = context;
            this.logger = logger;
            this.httpClient = httpClient;
        }

        public async Task<Place?> GetNearestPlaceAsync(double latitude, double longitude, int galleryId)
        {
            try
            {
                // First, check if we already have a place within ~1km radius
                var existingPlace = await context.Places
                    .Where(p => p.GalleryId == galleryId)
                    .Where(p => Math.Abs(p.Latitude - latitude) < 0.009 && Math.Abs(p.Longitude - longitude) < 0.009) // Roughly 1km
                    .OrderBy(p => Math.Pow(p.Latitude - latitude, 2) + Math.Pow(p.Longitude - longitude, 2))
                    .FirstOrDefaultAsync();

                if (existingPlace != null)
                {
                    return existingPlace;
                }

                // Query OpenStreetMap Nominatim API for reverse geocoding
                var placeName = await GetPlaceNameFromOpenStreetMapAsync(latitude, longitude);
                if (string.IsNullOrEmpty(placeName))
                {
                    return null;
                }

                // Create new place
                var gallery = await context.Galleries.FindAsync(galleryId);
                if (gallery == null)
                {
                    return null;
                }

                var place = new Place(placeName, latitude, longitude)
                {
                    GalleryId = galleryId,
                    Gallery = gallery
                };

                context.Places.Add(place);
                await context.SaveChangesAsync();

                logger.LogInformation("Created new place: {PlaceName} at {Latitude}, {Longitude}", placeName, latitude, longitude);
                return place;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting nearest place for coordinates {Latitude}, {Longitude}", latitude, longitude);
                return null;
            }
        }

        private async Task<string?> GetPlaceNameFromOpenStreetMapAsync(double latitude, double longitude)
        {
            try
            {
                var url = $"https://nominatim.openstreetmap.org/reverse?format=json&lat={latitude.ToString(CultureInfo.InvariantCulture)}&lon={longitude.ToString(CultureInfo.InvariantCulture)}&zoom=14&addressdetails=1";
                
                httpClient.DefaultRequestHeaders.Clear();
                httpClient.DefaultRequestHeaders.Add("User-Agent", "GaleriePhotos/1.0 (https://github.com/Sidoine/galerie)");

                var response = await httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();

                var jsonString = await response.Content.ReadAsStringAsync();
                var json = JsonDocument.Parse(jsonString);

                if (json.RootElement.TryGetProperty("address", out var address))
                {
                    // Try to get city, town, village, or hamlet
                    if (address.TryGetProperty("city", out var city))
                        return city.GetString();
                    if (address.TryGetProperty("town", out var town))
                        return town.GetString();
                    if (address.TryGetProperty("village", out var village))
                        return village.GetString();
                    if (address.TryGetProperty("hamlet", out var hamlet))
                        return hamlet.GetString();
                    if (address.TryGetProperty("municipality", out var municipality))
                        return municipality.GetString();
                    if (address.TryGetProperty("county", out var county))
                        return county.GetString();
                }

                // Fallback to display_name if no specific place found
                if (json.RootElement.TryGetProperty("display_name", out var displayName))
                {
                    var fullName = displayName.GetString();
                    if (!string.IsNullOrEmpty(fullName))
                    {
                        // Take first part of display name (usually the most specific location)
                        var parts = fullName.Split(',');
                        return parts[0].Trim();
                    }
                }

                return null;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error calling OpenStreetMap API for coordinates {Latitude}, {Longitude}", latitude, longitude);
                return null;
            }
        }

        public async Task<List<PlaceViewModel>> GetPlacesByGalleryAsync(int galleryId)
        {
            var places = await context.Places
                .Where(p => p.GalleryId == galleryId)
                .Select(p => new PlaceViewModel
                {
                    Id = p.Id,
                    Name = p.Name,
                    Latitude = p.Latitude,
                    Longitude = p.Longitude,
                    GalleryId = p.GalleryId,
                    CreatedAt = p.CreatedAt,
                    PhotoCount = context.Photos.Count(ph => ph.PlaceId == p.Id)
                })
                .OrderBy(p => p.Name)
                .ToListAsync();

            return places;
        }

        public async Task<PlacePhotosViewModel?> GetPlacePhotosAsync(int placeId)
        {
            var place = await context.Places.FindAsync(placeId);
            if (place == null)
            {
                return null;
            }

            var photos = await context.Photos
                .Where(p => p.PlaceId == placeId)
                .OrderBy(p => p.DateTime)
                .Select(p => new { p.Id, p.DateTime })
                .ToListAsync();

            var placeViewModel = new PlaceViewModel
            {
                Id = place.Id,
                Name = place.Name,
                Latitude = place.Latitude,
                Longitude = place.Longitude,
                GalleryId = place.GalleryId,
                CreatedAt = place.CreatedAt,
                PhotoCount = photos.Count
            };

            var photoGroups = GroupPhotosByTimespan(photos.Select(p => (dynamic)new { p.Id, p.DateTime }).ToList());

            return new PlacePhotosViewModel
            {
                Place = placeViewModel,
                PhotoGroups = photoGroups
            };
        }

        private List<PhotoGroupViewModel> GroupPhotosByTimespan(List<dynamic> photos)
        {
            if (!photos.Any())
            {
                return new List<PhotoGroupViewModel>();
            }

            var groups = new List<PhotoGroupViewModel>();
            var photoList = photos.Select(p => new { Id = (int)p.Id, DateTime = (DateTime)p.DateTime }).ToList();

            // Check if photos span more than 30 days
            var minDate = photoList.Min(p => p.DateTime);
            var maxDate = photoList.Max(p => p.DateTime);
            var daySpan = (maxDate - minDate).TotalDays;

            if (daySpan <= 30)
            {
                // Single group for all photos
                groups.Add(new PhotoGroupViewModel
                {
                    Title = "All Photos",
                    StartDate = minDate,
                    EndDate = maxDate,
                    PhotoCount = photoList.Count,
                    PhotoIds = photoList.Select(p => p.Id).ToList()
                });
            }
            else
            {
                // Group by year and month
                var yearGroups = photoList.GroupBy(p => p.DateTime.Year);
                
                foreach (var yearGroup in yearGroups.OrderBy(g => g.Key))
                {
                    var yearPhotos = yearGroup.ToList();
                    var yearSpan = (yearPhotos.Max(p => p.DateTime) - yearPhotos.Min(p => p.DateTime)).TotalDays;

                    if (yearSpan <= 30 || yearPhotos.Count <= 20)
                    {
                        // Single group for the year
                        groups.Add(new PhotoGroupViewModel
                        {
                            Title = yearGroup.Key.ToString(),
                            StartDate = yearPhotos.Min(p => p.DateTime),
                            EndDate = yearPhotos.Max(p => p.DateTime),
                            PhotoCount = yearPhotos.Count,
                            PhotoIds = yearPhotos.Select(p => p.Id).ToList()
                        });
                    }
                    else
                    {
                        // Group by month within the year
                        var monthGroups = yearPhotos.GroupBy(p => new { p.DateTime.Year, p.DateTime.Month });
                        
                        foreach (var monthGroup in monthGroups.OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month))
                        {
                            var monthPhotos = monthGroup.ToList();
                            var monthName = new DateTime(monthGroup.Key.Year, monthGroup.Key.Month, 1).ToString("MMMM yyyy");
                            
                            groups.Add(new PhotoGroupViewModel
                            {
                                Title = monthName,
                                StartDate = monthPhotos.Min(p => p.DateTime),
                                EndDate = monthPhotos.Max(p => p.DateTime),
                                PhotoCount = monthPhotos.Count,
                                PhotoIds = monthPhotos.Select(p => p.Id).ToList()
                            });
                        }
                    }
                }
            }

            return groups;
        }

        public async Task<bool> AssignPhotoToPlaceAsync(int photoId, int placeId)
        {
            var photo = await context.Photos.FindAsync(photoId);
            var place = await context.Places.FindAsync(placeId);

            if (photo == null || place == null)
            {
                return false;
            }

            photo.PlaceId = placeId;
            await context.SaveChangesAsync();
            return true;
        }
    }
}