using System;

namespace GaleriePhotos.Models
{
    public class Photo
    {
        public int Id { get; set; }
        public string FileName { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public string? Camera { get; set; }
        public DateTime DateTime { get; set; }
        public int GalleryId { get; set; }

        public Photo(string fileName)
        {
            FileName = fileName;
        }

        public Photo(string fileName, int galleryId)
        {
            FileName = fileName;
            GalleryId = galleryId;
        }

        // Navigation properties
        public required Gallery Gallery { get; set; }
    }
}
