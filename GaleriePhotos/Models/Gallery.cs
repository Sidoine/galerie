using System.Collections.Generic;

namespace GaleriePhotos.Models
{
    public class Gallery
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string RootDirectory { get; set; }
        public string ThumbnailsDirectory { get; set; }
        public DataProviderType DataProvider { get; set; } = DataProviderType.FileSystem;
        public string? SeafileServerUrl { get; set; }
        public string? SeafileApiKey { get; set; }
        public Gallery(string name, string rootDirectory, string thumbnailsDirectory, DataProviderType dataProvider = DataProviderType.FileSystem, string? seafileServerUrl = null, string? seafileApiKey = null)
        {
            Name = name;
            RootDirectory = rootDirectory;
            ThumbnailsDirectory = thumbnailsDirectory;
            DataProvider = dataProvider;
            SeafileServerUrl = seafileServerUrl;
            SeafileApiKey = seafileApiKey;
        }

        // Navigation properties
        public ICollection<GalleryMember> Members { get; set; } = new List<GalleryMember>();
        public ICollection<Photo> Photos { get; set; } = new List<Photo>();
        public ICollection<PhotoDirectory> PhotoDirectories { get; set; } = new List<PhotoDirectory>();
    }
}