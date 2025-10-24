using System;

namespace GaleriePhotos.ViewModels
{
    public class GalleryFullViewModel : GalleryViewModel
    {
        public DateTime MinDate { get; set; }
        public DateTime MaxDate { get; set; }
        public bool IsAdministrator { get; set; }
    }
}