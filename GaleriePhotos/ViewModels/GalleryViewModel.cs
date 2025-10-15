namespace GaleriePhotos.ViewModels
{
    public class GalleryViewModel
    {
        public int Id { get; set; }
        public required string Name { get; set; }
        public int RootDirectoryId { get; set; }
        public int NumberOfPhotos { get; set; }
        public string? CoverPhotoId { get; set; }
    }
}