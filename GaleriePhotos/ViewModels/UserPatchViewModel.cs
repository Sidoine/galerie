using Folke.CsTsService.Optional;
using GaleriePhotos.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace GaleriePhotos.ViewModels
{
    public class UserPatchViewModel
    {
        public Optional<bool> Administrator { get; set; }

        public Optional<DirectoryVisibility> DirectoryVisibility { get; set; }
    }
}
