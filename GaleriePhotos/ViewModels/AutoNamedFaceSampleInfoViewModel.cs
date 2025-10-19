using System;
namespace GaleriePhotos.ViewModels
{
    /// <summary>
    /// Represents a sample of a face automatically named from another detected face.
    /// </summary>
    public class AutoNamedFaceSampleInfoViewModel
    {
        public int FaceId { get; set; }
        public int AutoNamedFromFaceId { get; set; }

        public AutoNamedFaceSampleInfoViewModel(int faceId, int autoNamedFromFaceId)
        {
            FaceId = faceId;
            AutoNamedFromFaceId = autoNamedFromFaceId;
        }
    }
}