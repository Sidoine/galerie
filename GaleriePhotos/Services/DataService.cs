using GaleriePhotos.Models;
using System;
using System.Collections.Concurrent;

namespace GaleriePhotos.Services
{
    /// <summary>
    /// Service responsible for providing appropriate IDataProvider instances based on Gallery configuration.
    /// Returns FileSystemProvider or SeafileDataProvider based on gallery's DataProvider setting.
    /// </summary>
    public class DataService : IDisposable
    {
        private readonly FileSystemProvider _fileSystemProvider;
        private readonly ConcurrentDictionary<string, SeafileDataProvider> _seafileProviders;

        public DataService()
        {
            _fileSystemProvider = new FileSystemProvider();
            _seafileProviders = new ConcurrentDictionary<string, SeafileDataProvider>();
        }

        /// <summary>
        /// Gets the appropriate data provider for the specified gallery.
        /// </summary>
        /// <param name="gallery">The gallery to get a data provider for.</param>
        /// <returns>An IDataProvider instance for accessing the gallery's data.</returns>
        public IDataProvider GetDataProvider(Gallery gallery)
        {
            return gallery.DataProvider switch
            {
                DataProviderType.FileSystem => _fileSystemProvider,
                DataProviderType.Seafile => GetSeafileProvider(gallery),
                _ => throw new NotSupportedException($"Data provider type {gallery.DataProvider} is not supported")
            };
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

        /// <summary>
        /// Gets or creates a Seafile data provider for the specified gallery.
        /// Providers are cached by server URL and API key combination.
        /// </summary>
        private SeafileDataProvider GetSeafileProvider(Gallery gallery)
        {
            if (string.IsNullOrEmpty(gallery.SeafileServerUrl) || string.IsNullOrEmpty(gallery.SeafileApiKey))
            {
                throw new InvalidOperationException("Seafile server URL and API key must be configured for Seafile galleries");
            }

            var key = $"{gallery.SeafileServerUrl}|{gallery.SeafileApiKey}";
            return _seafileProviders.GetOrAdd(key, _ => new SeafileDataProvider(gallery.SeafileServerUrl, gallery.SeafileApiKey));
        }

        public void Dispose()
        {
            foreach (var provider in _seafileProviders.Values)
            {
                provider.Dispose();
            }
            _seafileProviders.Clear();
        }
    }
}