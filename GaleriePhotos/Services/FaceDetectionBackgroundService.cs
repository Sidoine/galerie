using GaleriePhotos.Data;
using GaleriePhotos.Models;
using GaleriePhotos.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace GaleriePhotos.Services
{
    public class FaceDetectionBackgroundService : BackgroundService
    {
        private readonly IServiceProvider serviceProvider;
        private readonly ILogger<FaceDetectionBackgroundService> logger;
        private readonly TimeSpan ProcessingInterval = TimeSpan.FromMinutes(1); // Process every 1 minute

        public FaceDetectionBackgroundService(
            IServiceProvider serviceProvider,
            ILogger<FaceDetectionBackgroundService> logger)
        {
            this.serviceProvider = serviceProvider;
            this.logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            logger.LogInformation("Face Detection Background Service started");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessUnprocessedPhotosAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Error in Face Detection Background Service");
                }

                // Wait for the next processing cycle
                await Task.Delay(ProcessingInterval, stoppingToken);
            }

            logger.LogInformation("Face Detection Background Service stopped");
        }

        private async Task ProcessUnprocessedPhotosAsync(CancellationToken cancellationToken)
        {
            using var scope = serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var faceDetectionService = scope.ServiceProvider.GetRequiredService<FaceDetectionService>();

            try
            {
                // Find photos that haven't been processed for face detection yet
                var unprocessedPhotos = await context.Photos
                    .Where(p => p.FaceDetectionStatus == FaceDetectionStatus.NotStarted)
                    .Include(p => p.Directory)
                    .ThenInclude(x => x.Gallery)
                    .Take(10) // Process 10 photos at a time to avoid overwhelming the system
                    .ToListAsync(cancellationToken);

                if (!unprocessedPhotos.Any())
                {
                    logger.LogDebug("No unprocessed photos found for face detection");
                    return;
                }

                logger.LogInformation("Processing {Count} photos for face detection", unprocessedPhotos.Count);

                foreach (var photo in unprocessedPhotos)
                {
                    if (cancellationToken.IsCancellationRequested)
                        break;

                    try
                    {
                        await faceDetectionService.ProcessPhotoAsync(photo);
                    }
                    catch (Exception ex)
                    {
                        logger.LogError(ex, "Error processing photo {PhotoId} for face detection", photo.Id);
                    }

                    // Small delay between photos to avoid overwhelming the system
                    await Task.Delay(TimeSpan.FromMilliseconds(100), cancellationToken);
                }

                logger.LogInformation("Completed processing batch of {Count} photos", unprocessedPhotos.Count);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error in ProcessUnprocessedPhotosAsync");
            }
        }
    }
}