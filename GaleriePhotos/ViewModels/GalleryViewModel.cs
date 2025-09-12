using GaleriePhotos.Models;
using System.Collections.Generic;
using System.Linq;

namespace GaleriePhotos.ViewModels
{
    public class GalleryViewModel
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string RootDirectory { get; set; } = string.Empty;
        public string? ThumbnailsDirectory { get; set; }
        public string[] AdministratorNames { get; set; } = [];

        public GalleryViewModel() { }

        public GalleryViewModel(Gallery gallery, IEnumerable<string> administratorNames)
        {
            Id = gallery.Id;
            Name = gallery.Name;
            RootDirectory = gallery.RootDirectory;
            ThumbnailsDirectory = gallery.ThumbnailsDirectory;
            AdministratorNames = administratorNames.ToArray();
        }
    }

    public class GalleryCreateViewModel
    {
        public string Name { get; set; } = string.Empty;
        public string RootDirectory { get; set; } = string.Empty;
        public string? ThumbnailsDirectory { get; set; }
        public string UserId { get; set; } = string.Empty;
    }

    public class GalleryPatchViewModel
    {
        public string? Name { get; set; }
        public string? RootDirectory { get; set; }
        public string? ThumbnailsDirectory { get; set; }
    }
}