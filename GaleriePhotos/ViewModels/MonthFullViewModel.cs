using System;
using System.Collections.Generic;

namespace GaleriePhotos.ViewModels
{
    public class MonthFullViewModel : MonthViewModel
    {
        public DateTime MinDate { get; set; }
        public DateTime MaxDate { get; set; }
        public List<DateJumpViewModel> DateJumps { get; set; } = new List<DateJumpViewModel>();
    }
}
