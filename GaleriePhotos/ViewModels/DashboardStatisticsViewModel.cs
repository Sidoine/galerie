using System.Collections.Generic;

namespace GaleriePhotos.ViewModels
{
    public class DashboardStatisticsViewModel
    {
        // Total number of photos in the gallery without GPS
        public int PhotosWithoutGpsCount { get; set; }

        // Number of distinct albums (directories) that contain at least one photo without GPS
        public int AlbumsWithPhotosWithoutGpsCount { get; set; }

        // Aggregated list of albums ordered by descending count of missing GPS photos
        public List<AlbumWithoutGpsInfoViewModel> AlbumsWithoutGps { get; set; } = new();
    }

    public class AlbumWithoutGpsInfoViewModel
    {
        public int DirectoryId { get; set; }
        public string DirectoryPath { get; set; }
        public int MissingGpsPhotoCount { get; set; }

        public AlbumWithoutGpsInfoViewModel(int directoryId, string directoryPath, int missingGpsPhotoCount)
        {
            DirectoryId = directoryId;
            DirectoryPath = directoryPath;
            MissingGpsPhotoCount = missingGpsPhotoCount;
        }
    }
}