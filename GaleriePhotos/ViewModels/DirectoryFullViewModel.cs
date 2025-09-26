using GaleriePhotos.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace GaleriePhotos.ViewModels
{
    public class DirectoryFullViewModel : DirectoryViewModel
    {
        public DirectoryViewModel? Parent { get; set; }

        public DirectoryFullViewModel(PhotoDirectory photoDirectory, Photo? coverPhoto, PhotoDirectory? parentDirectory, int numberOfPhotos, int numberOfSubDirectories) : base(photoDirectory, coverPhoto, numberOfPhotos, numberOfSubDirectories)
        {
            if (parentDirectory != null) Parent = new DirectoryViewModel(parentDirectory, coverPhoto, 0, 0);
        }
    }
}
