using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace GaleriePhotos.Models
{
    public class Place
    {
        public int Id { get; set; }
        
        [Required]
        public string Name { get; set; }
        
        [Required]
        public double Latitude { get; set; }
        
        [Required]
        public double Longitude { get; set; }
        
        [Required]
        public int GalleryId { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // OpenStreetMap identifier
        public long? OsmPlaceId { get; set; }
        public string? OsmType { get; set; }
        public long? OsmId { get; set; }
        
        // Parent relationship (e.g., city belongs to country)
        public int? ParentId { get; set; }
        
        // Place type (Country, City, Town, etc.)
        public PlaceType Type { get; set; } = PlaceType.City;

        public Place(string name, double latitude, double longitude)
        {
            Name = name;
            Latitude = latitude;
            Longitude = longitude;
        }

        // Navigation properties
        public required Gallery Gallery { get; set; }
        public Place? Parent { get; set; }
        public ICollection<Place> Children { get; set; } = new List<Place>();
    }

    public enum PlaceType
    {
        Country = 1,
        City = 2,
        Town = 3,
        Village = 4,
        Hamlet = 5
    }
}