using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace GaleriePhotos.Models
{
    public class ApplicationUser : IdentityUser
    {
        // Navigation properties
        public ICollection<GalleryMember> GalleryMemberships { get; set; } = new List<GalleryMember>();
    }
}
