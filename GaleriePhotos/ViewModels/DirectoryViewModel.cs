using GaleriePhotos.Models;
using System.IO;

namespace GaleriePhotos.ViewModels
{
    public class DirectoryViewModel
    {
        public int Id { get; set; }
        public DirectoryVisibility Visibility { get; set; }
        public string Name { get; set; }
        public int? CoverPhotoId { get; set; }

        public DirectoryViewModel(PhotoDirectory photoDirectory) =>
            (Id, Visibility, Name, CoverPhotoId) = (photoDirectory.Id, photoDirectory.Visibility, Path.GetFileName(photoDirectory.Path), photoDirectory.CoverPhotoId);
    }
}
