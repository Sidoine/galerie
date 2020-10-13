using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace GaleriePhotos.Models
{
    public class Photo
    {
        public int Id { get; set; }
        public string FileName { get; set; }
        public bool Visible { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public string? Camera { get; set; }
        public DateTime DateTime { get; set; }
        public bool Video { get; set; }

        public Photo(string fileName)
        {
            FileName = fileName;
        }
    }
}
