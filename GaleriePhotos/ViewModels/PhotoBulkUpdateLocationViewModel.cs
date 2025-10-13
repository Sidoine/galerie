namespace GaleriePhotos.ViewModels
{
    public class PhotoBulkUpdateLocationViewModel
    {
        public int[] PhotoIds { get; set; } = []; // liste d'IDs de photos à mettre à jour
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        // Si true (défaut): on écrase toujours les coordonnées existantes.
        // Si false: on ne modifie que les photos n'ayant pas encore de latitude/longitude définies.
        public bool OverwriteExisting { get; set; } = true;
    }
}
