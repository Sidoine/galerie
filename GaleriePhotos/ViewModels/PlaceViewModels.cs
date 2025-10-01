using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using GaleriePhotos.Models;

namespace GaleriePhotos.ViewModels
{
    public class PlaceViewModel
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public int GalleryId { get; set; }
        public DateTime CreatedAt { get; set; }
        public int PhotoCount { get; set; }
        public PlaceType Type { get; set; }
        public int? ParentId { get; set; }
        public string? ParentName { get; set; }
        public List<PlaceViewModel> Children { get; set; } = new List<PlaceViewModel>();
    }

    public class PlaceCreateViewModel
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        public double Latitude { get; set; }
        
        [Required]
        public double Longitude { get; set; }
        
        [Required]
        public int GalleryId { get; set; }
    }

    public class PlacePatchViewModel
    {
        public string? Name { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
    }

    public class PlacePhotosViewModel
    {
        public PlaceViewModel Place { get; set; } = null!;
        public List<PhotoGroupViewModel> PhotoGroups { get; set; } = new List<PhotoGroupViewModel>();
    }

    public class PhotoGroupViewModel
    {
        public string Title { get; set; } = string.Empty; // e.g., "2023", "January 2023"
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int PhotoCount { get; set; }
        public List<int> PhotoIds { get; set; } = new List<int>();
    }
}