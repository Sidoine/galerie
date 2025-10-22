using System;
using System.ComponentModel.DataAnnotations;

namespace GaleriePhotos.Models
{
    public class GalleryRecentSearch
    {
        public int Id { get; set; }

        [MaxLength(256)]
        public required string Query { get; set; }

        public required string UserId { get; set; }

        public required ApplicationUser User { get; set; }

        public int GalleryId { get; set; }

        public required Gallery Gallery { get; set; }

        public DateTime CreatedAtUtc { get; set; }
    }
}
