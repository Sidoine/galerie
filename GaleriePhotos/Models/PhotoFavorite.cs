namespace GaleriePhotos.Models
{
    public class PhotoFavorite
    {
        public int Id { get; set; }
        public int PhotoId { get; set; }
        public string UserId { get; set; }

        public PhotoFavorite(int photoId, string userId)
        {
            PhotoId = photoId;
            UserId = userId;
        }

        // Navigation properties
        public Photo? Photo { get; set; }
        public ApplicationUser? User { get; set; }
    }
}
