using System;

namespace GaleriePhotos.ViewModels
{
    public class PhotoBulkUpdateDateViewModel
    {
        public int[] PhotoIds { get; set; } = [];
        public DateTime DateTime { get; set; }
    }
}
