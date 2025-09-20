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

        public PhotoDirectory(string path, int visibility, int? coverPhotoId, PhotoDirectoryType photoDirectoryType = PhotoDirectoryType.Regular)
        {
            Path = path;
            Visibility = visibility;
            CoverPhotoId = coverPhotoId;
            PhotoDirectoryType = photoDirectoryType;
        }

        // Navigation properties
        public required Gallery Gallery { get; set; }
    }
}
