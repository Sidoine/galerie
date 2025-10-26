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
    public class PhotoGpsBackfillBackgroundService : BackgroundService
    {
        private const string ServiceStateId = "photo-gps-backfill";
        private static readonly TimeSpan ProcessingInterval = TimeSpan.FromMinutes(5);
        private static readonly TimeSpan MaxTimeDifference = TimeSpan.FromHours(24);
        private const int BatchSize = 10;

        private readonly IServiceProvider serviceProvider;
        private readonly ILogger<PhotoGpsBackfillBackgroundService> logger;
        private readonly BackgroundStateService stateSerializer;

        public PhotoGpsBackfillBackgroundService(
            IServiceProvider serviceProvider,
            ILogger<PhotoGpsBackfillBackgroundService> logger,
            BackgroundStateService stateSerializer)
        {
            this.serviceProvider = serviceProvider;
            this.logger = logger;
            this.stateSerializer = stateSerializer;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            logger.LogInformation("Photo GPS backfill background service started");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessPhotosWithoutGpsAsync(stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    // Graceful shutdown
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Error in Photo GPS backfill background service");
                }

                await Task.Delay(ProcessingInterval, stoppingToken);
            }

            logger.LogInformation("Photo GPS backfill background service stopped");
        }

        private async Task ProcessPhotosWithoutGpsAsync(CancellationToken cancellationToken)
        {
            using var scope = serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            var state = await stateSerializer.GetStateEntityAsync<PhotoGpsBackfillState>(
                context,
                ServiceStateId,
                cancellationToken);

            var query = context.Photos
                .Where(p => (!p.Latitude.HasValue || !p.Longitude.HasValue || (p.Latitude == 0 && p.Longitude == 0))
                    && p.Directory.PhotoDirectoryType != PhotoDirectoryType.Private
                    && p.Directory.PhotoDirectoryType != PhotoDirectoryType.Trash);

            if (state.LastProcessedPhotoId.HasValue)
            {
                var lastProcessedId = state.LastProcessedPhotoId.Value;
                query = query.Where(p => p.Id > lastProcessedId);
            }

            var photosWithoutGps = await query
                .Include(p => p.Directory)
                .ThenInclude(d => d.Gallery)
                .OrderBy(p => p.Id)
                .Take(BatchSize)
                .ToListAsync(cancellationToken);

            if (!photosWithoutGps.Any())
            {
                logger.LogDebug("No photos without GPS coordinates found");
                return;
            }

            logger.LogInformation("Attempting GPS backfill for {Count} photos", photosWithoutGps.Count);

            foreach (var photo in photosWithoutGps)
            {
                if (cancellationToken.IsCancellationRequested)
                {
                    break;
                }

                try
                {
                    await TryBackfillGpsAsync(context, photo, cancellationToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Failed to backfill GPS position for photo {PhotoId}", photo.Id);
                }

                state.LastProcessedPhotoId = photo.Id;
                await stateSerializer.SaveStateAsync(context, ServiceStateId, state, cancellationToken);

                await Task.Delay(TimeSpan.FromMilliseconds(200), cancellationToken);
            }
        }

        private async Task TryBackfillGpsAsync(ApplicationDbContext context, Photo photo, CancellationToken cancellationToken)
        {
            var galleryId = photo.Directory.GalleryId;
            var minDate = photo.DateTime - MaxTimeDifference;
            var maxDate = photo.DateTime + MaxTimeDifference;

            var candidates = await context.Photos
                .Where(p => p.Id != photo.Id
                    && p.Directory.GalleryId == galleryId
                    && p.Latitude.HasValue && p.Longitude.HasValue
                    && p.Latitude != 0 && p.Longitude != 0
                    && p.DateTime >= minDate && p.DateTime <= maxDate)
                .Select(p => new
                {
                    p.Id,
                    p.Latitude,
                    p.Longitude,
                    p.DateTime
                })
                .ToArrayAsync(cancellationToken);

            if (candidates.Length == 0)
            {
                logger.LogDebug("No GPS candidates found for photo {PhotoId} in gallery {GalleryId}", photo.Id, galleryId);
                return;
            }

            var closest = candidates
                .OrderBy(candidate => (candidate.DateTime - photo.DateTime).Duration())
                .First();

            var timeDifference = (photo.DateTime - closest.DateTime).Duration();

            if (timeDifference > MaxTimeDifference)
            {
                logger.LogDebug(
                    "Closest candidate for photo {PhotoId} exceeds max time difference: {TimeDifference}",
                    photo.Id,
                    timeDifference);
                return;
            }

            photo.Latitude = closest.Latitude;
            photo.Longitude = closest.Longitude;
            context.Photos.Update(photo);
            await context.SaveChangesAsync(cancellationToken);

            logger.LogInformation(
                "Copied GPS data to photo {PhotoId} from candidate {CandidatePhotoId} with time difference {TimeDifference}",
                photo.Id,
                closest.Id,
                timeDifference);
        }

        private sealed class PhotoGpsBackfillState
        {
            public int? LastProcessedPhotoId { get; set; }
        }
    }
}
