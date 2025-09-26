using GaleriePhotos.Models;
using GaleriePhotos.Services;
using System;

namespace Galerie.Server.ViewModels
{
    public class PhotoFullViewModel
    {
        public int Id { get; set; } // Conservé pour compat rétro éventuelle
        public Guid PublicId { get; set; }
        public string Name { get; set; }
        public int? NextId { get; set; }
        public int? PreviousId { get; set; }
        public DateTime? DateTime { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public string? Camera { get; set; }
        public bool Video { get; set; }
        public bool Private { get; set; }
        public FaceDetectionStatus FaceDetectionStatus { get; set; }
        public int DirectoryId { get; set; }

        public PhotoFullViewModel(Photo photo, Photo? previous, Photo? next, bool @private) =>
            (Id, PublicId, Name, NextId, PreviousId, DateTime, Latitude, Longitude, Camera, Video, Private, FaceDetectionStatus, DirectoryId) =
            (photo.Id, photo.PublicId, photo.FileName, next?.Id, previous?.Id, photo.DateTime, photo.Latitude, photo.Longitude, photo.Camera, PhotoService.IsVideo(photo), @private, photo.FaceDetectionStatus, photo.DirectoryId);
    }
}
