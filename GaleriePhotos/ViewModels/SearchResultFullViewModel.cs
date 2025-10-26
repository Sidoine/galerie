using System;
using System.Collections.Generic;

namespace GaleriePhotos.ViewModels
{
    public class SearchResultFullViewModel
    {
        public int NumberOfPhotos { get; set; }
        public DateTime? MinDate { get; set; }
        public DateTime? MaxDate { get; set; }
        public string? CoverPhotoId { get; set; }
        public required string Name { get; set; }
        public List<DateJumpViewModel> DateJumps { get; set; } = new List<DateJumpViewModel>();
    }
}
