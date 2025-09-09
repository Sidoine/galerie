namespace GaleriePhotos.Models
{
    public class GalleryMember
    {
        public int Id { get; set; }
        public int GalleryId { get; set; }
        public string UserId { get; set; }
        public DirectoryVisibility DirectoryVisibility { get; set; }

        public GalleryMember(int galleryId, string userId, DirectoryVisibility directoryVisibility)
        {
            GalleryId = galleryId;
            UserId = userId;
            DirectoryVisibility = directoryVisibility;
        }

        // Navigation properties
        public required Gallery Gallery { get; set; }
        public required ApplicationUser User { get; set; }
    }
}