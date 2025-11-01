using Folke.CsTsService.Optional;

namespace GaleriePhotos.ViewModels
{
    public class PhotoPatchViewModel
    {
        public Optional<bool> Visible { get; set; }
        public Optional<string?> Description { get; set; }
    }
}
