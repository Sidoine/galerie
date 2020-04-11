using GaleriePhotos.Models;

namespace Galerie.Server.ViewModels
{
    public class PhotoViewModel
    {
        public int Id { get; set; }
        
        public string Name { get; set; }

        public bool Visible { get; set; }

        public PhotoViewModel(Photo photo) =>
            (Id, Name, Visible) = (photo.Id, photo.FileName, photo.Visible);
    }
}
