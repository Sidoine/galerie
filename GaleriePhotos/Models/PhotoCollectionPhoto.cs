namespace GaleriePhotos.Models
{
    public class PhotoCollectionPhoto
    {
        public int Id { get; set; }
        public int PhotoCollectionId { get; set; }
        public int PhotoId { get; set; }

        public PhotoCollectionPhoto(int photoCollectionId, int photoId)
        {
            PhotoCollectionId = photoCollectionId;
            PhotoId = photoId;
        }

        public PhotoCollection? PhotoCollection { get; set; }
        public Photo? Photo { get; set; }
    }
}