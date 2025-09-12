using Folke.CsTsService.Optional;
using GaleriePhotos.Models;

namespace GaleriePhotos.ViewModels
{
    public class GalleryMemberPatchViewModel
    {
        public Optional<int> DirectoryVisibility { get; set; }
        public Optional<bool> IsAdministrator { get; set; }
    }
}