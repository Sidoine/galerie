using GaleriePhotos.Data;
using GaleriePhotos.Models;
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
    public class PlaceLocationBackgroundService : BackgroundService
    {
        private readonly IServiceProvider serviceProvider;
        private readonly ILogger<PlaceLocationBackgroundService> logger;
        private readonly TimeSpan ProcessingInterval = TimeSpan.FromMinutes(5); // Process every 5 minutes

        public PlaceLocationBackgroundService(
            IServiceProvider serviceProvider,
            ILogger<PlaceLocationBackgroundService> logger)
        {
            this.serviceProvider = serviceProvider;
            this.logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            logger.LogInformation("Place Location Background Service started");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessPhotosWithoutPlaceAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Error in Place Location Background Service");
                }

                // Wait for the next processing cycle
                await Task.Delay(ProcessingInterval, stoppingToken);
            }

            logger.LogInformation("Place Location Background Service stopped");
        }

        private async Task ProcessPhotosWithoutPlaceAsync(CancellationToken cancellationToken)
        {
            using var scope = serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var placeService = scope.ServiceProvider.GetRequiredService<PlaceService>();

            try
            {
                // Find photos that have GPS location but no place assigned
                var photosWithoutPlace = await context.Photos
                    .Where(p => p.Latitude.HasValue && p.Longitude.HasValue && (p.Latitude != 0 || p.Longitude != 0) && p.PlaceId == null && p.Directory.PhotoDirectoryType != PhotoDirectoryType.Private
                        && p.Directory.PhotoDirectoryType != PhotoDirectoryType.Trash)
                    .Include(p => p.Directory)
                    .ThenInclude(d => d.Gallery)
                    .OrderBy(x => x.Id)
                    .Take(10) // Process 10 photos at a time to avoid overwhelming the system
                    .ToListAsync(cancellationToken);

                if (!photosWithoutPlace.Any())
                {
                    logger.LogDebug("No photos without places found");
                    return;
                }

                logger.LogInformation("Processing {Count} photos for place location", photosWithoutPlace.Count);

                foreach (var photo in photosWithoutPlace)
                {
                    if (cancellationToken.IsCancellationRequested)
                        break;

                    try
                    {
                        if (photo.Latitude.HasValue && photo.Longitude.HasValue)
                        {
                            logger.LogDebug("Processing photo {PhotoId} with GPS coordinates {Latitude}, {Longitude}", 
                                photo.Id, photo.Latitude.Value, photo.Longitude.Value);

                            var place = await placeService.GetNearestPlaceAsync(
                                photo.Latitude.Value, 
                                photo.Longitude.Value, 
                                photo.Directory.GalleryId);

                            if (place != null)
                            {
                                photo.PlaceId = place.Id;
                                await context.SaveChangesAsync(cancellationToken);
                                logger.LogInformation("Assigned photo {PhotoId} to place {PlaceName}", photo.Id, place.Name);
                            }
                            else
                            {
                                logger.LogWarning("Could not find or create place for photo {PhotoId} at coordinates {Latitude}, {Longitude}", 
                                    photo.Id, photo.Latitude.Value, photo.Longitude.Value);
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        logger.LogError(ex, "Error processing photo {PhotoId} for place location", photo.Id);
                    }

                    // Small delay between photos to be respectful to OpenStreetMap API
                    await Task.Delay(TimeSpan.FromSeconds(1), cancellationToken);
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error in ProcessPhotosWithoutPlaceAsync");
            }
        }
    }
}