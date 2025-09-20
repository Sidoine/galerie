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
        public FaceDetectionStatus FaceDetectionStatus { get; set; }
        public int DirectoryId { get; internal set; }

        public Photo(string fileName)
        {
            FileName = fileName;
        }

        // Navigation properties
        public required PhotoDirectory Directory { get; set; }
    }
}
