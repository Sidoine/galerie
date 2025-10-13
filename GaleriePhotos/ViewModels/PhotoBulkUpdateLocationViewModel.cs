namespace GaleriePhotos.ViewModels
{
    public class PhotoBulkUpdateLocationViewModel
    {
        public int[] PhotoIds { get; set; } = []; // liste d'IDs de photos à mettre à jour
        public double Latitude { get; set; }
        public double Longitude { get; set; }
    }
}
