namespace GaleriePhotos.Models
{
    public class GalleryMember
    {
        public int Id { get; set; }
        public int GalleryId { get; set; }
        public string UserId { get; set; }
        public int DirectoryVisibility { get; set; }
        public bool IsAdministrator { get; set; }

        public GalleryMember(int galleryId, string userId, int directoryVisibility, bool isAdministrator = false)
        {
            GalleryId = galleryId;
            UserId = userId;
            DirectoryVisibility = directoryVisibility;
            IsAdministrator = isAdministrator;
        }

        // Navigation properties
        public required Gallery Gallery { get; set; }
        public required ApplicationUser User { get; set; }
    }
}