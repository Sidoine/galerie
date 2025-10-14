using System;
using System.Linq;
using System.Threading.Tasks;
using GaleriePhotos.Data;
using GaleriePhotos.Models;
using Microsoft.EntityFrameworkCore;

namespace GaleriePhotos.Services
{
    /// <summary>
    /// Service utilitaire pour opérations spécifiques aux répertoires (hors logique d'extraction/scan déjà dans PhotoService).
    /// </summary>
    public class DirectoryService
    {
        private readonly ApplicationDbContext dbContext;

        public DirectoryService(ApplicationDbContext dbContext)
        {
            this.dbContext = dbContext;
        }

        /// <summary>
        /// Retourne la date minimale et maximale des photos présentes dans le répertoire.
        /// Charge d'abord les métadonnées en s'assurant que les photos sont synchronisées via PhotoService.
        /// </summary>
        public async Task<(DateTime Min, DateTime Max)> GetPhotoDateRangeAsync(PhotoDirectory directory)
        {
            var query = dbContext.Photos.Where(p => p.DirectoryId == directory.Id);
            if (!await query.AnyAsync()) return (DateTime.MinValue, DateTime.MaxValue);
            var min = await query.MinAsync(p => p.DateTime);
            var max = await query.MaxAsync(p => p.DateTime);
            return (min, max);
        }
    }
}
