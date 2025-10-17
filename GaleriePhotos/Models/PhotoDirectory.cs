namespace GaleriePhotos.Models
{
    public class PhotoDirectory
    {
        public int Id { get; set; }
        public string Path { get; set; }
        public int Visibility { get; set; }
        public int? CoverPhotoId { get; set; }
        public int GalleryId { get; set; }
        public PhotoDirectoryType PhotoDirectoryType { get; set; }
        public int? ParentDirectoryId { get; set; }

        public PhotoDirectory(string path, int visibility, int? coverPhotoId, int? parentDirectoryId, PhotoDirectoryType photoDirectoryType = PhotoDirectoryType.Regular)
        {
            Path = path;
            Visibility = visibility;
            CoverPhotoId = coverPhotoId;
            ParentDirectoryId = parentDirectoryId;
            PhotoDirectoryType = photoDirectoryType;
        }

        // Navigation properties
        public required Gallery Gallery { get; set; }
        public Photo? CoverPhoto { get; set; }
        public PhotoDirectory? ParentDirectory { get; set; }
    }
}
