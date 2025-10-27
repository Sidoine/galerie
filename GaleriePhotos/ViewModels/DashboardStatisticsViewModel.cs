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

        // Total number of faces automatically named from other detected faces
        public int AutoNamedFacesCount { get; set; }
        // Sample of face pairs where AutoNamedFromFace is set
        public List<AutoNamedFaceSampleInfoViewModel> AutoNamedFaceSamples { get; set; } = new();
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

    public class GpsBackfillProgressViewModel
    {
        public int TotalPhotosWithoutGps { get; set; }
        public int ProcessedCount { get; set; }
        public int LastProcessedPhotoId { get; set; }
    }

}