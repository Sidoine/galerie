using System.IO;
using GaleriePhotos.Models;

namespace GaleriePhotos.Services
{
    public abstract class AbstractDataProvider
    {

        protected string GetThumbnailFileName(Photo photo)
        {
            return Path.ChangeExtension(photo.FileName, "jpg");
        }
    }
}