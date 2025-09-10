using Folke.CsTsService.Optional;
using GaleriePhotos.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace GaleriePhotos.ViewModels
{
    public class UserPatchViewModel
    {
        public Optional<bool> Administrator { get; set; }

        // Note: DirectoryVisibility is now managed per-gallery through GalleryMember
        // Use the GalleryMember endpoints to manage gallery-specific permissions
    }
}
