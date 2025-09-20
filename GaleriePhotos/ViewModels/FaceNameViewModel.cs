using GaleriePhotos.Models;
using System.ComponentModel.DataAnnotations;

namespace GaleriePhotos.ViewModels
{
    public class FaceNameViewModel
    {
        public int Id { get; set; }

        [Required]
        public string Name { get; set; }

        public FaceNameViewModel(FaceName faceName) => (Id, Name) = (faceName.Id, faceName.Name);
    }
}
