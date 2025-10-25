using Xunit;

namespace GaleriePhotosTest;

/// <summary>
/// Test collection definition for PostgreSQL tests.
/// All test classes that use [Collection("PostgreSQL")] will share the same PostgreSqlTestFixture instance.
/// Tests in this collection run sequentially to avoid database conflicts.
/// </summary>
[CollectionDefinition("PostgreSQL", DisableParallelization = true)]
public class PostgreSqlCollection : ICollectionFixture<PostgreSqlTestFixture>
{
    // This class has no code, and is never created. Its purpose is simply
    // to be the place to apply [CollectionDefinition] and all the
    // ICollectionFixture<> interfaces.
}
