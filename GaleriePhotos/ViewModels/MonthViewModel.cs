using System.ComponentModel.DataAnnotations;

namespace GaleriePhotos.ViewModels
{
    public class MonthViewModel
    {
        public int Id { get; set; }
        [Required]
        public required string Name { get; set; }
        public int NumberOfPhotos { get; set; }
    }
}
