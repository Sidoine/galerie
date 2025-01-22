using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace GaleriePhotos.Models
{
    public class PhotoDirectory
    {
        public int Id { get; set; }
        public string Path { get; set; }
        public DirectoryVisibility Visibility { get; set; }
        public int? CoverPhotoId { get; set; }

        public PhotoDirectory(string path, DirectoryVisibility visibility, int? coverPhotoId)
        {
            Path = path;
            Visibility = visibility;
            CoverPhotoId = coverPhotoId;
        }
    }
}
