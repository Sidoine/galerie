using System;
using System.Collections.Generic;

namespace GaleriePhotos.ViewModels
{
    public class GalleryFullViewModel : GalleryViewModel
    {
        public DateTime MinDate { get; set; }
        public DateTime MaxDate { get; set; }
        public bool IsAdministrator { get; set; }
        public List<DateJumpViewModel> DateJumps { get; set; } = new List<DateJumpViewModel>();
    }
}