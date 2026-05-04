using System;

namespace GaleriePhotos.ViewModels
{
    public class BackgroundServicesStateViewModel
    {
        public FaceAutoNamingStateViewModel? FaceAutoNaming { get; set; }

        public PhotoCaptureDateBackfillStateViewModel? PhotoCaptureDateBackfill { get; set; }

        public GalleryScanStateByGalleryViewModel[] GalleryScanByGallery { get; set; } = [];

        public PlaceLocationStateViewModel? PlaceLocation { get; set; }

        public PhotoGpsBackfillStateViewModel? PhotoGpsBackfill { get; set; }
    }

    public class FaceAutoNamingStateViewModel
    {
        public int? LastProcessedFaceId { get; set; }
    }

    public class PhotoCaptureDateBackfillStateViewModel
    {
        public int? LastProcessedPhotoId { get; set; }

        public bool Completed { get; set; }
    }

    public class GalleryScanStateByGalleryViewModel
    {
        public int GalleryId { get; set; }

        public string? GalleryName { get; set; }

        public int? LastScannedDirectoryId { get; set; }

        public DateTime? LastCompletedScanDate { get; set; }
    }

    public class PlaceLocationStateViewModel
    {
        public int? LastProcessedPhotoId { get; set; }
    }

    public class PhotoGpsBackfillStateViewModel
    {
        public int? LastProcessedPhotoId { get; set; }
    }
}