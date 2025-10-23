using System.ComponentModel.DataAnnotations;

namespace GaleriePhotos.ViewModels
{
    public class FaceNameUpdateViewModel
    {
        [Required]
        public required string Name { get; set; }
    }
}
