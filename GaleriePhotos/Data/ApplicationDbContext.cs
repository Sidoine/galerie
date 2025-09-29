using GaleriePhotos.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Pgvector;
using System.Linq;

namespace GaleriePhotos.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public DbSet<Photo> Photos { get; set; } = null!;
        public DbSet<PhotoDirectory> PhotoDirectories { get; set; } = null!;
        public DbSet<Gallery> Galleries { get; set; } = null!;
        public DbSet<GalleryMember> GalleryMembers { get; set; } = null!;
        public DbSet<GalleryDirectoryVisibility> GalleryDirectoryVisibilities { get; set; } = null!;
        public DbSet<Face> Faces { get; set; } = null!;
        public DbSet<FaceName> FaceNames { get; set; } = null!;

        public ApplicationDbContext(
            DbContextOptions options) : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            // Configure pgvector extension
            modelBuilder.HasPostgresExtension("vector");

            modelBuilder.Entity<Photo>(entity =>
            {
                entity.HasIndex(e => new { e.DirectoryId, e.FileName }).IsUnique();
                entity.HasIndex(x => x.DirectoryId);
            });

            modelBuilder.Entity<PhotoDirectory>(entity =>
            {
                entity.HasIndex(e => new { e.GalleryId, e.Path }).IsUnique();
                entity.HasIndex(x => x.GalleryId);
                entity.HasOne(e => e.CoverPhoto)
                    .WithMany()
                    .HasForeignKey(e => e.CoverPhotoId)
                    .OnDelete(DeleteBehavior.SetNull);
            });
            
            // Configure Face entity
            modelBuilder.Entity<Face>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.HasOne(e => e.Photo)
                    .WithMany()
                    .HasForeignKey(e => e.PhotoId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.FaceName)
                    .WithMany(fn => fn.Faces)
                    .HasForeignKey(e => e.FaceNameId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasIndex(e => e.PhotoId);
                entity.HasIndex(e => e.FaceNameId);
                entity.HasIndex(x => x.Embedding).HasMethod("ivfflat").HasOperators("vector_l2_ops");
            });
            
            // Configure FaceName entity
            modelBuilder.Entity<FaceName>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired();
                entity.HasIndex(e => e.Name).IsUnique();
            });
        }
    }
}
