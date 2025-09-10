using GaleriePhotos.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace GaleriePhotos.ViewModels
{
    public class UserViewModel
    {
        public string Id { get; set; }

        public string Name { get; set; }

        public bool Administrator { get; set; }

        // Note: DirectoryVisibility is now managed per-gallery through GalleryMember
        // Use the GalleryMember endpoints to manage gallery-specific permissions

        public UserViewModel(ApplicationUser applicationUser, Microsoft.AspNetCore.Identity.IdentityUserClaim<string>[] identityUserClaim)
        {
            Id = applicationUser.Id;
            Name = applicationUser.UserName ?? "Unknown";
            Administrator = (identityUserClaim.Any(x => x.ClaimType == Claims.Administrator));
        }        
    }
}
