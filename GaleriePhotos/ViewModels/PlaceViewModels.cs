using System;
using GaleriePhotos.Models;

namespace GaleriePhotos.ViewModels
{
    public class PlaceViewModel
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public int NumberOfPhotos { get; set; }
        public PlaceType Type { get; set; }
        public int? ParentId { get; set; }
        public string? CoverPhotoId { get; set; }
    }
}