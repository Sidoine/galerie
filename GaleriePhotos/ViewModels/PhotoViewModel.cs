using GaleriePhotos.Models;
using GaleriePhotos.Services;
using GaleriePhotos.ViewModels;
using System;

namespace Galerie.Server.ViewModels
{
    public class PhotoViewModel
    {
        public int Id { get; set; }

        public string PublicId { get; set; }
        
        public string Name { get; set; }

        public bool Video { get; set; }

        public int DirectoryId { get; set; }

        public DateTime DateTime { get; set; }

        public PlaceShortViewModel? Place { get; set; }

        public PhotoViewModel(Photo photo)
        {
            (Id, Name, Video, DirectoryId, PublicId, DateTime) = (photo.Id, photo.FileName, PhotoService.IsVideo(photo), photo.DirectoryId, photo.PublicId.ToString(), photo.DateTime);
            Place = photo.PlaceId.HasValue
                ? new PlaceShortViewModel(photo.PlaceId.Value, photo.Place?.Name ?? string.Empty)
                : null;
        }
    }
}
