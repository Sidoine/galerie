using GaleriePhotos.Models;

namespace GaleriePhotos.Services
{
    /// <summary>
    /// Service responsible for providing appropriate IDataProvider instances based on Gallery configuration.
    /// Currently returns FileSystemProvider for all galleries, but can be extended to support
    /// different storage backends per gallery (cloud storage, etc.).
    /// </summary>
    public class DataService
    {
        private readonly FileSystemProvider _fileSystemProvider;

        public DataService()
        {
            _fileSystemProvider = new FileSystemProvider();
        }

        /// <summary>
        /// Gets the appropriate data provider for the specified gallery.
        /// </summary>
        /// <param name="gallery">The gallery to get a data provider for.</param>
        /// <returns>An IDataProvider instance for accessing the gallery's data.</returns>
        public IDataProvider GetDataProvider(Gallery gallery)
        {
            // For now, all galleries use the file system provider
            // In the future, this could be extended to support different providers
            // based on gallery configuration (e.g., gallery.StorageType)
            return _fileSystemProvider;
        }

        /// <summary>
        /// Gets the default file system data provider.
        /// Used for operations that don't require a specific gallery context.
        /// </summary>
        /// <returns>The default file system data provider.</returns>
        public IDataProvider GetDefaultDataProvider()
        {
            return _fileSystemProvider;
        }
    }
}