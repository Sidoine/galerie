using System;

namespace GaleriePhotos.Models
{
    [Flags]
    public enum DirectoryVisibility
    {
        None = 0,
        Mylene = 1,
        Sidoine = 2,
        SidoineEtMylene = 3
    }
}
