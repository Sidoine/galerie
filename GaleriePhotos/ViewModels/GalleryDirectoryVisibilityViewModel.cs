using GaleriePhotos.Models;

namespace GaleriePhotos.ViewModels
{
    public class GalleryDirectoryVisibilityViewModel
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Icon { get; set; } = string.Empty;
        public int Value { get; set; }
        public int GalleryId { get; set; }

        public GalleryDirectoryVisibilityViewModel() { }

        public GalleryDirectoryVisibilityViewModel(GalleryDirectoryVisibility visibility)
        {
            Id = visibility.Id;
            Name = visibility.Name;
            Icon = visibility.Icon;
            Value = visibility.Value;
            GalleryId = visibility.GalleryId;
        }
    }

    public class GalleryDirectoryVisibilityPatchViewModel
    {
        public string? Name { get; set; }
        public string? Icon { get; set; }
        public int? Value { get; set; }
    }

    public class GalleryDirectoryVisibilityCreateViewModel
    {
        public string Name { get; set; } = string.Empty;
        public string Icon { get; set; } = string.Empty;
        public int Value { get; set; }
    }
}