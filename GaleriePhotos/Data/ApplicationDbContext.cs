using GaleriePhotos.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace GaleriePhotos.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public DbSet<Photo> Photos { get; set; } = null!;
        public DbSet<PhotoDirectory> PhotoDirectories { get; set; } = null!;
        public DbSet<Gallery> Galleries { get; set; } = null!;
        public DbSet<GalleryMember> GalleryMembers { get; set; } = null!;
        public DbSet<GalleryDirectoryVisibility> GalleryDirectoryVisibilities { get; set; } = null!;

        public ApplicationDbContext(
            DbContextOptions options) : base(options)
        {
        }
    }
}
