using GaleriePhotos.Data;
using Microsoft.EntityFrameworkCore;
using Testcontainers.PostgreSql;
using Xunit;

namespace GaleriePhotosTest;

/// <summary>
/// Shared fixture for PostgreSQL tests using Testcontainers.
/// This fixture starts a PostgreSQL container with pgvector extension once per test collection.
/// </summary>
public class PostgreSqlTestFixture : IAsyncLifetime
{
    private PostgreSqlContainer? _postgreSqlContainer;
    
    public string ConnectionString { get; private set; } = string.Empty;

    public async Task InitializeAsync()
    {
        // Create and start PostgreSQL container with pgvector extension
        _postgreSqlContainer = new PostgreSqlBuilder()
            .WithImage("pgvector/pgvector:pg17")
            .WithCleanUp(true)
            .Build();

        await _postgreSqlContainer.StartAsync();
        
        ConnectionString = _postgreSqlContainer.GetConnectionString();
        
        // Create the vector extension in the database
        await CreateVectorExtensionAsync();
    }

    public async Task DisposeAsync()
    {
        if (_postgreSqlContainer != null)
        {
            await _postgreSqlContainer.DisposeAsync();
        }
    }

    /// <summary>
    /// Creates a new database context connected to the test PostgreSQL container.
    /// Each context should be disposed after use.
    /// </summary>
    public ApplicationDbContext CreateDbContext()
    {
        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseNpgsql(ConnectionString, options => options.UseVector());

        return new ApplicationDbContext(optionsBuilder.Options);
    }

    /// <summary>
    /// Creates a database context and starts a transaction for isolated testing.
    /// The transaction is not committed, providing automatic rollback on disposal.
    /// </summary>
    public async Task<(ApplicationDbContext context, Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction transaction)> CreateDbContextWithTransactionAsync()
    {
        var context = CreateDbContext();
        var transaction = await context.Database.BeginTransactionAsync();
        return (context, transaction);
    }

    private async Task CreateVectorExtensionAsync()
    {
        using var context = CreateDbContext();
        await context.Database.EnsureCreatedAsync();
    }
}
