using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using GaleriePhotos.Data;
using GaleriePhotos.Models;

namespace GaleriePhotos.Services
{
    /// <summary>
    /// Background service that incrementally scans directories of each gallery
    /// and populates database with sub-directories and photos metadata.
    /// It remembers the last scanned directory per gallery to resume work.
    /// </summary>
    public class GalleryScanBackgroundService : BackgroundService
    {
        private readonly IServiceProvider serviceProvider;
        private readonly ILogger<GalleryScanBackgroundService> logger;
        private readonly TimeSpan interval = TimeSpan.FromMinutes(2);

        public GalleryScanBackgroundService(IServiceProvider serviceProvider, ILogger<GalleryScanBackgroundService> logger)
        {
            this.serviceProvider = serviceProvider;
            this.logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            logger.LogInformation("Gallery scan background service started");
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ScanStepAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Error while scanning galleries");
                }
                await Task.Delay(interval, stoppingToken);
            }
            logger.LogInformation("Gallery scan background service stopped");
        }

        private async Task ScanStepAsync(CancellationToken ct)
        {
            using var scope = serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var photoService = scope.ServiceProvider.GetRequiredService<PhotoService>();

            var galleries = await db.Galleries
                .Include(g => g.LastScannedDirectory)
                .ToListAsync(ct);

            foreach (var gallery in galleries)
            {
                if (ct.IsCancellationRequested) break;

                // Get next directory id for this gallery
                var query = db.PhotoDirectories
                    .Where(d => d.GalleryId == gallery.Id)
                    .OrderBy(d => d.Id);
                if (gallery.LastScannedDirectoryId.HasValue)
                {
                    query = query.Where(d => d.Id > gallery.LastScannedDirectoryId.Value) as IOrderedQueryable<PhotoDirectory> ?? query.OrderBy(d => d.Id);
                }

                var nextDirectory = await query.FirstOrDefaultAsync(ct);
                if (nextDirectory == null)
                {
                    // No more directories to scan in this gallery
                    continue;
                }

                logger.LogInformation("Scanning directory {DirectoryId} ({Path}) for gallery {GalleryId}", nextDirectory.Id, nextDirectory.Path, gallery.Id);
                try
                {
                    // Enumerate to populate DB
                    await photoService.GetSubDirectories(nextDirectory);
                    await photoService.GetDirectoryImages(nextDirectory);
                    gallery.LastScannedDirectoryId = nextDirectory.Id;
                    await db.SaveChangesAsync(ct);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Error scanning directory {DirectoryId} in gallery {GalleryId}", nextDirectory.Id, gallery.Id);
                }
                // Small delay between directories to avoid I/O bursts
                await Task.Delay(200, ct);
            }
        }
    }
}
