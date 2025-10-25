using System;
using System.Collections.Generic;

namespace GaleriePhotos.ViewModels
{
    public class PlaceFullViewModel : PlaceViewModel
    {
        public DateTime MinDate { get; set; }
        public DateTime MaxDate { get; set; }
        public List<DateJumpViewModel> DateJumps { get; set; } = new List<DateJumpViewModel>();
    }
}
