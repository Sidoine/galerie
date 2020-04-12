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

        public DirectoryVisibility DirectoryVisibility { get; set; }

        public UserViewModel(ApplicationUser applicationUser, Microsoft.AspNetCore.Identity.IdentityUserClaim<string>[] identityUserClaim)
        {
            Id = applicationUser.Id;
            Name = applicationUser.UserName;
            Administrator = (identityUserClaim.Any(x => x.ClaimType == Claims.Administrator));
            var claimValue = identityUserClaim.FirstOrDefault(x => x.ClaimType == Claims.Visibility)?.ClaimValue;
            DirectoryVisibility = claimValue != null ? Enum.Parse<DirectoryVisibility>(claimValue) : DirectoryVisibility.None;
        }        
    }
}
