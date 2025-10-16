using Galerie.Server.ViewModels;
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
    public class OpenStreetMapPlaceData
    {
        public string Name { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public long? PlaceId { get; set; }
        public string? OsmType { get; set; }
        public long? OsmId { get; set; }
        public PlaceType Type { get; set; } = PlaceType.City;
        
        // Parent place data (e.g., country)
        public string? ParentName { get; set; }
        public double? ParentLatitude { get; set; }
        public double? ParentLongitude { get; set; }
        public long? ParentPlaceId { get; set; }
        public string? ParentOsmType { get; set; }
        public long? ParentOsmId { get; set; }
        public PlaceType? ParentType { get; set; }
    }

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
                // Get place data from OpenStreetMap first
                var osmPlaceData = await GetPlaceDataFromOpenStreetMapAsync(latitude, longitude);
                if (osmPlaceData == null)
                {
                    return null;
                }

                // Check if we already have this place using OpenStreetMap identifiers
                var existingPlace = await context.Places
                    .Where(p => p.GalleryId == galleryId)
                    .Where(p => p.OsmPlaceId == osmPlaceData.PlaceId || 
                               (p.OsmType == osmPlaceData.OsmType && p.OsmId == osmPlaceData.OsmId))
                    .FirstOrDefaultAsync();

                if (existingPlace != null)
                {
                    return existingPlace;
                }

                // Create new place using OpenStreetMap data
                var gallery = await context.Galleries.FindAsync(galleryId);
                if (gallery == null)
                {
                    return null;
                }

                // Create parent place if needed and available
                Place? parentPlace = null;
                if (osmPlaceData.ParentName != null && osmPlaceData.ParentLatitude.HasValue && osmPlaceData.ParentLongitude.HasValue)
                {
                    // Check if parent place already exists
                    var existingParent = await context.Places
                        .Where(p => p.GalleryId == galleryId)
                        .Where(p => p.OsmPlaceId == osmPlaceData.ParentPlaceId || 
                                   (p.OsmType == osmPlaceData.ParentOsmType && p.OsmId == osmPlaceData.ParentOsmId))
                        .FirstOrDefaultAsync();

                    if (existingParent != null)
                    {
                        parentPlace = existingParent;
                    }
                    else
                    {
                        // Create new parent place
                        parentPlace = new Place(osmPlaceData.ParentName, osmPlaceData.ParentLatitude.Value, osmPlaceData.ParentLongitude.Value)
                        {
                            GalleryId = galleryId,
                            Gallery = gallery,
                            OsmPlaceId = osmPlaceData.ParentPlaceId,
                            OsmType = osmPlaceData.ParentOsmType,
                            OsmId = osmPlaceData.ParentOsmId,
                            Type = osmPlaceData.ParentType ?? PlaceType.Country
                        };

                        context.Places.Add(parentPlace);
                        await context.SaveChangesAsync(); // Save parent first to get ID

                        logger.LogInformation("Created new parent place: {PlaceName} at {Latitude}, {Longitude} with OSM ID {OsmPlaceId}", 
                            osmPlaceData.ParentName, osmPlaceData.ParentLatitude, osmPlaceData.ParentLongitude, osmPlaceData.ParentPlaceId);
                    }
                }

                var place = new Place(osmPlaceData.Name, osmPlaceData.Latitude, osmPlaceData.Longitude)
                {
                    GalleryId = galleryId,
                    Gallery = gallery,
                    OsmPlaceId = osmPlaceData.PlaceId,
                    OsmType = osmPlaceData.OsmType,
                    OsmId = osmPlaceData.OsmId,
                    Type = osmPlaceData.Type,
                    ParentId = parentPlace?.Id
                };

                context.Places.Add(place);
                await context.SaveChangesAsync();

                logger.LogInformation("Created new place: {PlaceName} at {Latitude}, {Longitude} with OSM ID {OsmPlaceId}", 
                    osmPlaceData.Name, osmPlaceData.Latitude, osmPlaceData.Longitude, osmPlaceData.PlaceId);
                return place;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting nearest place for coordinates {Latitude}, {Longitude}", latitude, longitude);
                return null;
            }
        }

        private async Task<OpenStreetMapPlaceData?> GetPlaceDataFromOpenStreetMapAsync(double latitude, double longitude)
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

                var placeData = new OpenStreetMapPlaceData();

                // Get the coordinates from OpenStreetMap response
                if (json.RootElement.TryGetProperty("lat", out var latElement) &&
                    json.RootElement.TryGetProperty("lon", out var lonElement))
                {
                    if (double.TryParse(latElement.GetString(), NumberStyles.Float, CultureInfo.InvariantCulture, out var osmLat) &&
                        double.TryParse(lonElement.GetString(), NumberStyles.Float, CultureInfo.InvariantCulture, out var osmLon))
                    {
                        placeData.Latitude = osmLat;
                        placeData.Longitude = osmLon;
                    }
                    else
                    {
                        // Fallback to original coordinates if parsing fails
                        placeData.Latitude = latitude;
                        placeData.Longitude = longitude;
                    }
                }
                else
                {
                    // Fallback to original coordinates if not found in response
                    placeData.Latitude = latitude;
                    placeData.Longitude = longitude;
                }

                // Get OpenStreetMap identifiers
                if (json.RootElement.TryGetProperty("place_id", out var placeIdElement))
                {
                    placeData.PlaceId = placeIdElement.GetInt64();
                }

                if (json.RootElement.TryGetProperty("osm_type", out var osmTypeElement))
                {
                    placeData.OsmType = osmTypeElement.GetString();
                }

                if (json.RootElement.TryGetProperty("osm_id", out var osmIdElement))
                {
                    placeData.OsmId = osmIdElement.GetInt64();
                }

                // Get place name and determine type
                if (json.RootElement.TryGetProperty("address", out var address))
                {
                    // Try to get city, town, village, or hamlet and set type accordingly
                    if (address.TryGetProperty("city", out var city))
                    {
                        placeData.Name = city.GetString() ?? string.Empty;
                        placeData.Type = PlaceType.City;
                    }
                    else if (address.TryGetProperty("town", out var town))
                    {
                        placeData.Name = town.GetString() ?? string.Empty;
                        placeData.Type = PlaceType.Town;
                    }
                    else if (address.TryGetProperty("village", out var village))
                    {
                        placeData.Name = village.GetString() ?? string.Empty;
                        placeData.Type = PlaceType.Village;
                    }
                    else if (address.TryGetProperty("hamlet", out var hamlet))
                    {
                        placeData.Name = hamlet.GetString() ?? string.Empty;
                        placeData.Type = PlaceType.Hamlet;
                    }
                    else if (address.TryGetProperty("municipality", out var municipality))
                    {
                        placeData.Name = municipality.GetString() ?? string.Empty;
                        placeData.Type = PlaceType.City;
                    }
                    else if (address.TryGetProperty("county", out var county))
                    {
                        placeData.Name = county.GetString() ?? string.Empty;
                        placeData.Type = PlaceType.City;
                    }

                    // Extract country information as parent
                    if (address.TryGetProperty("country", out var country))
                    {
                        placeData.ParentName = country.GetString();
                        placeData.ParentType = PlaceType.Country;
                        
                        // Try to get country code for more accurate lookups
                        if (address.TryGetProperty("country_code", out var countryCode))
                        {
                            var countryCodeStr = countryCode.GetString()?.ToUpper();
                            if (!string.IsNullOrEmpty(countryCodeStr))
                            {
                                // For countries, we'll need to make a separate API call to get country coordinates
                                await PopulateCountryDataAsync(placeData, countryCodeStr);
                            }
                        }
                    }
                }

                // Fallback to display_name if no specific place found
                if (string.IsNullOrEmpty(placeData.Name) && json.RootElement.TryGetProperty("display_name", out var displayName))
                {
                    var fullName = displayName.GetString();
                    if (!string.IsNullOrEmpty(fullName))
                    {
                        // Take first part of display name (usually the most specific location)
                        var parts = fullName.Split(',');
                        placeData.Name = parts[0].Trim();
                    }
                }

                return string.IsNullOrEmpty(placeData.Name) ? null : placeData;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error calling OpenStreetMap API for coordinates {Latitude}, {Longitude}", latitude, longitude);
                return null;
            }
        }

        private async Task PopulateCountryDataAsync(OpenStreetMapPlaceData placeData, string countryCode)
        {
            try
            {
                // Query for country data using country code
                var url = $"https://nominatim.openstreetmap.org/search?format=json&country={countryCode}&limit=1&addressdetails=1";
                
                httpClient.DefaultRequestHeaders.Clear();
                httpClient.DefaultRequestHeaders.Add("User-Agent", "GaleriePhotos/1.0 (https://github.com/Sidoine/galerie)");

                var response = await httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();

                var jsonString = await response.Content.ReadAsStringAsync();
                var json = JsonDocument.Parse(jsonString);

                if (json.RootElement.ValueKind == JsonValueKind.Array && json.RootElement.GetArrayLength() > 0)
                {
                    var countryData = json.RootElement[0];

                    // Get country coordinates
                    if (countryData.TryGetProperty("lat", out var latElement) &&
                        countryData.TryGetProperty("lon", out var lonElement))
                    {
                        if (double.TryParse(latElement.GetString(), NumberStyles.Float, CultureInfo.InvariantCulture, out var countryLat) &&
                            double.TryParse(lonElement.GetString(), NumberStyles.Float, CultureInfo.InvariantCulture, out var countryLon))
                        {
                            placeData.ParentLatitude = countryLat;
                            placeData.ParentLongitude = countryLon;
                        }
                    }

                    // Get country OpenStreetMap identifiers
                    if (countryData.TryGetProperty("place_id", out var placeIdElement))
                    {
                        placeData.ParentPlaceId = placeIdElement.GetInt64();
                    }

                    if (countryData.TryGetProperty("osm_type", out var osmTypeElement))
                    {
                        placeData.ParentOsmType = osmTypeElement.GetString();
                    }

                    if (countryData.TryGetProperty("osm_id", out var osmIdElement))
                    {
                        placeData.ParentOsmId = osmIdElement.GetInt64();
                    }
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Error getting country data for {CountryCode}", countryCode);
                // Don't fail the main place creation if country lookup fails
            }
        }

        public async Task<List<PlaceViewModel>> GetCountriesByGalleryAsync(int galleryId)
        {
            var countries = await context.Places
                .Include(x => x.CoverPhoto)
                .Where(p => p.GalleryId == galleryId && p.Type == PlaceType.Country)
                .Select(p => new PlaceViewModel
                {
                    Id = p.Id,
                    Name = p.Name,
                    Latitude = p.Latitude,
                    Longitude = p.Longitude,
                    Type = p.Type,
                    ParentId = p.ParentId,
                    CoverPhotoId = p.CoverPhoto != null ? p.CoverPhoto.PublicId.ToString() : null,
                    // Count all photos in cities within this country
                    NumberOfPhotos = context.Photos.Count(ph => ph.Place != null && ph.Place.ParentId == p.Id) +
                                context.Photos.Count(ph => ph.PlaceId == p.Id)
                })
                .OrderBy(p => p.Name)
                .ToListAsync();

            return countries;
        }

        public async Task<PlaceFullViewModel?> GetPlaceByIdAsync(int placeId)
        {
            return await context.Places
                .Include(x => x.CoverPhoto)
                .Where(x => x.Id == placeId)
                .Select(p => new PlaceFullViewModel
                {
                    Id = p.Id,
                    Name = p.Name,
                    Latitude = p.Latitude,
                    Longitude = p.Longitude,
                    Type = p.Type,
                    ParentId = p.ParentId,
                    CoverPhotoId = p.CoverPhoto != null ? p.CoverPhoto.PublicId.ToString() : null,
                    NumberOfPhotos = context.Photos.Count(ph => ph.PlaceId == p.Id),
                    MinDate = context.Photos.Any(x => x.PlaceId == p.Id) ? context.Photos.Where(ph => ph.PlaceId == p.Id).Min(ph => ph.DateTime) : DateTime.UtcNow,
                    MaxDate = context.Photos.Any(x => x.PlaceId == p.Id) ? context.Photos.Where(ph => ph.PlaceId == p.Id).Max(ph => ph.DateTime) : DateTime.UtcNow
                })
                .FirstOrDefaultAsync();
        }

        public async Task<YearViewModel[]> GetPlaceYearsAsync(int placeId)
        {
            return await context.Photos.Where(x => x.PlaceId == placeId)
                .GroupBy(x => x.DateTime.Year)
                .Select(x => new YearViewModel
                {
                    Id = x.Key,
                    Name = x.Key.ToString(),
                    NumberOfPhotos = x.Count()
                })
                .Distinct()
                .ToArrayAsync();
        }

        public async Task<List<PlaceViewModel>> GetCitiesByCountryAsync(int countryId, int galleryId)
        {
            var cities = await context.Places
                .Include(x => x.CoverPhoto)
                .Where(p => p.GalleryId == galleryId && p.ParentId == countryId)
                .Select(p => new PlaceViewModel
                {
                    Id = p.Id,
                    Name = p.Name,
                    Latitude = p.Latitude,
                    Longitude = p.Longitude,
                    Type = p.Type,
                    ParentId = p.ParentId,
                    CoverPhotoId = p.CoverPhoto != null ? p.CoverPhoto.PublicId.ToString() : null,
                    NumberOfPhotos = context.Photos.Count(ph => ph.PlaceId == p.Id)
                })
                .OrderBy(p => p.Name)
                .ToListAsync();

            return cities;
        }

        public async Task<List<PlaceViewModel>> GetPlacesByGalleryAsync(int galleryId)
        {
            var places = await context.Places
                .Include(x => x.CoverPhoto)
                .Where(p => p.GalleryId == galleryId)
                .Select(p => new PlaceViewModel
                {
                    Id = p.Id,
                    Name = p.Name,
                    Latitude = p.Latitude,
                    Longitude = p.Longitude,
                    Type = p.Type,
                    ParentId = p.ParentId,
                    CoverPhotoId = p.CoverPhoto != null ? p.CoverPhoto.PublicId.ToString() : null,
                    NumberOfPhotos = context.Photos.Count(ph => ph.PlaceId == p.Id)
                })
                .OrderBy(p => p.Name)
                .ToListAsync();

            return places;
        }

        public async Task<Photo[]> GetPlacePhotosAsync(int placeId, int? year, int? month)
        {
            IQueryable<Photo> query = QueryPlacePhotos(placeId, year, month);
            return await query.ToArrayAsync();
        }

        private IQueryable<Photo> QueryPlacePhotos(int placeId, int? year, int? month)
        {
            var query = context.Photos
                            .Where(p => p.PlaceId == placeId && p.Directory.PhotoDirectoryType != PhotoDirectoryType.Private && p.Directory.PhotoDirectoryType != PhotoDirectoryType.Trash);
            if (year != null) query = query.Where(p => p.DateTime.Year == year.Value);
            if (month != null) query = query.Where(p => p.DateTime.Month == month.Value);
            return query;
        }

        public async Task<int> GetPlaceNumberOfPhotosAsync(int placeId, int? year, int? month)
        {
            return await QueryPlacePhotos(placeId, year, month).CountAsync();
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
            // Auto assign cover if none yet
            if (place.CoverPhotoId == null)
            {
                place.CoverPhotoId = photo.Id;
            }
            await context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> SetPlaceCoverAsync(int placeId, int photoId)
        {
            var place = await context.Places.FindAsync(placeId);
            if (place == null) return false;

            var photo = await context.Photos.Include(p => p.Directory).FirstOrDefaultAsync(x => x.Id == photoId);
            if (photo == null) return false;

            if (photo.Directory.GalleryId != place.GalleryId) return false;

            place.CoverPhotoId = photo.Id;
            await context.SaveChangesAsync();
            return true;
        }

        public async Task<MonthViewModel[]> GetPlaceMonthsAsync(int id, int year)
        {
            return await context.Photos.Where(x => x.PlaceId == id && x.DateTime.Year == year)
                .GroupBy(x => x.DateTime.Month)
                .Select(x => new MonthViewModel
                {
                    Id = x.Key,
                    Name = CultureInfo.CurrentCulture.DateTimeFormat.GetMonthName(x.Key),
                    NumberOfPhotos = x.Count()
                })
                .Distinct()
                .ToArrayAsync();
        }

        public async Task<YearFullViewModel?> GetPlaceYearAsync(int placeId, int year)
        {
            var baseQuery = context.Photos.Where(p => p.PlaceId == placeId && p.DateTime.Year == year);
            if (!await baseQuery.AnyAsync()) return null;

            var number = await baseQuery.CountAsync();
            var min = await baseQuery.MinAsync(p => p.DateTime);
            var max = await baseQuery.MaxAsync(p => p.DateTime);
            // Cover : première photo chronologique de l'année si disponible
            var cover = await baseQuery.OrderBy(p => p.DateTime).Select(p => p.PublicId.ToString()).FirstOrDefaultAsync();
            return new YearFullViewModel
            {
                Id = year,
                Name = year.ToString(),
                NumberOfPhotos = number,
                CoverPhotoId = cover,
                MinDate = min,
                MaxDate = max
            };
        }

        public async Task<MonthFullViewModel?> GetPlaceMonthAsync(int placeId, int year, int month)
        {
            var baseQuery = context.Photos.Where(p => p.PlaceId == placeId && p.DateTime.Year == year && p.DateTime.Month == month);
            if (!await baseQuery.AnyAsync()) return null;

            var number = await baseQuery.CountAsync();
            var min = await baseQuery.MinAsync(p => p.DateTime);
            var max = await baseQuery.MaxAsync(p => p.DateTime);
            var cover = await baseQuery.OrderBy(p => p.DateTime).Select(p => p.PublicId.ToString()).FirstOrDefaultAsync();
            return new MonthFullViewModel
            {
                Id = month,
                Name = CultureInfo.CurrentCulture.DateTimeFormat.GetMonthName(month),
                NumberOfPhotos = number,
                CoverPhotoId = cover,
                MinDate = min,
                MaxDate = max
            };
        }
    }
}