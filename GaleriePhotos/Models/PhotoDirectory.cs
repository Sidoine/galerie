namespace GaleriePhotos.Models
{
    public class PhotoDirectory
    {
        public int Id { get; set; }
        public string Path { get; set; }
        public int Visibility { get; set; }
        public int? CoverPhotoId { get; set; }
        public int GalleryId { get; set; }

        public PhotoDirectory(string path, int visibility, int? coverPhotoId)
        {
            Path = path;
            Visibility = visibility;
            CoverPhotoId = coverPhotoId;
        }

        public PhotoDirectory(string path, int visibility, int? coverPhotoId, int galleryId)
        {
            Path = path;
            Visibility = visibility;
            CoverPhotoId = coverPhotoId;
            GalleryId = galleryId;
        }

        // Navigation properties
        public required Gallery Gallery { get; set; }
    }
}
