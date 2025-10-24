using Folke.CsTsService.Optional;
using GaleriePhotos.Models;

namespace GaleriePhotos.ViewModels
{
    public class DirectoryPatchViewModel
    {
        public Optional<int> Visibility { get; set; }
        public Optional<int> CoverPhotoId { get; set; }
        public Optional<string> Name { get; set; }
    }
}
