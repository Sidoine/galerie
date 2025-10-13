using GaleriePhotos.Data;
using GaleriePhotos.Models;
using Microsoft.EntityFrameworkCore;

namespace GaleriePhotosTest;

// Contexte utilisé uniquement pour les tests InMemory afin d'ignorer les parties spécifiques à PostgreSQL (pgvector)
public class TestApplicationDbContext : ApplicationDbContext
{
    public TestApplicationDbContext(DbContextOptions options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        // Le provider InMemory ne supporte pas pgvector => on ignore l'index et la propriété Embedding
        modelBuilder.Entity<Face>().Ignore(f => f.Embedding);
    }
}
