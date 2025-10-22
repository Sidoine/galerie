using System.ComponentModel.DataAnnotations;

namespace GaleriePhotos.ViewModels
{
    public class RecentSearchCreateViewModel
    {
        [Required]
        [MaxLength(256)]
        public required string Query { get; set; }
    }
}
