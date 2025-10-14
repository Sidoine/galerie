using System;

namespace GaleriePhotos.ViewModels
{
    public class MonthFullViewModel : MonthViewModel
    {
        public DateTime MinDate { get; set; }
        public DateTime MaxDate { get; set; }
    }
}
