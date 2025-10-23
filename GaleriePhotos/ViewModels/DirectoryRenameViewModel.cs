using System.ComponentModel.DataAnnotations;

namespace GaleriePhotos.ViewModels
{
    public class DirectoryRenameViewModel
    {
        [Required]
        public required string Name { get; set; }
    }
}
