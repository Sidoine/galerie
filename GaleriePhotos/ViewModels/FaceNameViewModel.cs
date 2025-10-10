using GaleriePhotos.Models;
using System.ComponentModel.DataAnnotations;

namespace GaleriePhotos.ViewModels
{
    public class FaceNameViewModel
    {
        public int Id { get; set; }

        [Required]
        public required string Name { get; set; }

        public int NumberOfPhotos { get; set; }

        public string? CoverPhotoId { get; set; }
    }
}
