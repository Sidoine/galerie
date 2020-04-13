using GaleriePhotos.Models;
using System;

namespace Galerie.Server.ViewModels
{
    public class PhotoFullViewModel
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int? NextId { get; set; }
        public int? PreviousId { get; set; }
        public DateTime? DateTime { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public string? Camera { get; set; }

        public PhotoFullViewModel(Photo photo, Photo? previous, Photo? next) =>
            (Id, Name, NextId, PreviousId, DateTime, Latitude, Longitude, Camera) = (photo.Id, photo.FileName, next?.Id, previous?.Id, photo.DateTime, photo.Latitude, photo.Longitude, photo.Camera);
    }
}
