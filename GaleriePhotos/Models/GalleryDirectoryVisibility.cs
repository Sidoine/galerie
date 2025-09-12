namespace GaleriePhotos.Models
{
    public class GalleryDirectoryVisibility
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Icon { get; set; } = string.Empty;
        public int Value { get; set; }
        public int GalleryId { get; set; }

        // Navigation properties
        public required Gallery Gallery { get; set; }
    }
}