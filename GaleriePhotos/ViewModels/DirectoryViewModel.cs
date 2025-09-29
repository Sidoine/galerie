using GaleriePhotos.Models;
using System.IO;

namespace GaleriePhotos.ViewModels
{
    public class DirectoryViewModel
    {
        public int Id { get; set; }
        public int Visibility { get; set; }
        public string Name { get; set; }
        public string? CoverPhotoId { get; set; }
        public int NumberOfPhotos { get; set; }
        public int NumberOfSubDirectories { get; set; }

        public DirectoryViewModel(PhotoDirectory photoDirectory, int numberOfPhotos, int numberOfSubDirectories) =>
            (Id, Visibility, Name, CoverPhotoId, NumberOfPhotos, NumberOfSubDirectories) = (photoDirectory.Id, photoDirectory.Visibility, Path.GetFileName(photoDirectory.Path), photoDirectory.CoverPhoto?.PublicId.ToString(), numberOfPhotos, numberOfSubDirectories);
    }
}
