using System.Collections.Generic;

namespace GaleriePhotos.Models
{
    public class Gallery
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string RootDirectory { get; set; }
        public string? ThumbnailsDirectory { get; set; }

        public Gallery(string name, string rootDirectory, string? thumbnailsDirectory = null)
        {
            Name = name;
            RootDirectory = rootDirectory;
            ThumbnailsDirectory = thumbnailsDirectory;
        }

        // Navigation properties
        public ICollection<GalleryMember> Members { get; set; } = new List<GalleryMember>();
        public ICollection<Photo> Photos { get; set; } = new List<Photo>();
        public ICollection<PhotoDirectory> PhotoDirectories { get; set; } = new List<PhotoDirectory>();
    }
}