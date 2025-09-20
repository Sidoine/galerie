using GaleriePhotos.Models;
using GaleriePhotos.Services;

namespace Galerie.Server.ViewModels
{
    public class PhotoViewModel
    {
        public int Id { get; set; }
        
        public string Name { get; set; }

        public bool Video { get; set; }

        public int DirectoryId { get; set; }

        public PhotoViewModel(Photo photo) =>
            (Id, Name, Video, DirectoryId) = (photo.Id, photo.FileName, PhotoService.IsVideo(photo), photo.DirectoryId);
    }
}
