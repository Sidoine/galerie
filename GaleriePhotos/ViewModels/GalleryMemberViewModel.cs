using GaleriePhotos.Models;

namespace GaleriePhotos.ViewModels
{
    public class GalleryMemberViewModel
    {
        public int Id { get; set; }
        public int GalleryId { get; set; }
        public string GalleryName { get; set; }
        public string UserId { get; set; }
        public string UserName { get; set; }
        public DirectoryVisibility DirectoryVisibility { get; set; }
    public bool IsAdministrator { get; set; }

        public GalleryMemberViewModel(GalleryMember galleryMember)
        {
            Id = galleryMember.Id;
            GalleryId = galleryMember.GalleryId;
            GalleryName = galleryMember.Gallery?.Name ?? "Unknown";
            UserId = galleryMember.UserId;
            UserName = galleryMember.User?.UserName ?? "Unknown";
            DirectoryVisibility = galleryMember.DirectoryVisibility;
            IsAdministrator = galleryMember.IsAdministrator;
        }
    }
}