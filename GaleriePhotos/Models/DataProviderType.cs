namespace GaleriePhotos.Models
{
    /// <summary>
    /// Defines the available data provider types for galleries.
    /// </summary>
    public enum DataProviderType
    {
        /// <summary>
        /// Local file system storage provider.
        /// </summary>
        FileSystem = 0,

        /// <summary>
        /// Seafile cloud storage provider.
        /// </summary>
        Seafile = 1
    }
}