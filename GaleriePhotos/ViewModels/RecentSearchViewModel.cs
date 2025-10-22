using System;

namespace GaleriePhotos.ViewModels
{
    public class RecentSearchViewModel
    {
        public required string Query { get; set; }
        public DateTime CreatedAtUtc { get; set; }
    }
}
