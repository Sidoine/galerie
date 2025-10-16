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

        // Total number of photos where the capture date does not match the date encoded in the file name
        public int PhotosWithFilenameDateMismatchCount { get; set; }

        // Number of albums that contain at least one photo with a capture date different from the file name date
        public int AlbumsWithPhotosWithFilenameDateMismatchCount { get; set; }

        // Aggregated list of albums ordered by descending count of photos with a date mismatch
        public List<AlbumFilenameDateMismatchInfoViewModel> AlbumsWithFilenameDateMismatch { get; set; } = new();
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

    public class AlbumFilenameDateMismatchInfoViewModel
    {
        public int DirectoryId { get; set; }
        public string DirectoryPath { get; set; }
        public int MismatchedPhotoCount { get; set; }
        public int FirstPhotoId { get; set; }

        public AlbumFilenameDateMismatchInfoViewModel(int directoryId, string directoryPath, int mismatchedPhotoCount, int firstPhotoId)
        {
            DirectoryId = directoryId;
            DirectoryPath = directoryPath;
            MismatchedPhotoCount = mismatchedPhotoCount;
            FirstPhotoId = firstPhotoId;
        }
    }
}