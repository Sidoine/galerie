using System.Collections.Generic;

namespace GaleriePhotos.ViewModels
{
    public class DashboardStatisticsViewModel
    {
        public int PhotosWithoutGpsCount { get; set; }
        public List<PhotoWithoutGpsAlbumInfo> PhotosWithoutGpsAlbums { get; set; } = new();
    }

    public class PhotoWithoutGpsAlbumInfo
    {
        public int PhotoId { get; set; }
        public string PhotoName { get; set; }
        public int DirectoryId { get; set; }
        public string DirectoryName { get; set; }
        public string DirectoryPath { get; set; }
        public int GalleryId { get; set; }
        public string GalleryName { get; set; }

        public PhotoWithoutGpsAlbumInfo(int photoId, string photoName, int directoryId, string directoryName, string directoryPath, int galleryId, string galleryName)
        {
            PhotoId = photoId;
            PhotoName = photoName;
            DirectoryId = directoryId;
            DirectoryName = directoryName;
            DirectoryPath = directoryPath;
            GalleryId = galleryId;
            GalleryName = galleryName;
        }
    }
}