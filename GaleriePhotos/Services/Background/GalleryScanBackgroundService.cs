using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using GaleriePhotos.Data;
using GaleriePhotos.Models;

namespace GaleriePhotos.Services.Background
{
    /// <summary>
    /// Background service that incrementally scans directories of each gallery
    /// and populates database with sub-directories and photos metadata.
    /// It remembers the last scanned directory per gallery to resume work.
    /// </summary>
    public class GalleryScanBackgroundService : BackgroundService
    {
        private const string ServiceKey = "gallery-scan";

        private readonly IServiceProvider serviceProvider;
        private readonly ILogger<GalleryScanBackgroundService> logger;
        private readonly BackgroundStateService stateSerializer;
        private readonly TimeSpan interval = TimeSpan.FromMinutes(2);

        public GalleryScanBackgroundService(IServiceProvider serviceProvider, ILogger<GalleryScanBackgroundService> logger, BackgroundStateService stateSerializer)
        {
            this.serviceProvider = serviceProvider;
            this.logger = logger;
            this.stateSerializer = stateSerializer;
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

        private async Task ScanStepAsync(CancellationToken cancellationToken)
        {
            using var scope = serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var photoService = scope.ServiceProvider.GetRequiredService<PhotoService>();

            var galleries = await db.Galleries
                .ToListAsync(cancellationToken);

            var stateMap = await stateSerializer.GetStateEntityAsync<Dictionary<int, GalleryScanState>>(
                db,
                ServiceKey,
                cancellationToken);

            foreach (var gallery in galleries)
            {
                if (cancellationToken.IsCancellationRequested) break;

                var lastScannedDirectoryId = GetLastScannedDirectoryId(stateMap, gallery.Id);

                // Get next directory id for this gallery
                var query = db.PhotoDirectories
                    .Where(d => d.GalleryId == gallery.Id)
                    .OrderBy(d => d.Id);
                if (lastScannedDirectoryId.HasValue)
                {
                    query = query.Where(d => d.Id > lastScannedDirectoryId.Value) as IOrderedQueryable<PhotoDirectory> ?? query.OrderBy(d => d.Id);
                }

                var nextDirectory = await query.FirstOrDefaultAsync(cancellationToken);
                if (nextDirectory == null)
                {
                    // No more directories to scan in this gallery
                    continue;
                }

                logger.LogInformation("Scanning directory {DirectoryId} ({Path}) for gallery {GalleryId}", nextDirectory.Id, nextDirectory.Path, gallery.Id);
                try
                {
                    await photoService.ScanDirectory(nextDirectory);

                    stateMap[gallery.Id] = new GalleryScanState
                    {
                        LastScannedDirectoryId = nextDirectory.Id,
                    };

                    await stateSerializer.SaveStateAsync(db, ServiceKey, stateMap, cancellationToken);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Error scanning directory {DirectoryId} in gallery {GalleryId}", nextDirectory.Id, gallery.Id);
                }
                // Small delay between directories to avoid I/O bursts
                await Task.Delay(200, cancellationToken);
            }
        }

        private static int? GetLastScannedDirectoryId(Dictionary<int, GalleryScanState> stateMap, int galleryId)
        {
            return stateMap.TryGetValue(galleryId, out var state)
                ? state?.LastScannedDirectoryId
                : null;
        }

        private sealed class GalleryScanState
        {
            public int? LastScannedDirectoryId { get; set; }
        }
    }
}
