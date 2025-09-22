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
            
            // Configure Face entity
            modelBuilder.Entity<Face>(entity =>
            {
                entity.HasKey(e => e.Id);
                
                // Configure the Vector property as a string for now - we'll convert to proper vector later
                entity.Property(e => e.Embedding)
                    .HasConversion(
                        v => VectorToString(v),
                        v => StringToVector(v)
                    )
                    .HasColumnType("text"); // Use text column for now
                
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
            });
            
            // Configure FaceName entity
            modelBuilder.Entity<FaceName>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired();
                entity.HasIndex(e => e.Name).IsUnique();
            });
        }

        private static string VectorToString(Vector vector)
        {
            return string.Join(",", vector.Memory.Span.ToArray().Select(f => f.ToString(System.Globalization.CultureInfo.InvariantCulture)));
        }

        private static Vector StringToVector(string value)
        {
            return new Vector(value.Split(',').Select(s => float.Parse(s, System.Globalization.CultureInfo.InvariantCulture)).ToArray());
        }
    }
}
