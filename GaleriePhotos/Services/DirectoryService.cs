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
        private readonly DataService dataService;

        public DirectoryService(ApplicationDbContext dbContext, DataService dataService)
        {
            this.dbContext = dbContext;
            this.dataService = dataService;
        }

        /// <summary>
        /// Retourne la date minimale et maximale des photos présentes dans le répertoire.
        /// Charge d'abord les métadonnées en s'assurant que les photos sont synchronisées via PhotoService.
        /// </summary>
        public async Task<(DateTime Min, DateTime Max)> GetPhotoDateRangeAsync(PhotoDirectory directory)
        {
            var query = dbContext.Photos.Where(p => p.DirectoryId == directory.Id);
            if (!await query.AnyAsync()) return (DateTime.UtcNow, DateTime.UtcNow);
            var min = await query.MinAsync(p => p.DateTime);
            var max = await query.MaxAsync(p => p.DateTime);
            return (min, max);
        }

        /// <summary>
        /// Renames a directory in the file system and updates the database.
        /// </summary>
        /// <param name="directory">The directory to rename.</param>
        /// <param name="newName">The new name for the directory.</param>
        public async Task RenameDirectoryAsync(PhotoDirectory directory, string newName)
        {
            var dataProvider = dataService.GetDataProvider(directory.Gallery);
            
            // Rename in the file system
            await dataProvider.RenameDirectory(directory, newName);
            
            // Update the path in the database
            var oldPath = directory.Path;
            var parentPath = System.IO.Path.GetDirectoryName(oldPath);
            var newPath = string.IsNullOrEmpty(parentPath) 
                ? newName 
                : System.IO.Path.Combine(parentPath, newName);
            
            directory.Path = newPath;
            
            // Update all child directories' paths recursively
            await UpdateChildDirectoriesPathsAsync(directory, oldPath, newPath);
            
            await dbContext.SaveChangesAsync();
        }

        private async Task UpdateChildDirectoriesPathsAsync(PhotoDirectory directory, string oldBasePath, string newBasePath)
        {
            var childDirectories = await dbContext.PhotoDirectories
                .Where(d => d.ParentDirectoryId == directory.Id)
                .ToListAsync();
            
            foreach (var child in childDirectories)
            {
                var oldChildPath = child.Path;
                // Replace only at the beginning of the path
                if (child.Path.StartsWith(oldBasePath))
                {
                    child.Path = newBasePath + child.Path.Substring(oldBasePath.Length);
                }
                await UpdateChildDirectoriesPathsAsync(child, oldChildPath, child.Path);
            }
        }
    }
}
