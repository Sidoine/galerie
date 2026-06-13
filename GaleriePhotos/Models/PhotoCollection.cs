using System;
using System.Collections.Generic;

namespace GaleriePhotos.Models
{
    public class PhotoCollection
    {
        public int Id { get; set; }
        public int GalleryId { get; set; }
        public string UserId { get; set; }
        public string Name { get; set; }
        public DateTime CreatedAtUtc { get; set; }

        public PhotoCollection(int galleryId, string userId, string name)
        {
            GalleryId = galleryId;
            UserId = userId;
            Name = name;
            CreatedAtUtc = DateTime.UtcNow;
        }

        public Gallery? Gallery { get; set; }
        public ApplicationUser? User { get; set; }
        public ICollection<PhotoCollectionPhoto> Photos { get; set; } = [];
    }
}