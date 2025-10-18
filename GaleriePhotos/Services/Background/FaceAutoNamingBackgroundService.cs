using GaleriePhotos.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace GaleriePhotos.Services.Background
{
    public class FaceAutoNamingBackgroundService : BackgroundService
    {
        private readonly IServiceProvider serviceProvider;
        private readonly ILogger<FaceAutoNamingBackgroundService> logger;
        private readonly TimeSpan ProcessingInterval = TimeSpan.FromMinutes(5); // Process every 5 minutes
        private const float DefaultThreshold = 0.6f; // L2 distance threshold for face similarity

        public FaceAutoNamingBackgroundService(
            IServiceProvider serviceProvider,
            ILogger<FaceAutoNamingBackgroundService> logger)
        {
            this.serviceProvider = serviceProvider;
            this.logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            logger.LogInformation("Face Auto-Naming Background Service started");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessUnnamedFacesAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Error in Face Auto-Naming Background Service");
                }

                // Wait for the next processing cycle
                await Task.Delay(ProcessingInterval, stoppingToken);
            }

            logger.LogInformation("Face Auto-Naming Background Service stopped");
        }

        private async Task ProcessUnnamedFacesAsync(CancellationToken cancellationToken)
        {
            using var scope = serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var faceDetectionService = scope.ServiceProvider.GetRequiredService<FaceDetectionService>();

            try
            {
                // Get all galleries that have both named and unnamed faces
                var galleriesWithFaces = await context.Galleries
                    .Where(g => context.Faces
                        .Any(f => f.Photo.Directory.GalleryId == g.Id && f.FaceNameId == null) &&
                        context.Faces
                        .Any(f => f.Photo.Directory.GalleryId == g.Id && f.FaceNameId != null))
                    .ToListAsync(cancellationToken);

                if (!galleriesWithFaces.Any())
                {
                    logger.LogDebug("No galleries found with both named and unnamed faces");
                    return;
                }

                logger.LogInformation("Processing face auto-naming for {Count} galleries", galleriesWithFaces.Count);

                foreach (var gallery in galleriesWithFaces)
                {
                    if (cancellationToken.IsCancellationRequested)
                        break;

                    try
                    {
                        var namedCount = await faceDetectionService.AutoNameSimilarFacesAsync(
                            gallery.Id, 
                            DefaultThreshold, 
                            batchSize: 10);

                        if (namedCount > 0)
                        {
                            logger.LogInformation("Auto-named {Count} faces in gallery {GalleryId} ({GalleryName})", 
                                namedCount, gallery.Id, gallery.Name);
                        }
                    }
                    catch (Exception ex)
                    {
                        logger.LogError(ex, "Error processing gallery {GalleryId} for face auto-naming", gallery.Id);
                    }

                    // Small delay between galleries to avoid overwhelming the system
                    await Task.Delay(TimeSpan.FromMilliseconds(500), cancellationToken);
                }

                logger.LogInformation("Completed face auto-naming cycle for {Count} galleries", galleriesWithFaces.Count);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error in ProcessUnnamedFacesAsync");
            }
        }
    }
}
