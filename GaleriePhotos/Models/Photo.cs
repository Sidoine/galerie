using System;
using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace GaleriePhotos.Models
{
    [Index(nameof(PublicId), IsUnique = true)]
    public class Photo
    {
        public int Id { get; set; }
        
        [Required]
        public Guid PublicId { get; set; } = Guid.NewGuid();
        
        public string FileName { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public string? Camera { get; set; }
        public DateTime DateTime { get; set; }
        public FaceDetectionStatus FaceDetectionStatus { get; set; }
        public int DirectoryId { get; internal set; }
        public int? PlaceId { get; set; }

        public Photo(string fileName)
        {
            FileName = fileName;
            PublicId = Guid.NewGuid();
        }

        // Navigation properties
        public required PhotoDirectory Directory { get; set; }
        public Place? Place { get; set; }
    }
}
