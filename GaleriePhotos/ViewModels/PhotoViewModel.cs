using GaleriePhotos.Models;
using GaleriePhotos.Services;

namespace Galerie.Server.ViewModels
{
    public class PhotoViewModel
    {
        public int Id { get; set; }
        
        public string Name { get; set; }

        public bool Video { get; set; }

        public PhotoViewModel(Photo photo) =>
            (Id, Name, Video) = (photo.Id, photo.FileName, PhotoService.IsVideo(photo));
    }
}
