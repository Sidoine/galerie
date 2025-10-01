using System;
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

        public Place(string name, double latitude, double longitude)
        {
            Name = name;
            Latitude = latitude;
            Longitude = longitude;
        }

        // Navigation properties
        public required Gallery Gallery { get; set; }
    }
}