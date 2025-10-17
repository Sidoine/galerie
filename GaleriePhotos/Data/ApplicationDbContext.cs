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
        public DbSet<Place> Places { get; set; } = null!;
    public DbSet<BackgroundServiceState> BackgroundServiceStates { get; set; } = null!;

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
                entity.HasIndex(x => x.PlaceId).IsUnique(false);
                entity.HasIndex(x => x.DateTime);
                entity.HasIndex(x => new { x.DateTime, x.PlaceId });
                
                entity.HasOne(e => e.Place)
                    .WithMany()
                    .HasForeignKey(e => e.PlaceId)
                    .OnDelete(DeleteBehavior.SetNull);
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
            
            modelBuilder.Entity<BackgroundServiceState>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasMaxLength(128);
                entity.Property(e => e.State).HasColumnType("jsonb");
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
                entity.HasIndex(x => x.Embedding)
                .HasMethod("ivfflat")
                .HasOperators("vector_l2_ops");
            });
            
            // Configure FaceName entity
            modelBuilder.Entity<FaceName>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired();
                entity.HasIndex(e => new { e.GalleryId, e.Name }).IsUnique();
            });
            
            // Configure Place entity
            modelBuilder.Entity<Place>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired();
                entity.HasIndex(e => e.GalleryId);
                entity.HasIndex(e => new { e.GalleryId, e.Name });
                entity.HasIndex(e => new { e.GalleryId, e.OsmPlaceId });
                entity.HasIndex(e => new { e.GalleryId, e.OsmType, e.OsmId });
                entity.HasIndex(e => e.ParentId);
                entity.HasIndex(e => e.Type);
                entity.HasIndex(e => e.CoverPhotoId);
                
                entity.HasOne(e => e.Gallery)
                    .WithMany()
                    .HasForeignKey(e => e.GalleryId)
                    .OnDelete(DeleteBehavior.Cascade);
                    
                // Self-referencing relationship for parent-child hierarchy
                entity.HasOne(e => e.Parent)
                    .WithMany(e => e.Children)
                    .HasForeignKey(e => e.ParentId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.CoverPhoto)
                    .WithMany()
                    .HasForeignKey(e => e.CoverPhotoId)
                    .OnDelete(DeleteBehavior.SetNull);
            });
        }
    }
}
