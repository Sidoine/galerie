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
        private readonly ConcurrentDictionary<Gallery, SeafileDataProvider> _seafileProviders;

        public DataService()
        {
            _seafileProviders = new ConcurrentDictionary<Gallery, SeafileDataProvider>();
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
                DataProviderType.FileSystem => new FileSystemProvider(gallery),
                DataProviderType.Seafile => GetSeafileProvider(gallery),
                _ => throw new NotSupportedException($"Data provider type {gallery.DataProvider} is not supported")
            };
        }

        /// <summary>
        /// Gets or creates a Seafile data provider for the specified gallery.
        /// Providers are cached by server URL and API key combination.
        /// </summary>
        private SeafileDataProvider GetSeafileProvider(Gallery gallery)
        {
            return _seafileProviders.GetOrAdd(gallery, _ => new SeafileDataProvider(gallery));
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