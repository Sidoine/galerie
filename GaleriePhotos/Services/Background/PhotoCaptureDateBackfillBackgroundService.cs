using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using GaleriePhotos.Data;
using GaleriePhotos.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Metadata.Profiles.Exif;

namespace GaleriePhotos.Services.Background
{
    public sealed class PhotoCaptureDateBackfillBackgroundService : BackgroundService
    {
        private const string ServiceStateId = "photo-capture-date-backfill";
        private const int BatchSize = 20;
        private static readonly TimeSpan DelayBetweenBatches = TimeSpan.FromSeconds(60);

        private readonly IServiceProvider serviceProvider;
        private readonly ILogger<PhotoCaptureDateBackfillBackgroundService> logger;
        private readonly BackgroundStateService backgroundStateService;
        private readonly DataService dataService;

        public PhotoCaptureDateBackfillBackgroundService(
            IServiceProvider serviceProvider,
            ILogger<PhotoCaptureDateBackfillBackgroundService> logger,
            BackgroundStateService backgroundStateService,
            DataService dataService)
        {
            this.serviceProvider = serviceProvider;
            this.logger = logger;
            this.backgroundStateService = backgroundStateService;
            this.dataService = dataService;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            logger.LogInformation("Photo capture date backfill service started");

            try
            {
                while (!stoppingToken.IsCancellationRequested)
                {
                    var hasMore = await ProcessNextBatchAsync(stoppingToken);
                    if (!hasMore)
                    {
                        break;
                    }

                    await Task.Delay(DelayBetweenBatches, stoppingToken);
                }
            }
            catch (OperationCanceledException)
            {
                // Graceful shutdown
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Unexpected error in photo capture date backfill service");
            }

            logger.LogInformation("Photo capture date backfill service stopped");
        }

        private async Task<bool> ProcessNextBatchAsync(CancellationToken cancellationToken)
        {
            using var scope = serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            var state = await backgroundStateService.GetStateEntityAsync<PhotoCaptureDateBackfillState>(
                context,
                ServiceStateId,
                cancellationToken);

            if (state.Completed)
            {
                return false;
            }

            IQueryable<Photo> query = context.Photos
                .Include(p => p.Directory)
                .ThenInclude(d => d.Gallery);

            if (state.LastProcessedPhotoId.HasValue)
            {
                query = query.Where(p => p.Id > state.LastProcessedPhotoId.Value);
            }

            var photos = await query
                .OrderBy(p => p.Id)
                .Take(BatchSize)
                .ToListAsync(cancellationToken);

            if (!photos.Any())
            {
                state.Completed = true;
                await backgroundStateService.SaveStateAsync(context, ServiceStateId, state, cancellationToken);
                logger.LogInformation("Photo capture date backfill completed");
                return false;
            }

            var providers = new Dictionary<int, IDataProvider>();

            foreach (var photo in photos)
            {
                cancellationToken.ThrowIfCancellationRequested();

                try
                {
                    var didUpdate = await TryUpdateDateFromFileNameAsync(photo, providers, cancellationToken);
                    state.LastProcessedPhotoId = photo.Id;

                    await backgroundStateService.SaveStateAsync(context, ServiceStateId, state, cancellationToken);

                    if (didUpdate)
                    {
                        logger.LogInformation("Updated capture date from filename for photo {PhotoId}", photo.Id);
                    }
                }
                catch (OperationCanceledException)
                {
                    throw;
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Failed to backfill capture date for photo {PhotoId}", photo.Id);
                    state.LastProcessedPhotoId = photo.Id;
                    await backgroundStateService.SaveStateAsync(context, ServiceStateId, state, cancellationToken);
                }
            }

            return true;
        }

        private async Task<bool> TryUpdateDateFromFileNameAsync(Photo photo, IDictionary<int, IDataProvider> providers, CancellationToken cancellationToken)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var hasExifDate = await TryEnsureExifDateAsync(photo, providers, cancellationToken);
            if (hasExifDate)
            {
                return false;
            }

            var inferredDate = PhotoFileNameDateHelper.DeduceCaptureDateFromFileName(photo.FileName);
            if (!inferredDate.HasValue)
            {
                return false;
            }

            if (photo.DateTime == inferredDate.Value)
            {
                return false;
            }

            photo.DateTime = inferredDate.Value;
            return true;
        }

        private async Task<bool> TryEnsureExifDateAsync(Photo photo, IDictionary<int, IDataProvider> providers, CancellationToken cancellationToken)
        {
            cancellationToken.ThrowIfCancellationRequested();
            if (PhotoService.IsVideo(photo))
            {
                return false;
            }

            var provider = GetDataProviderForPhoto(photo, providers);
            await using var stream = await provider.OpenFileRead(photo);
            if (stream == null)
            {
                return false;
            }

            try
            {
                var imageInfo = Image.Identify(stream);
                var exifProfile = imageInfo?.Metadata?.ExifProfile;
                if (exifProfile == null)
                {
                    return false;
                }

                var dateTimeValue = exifProfile.Values.FirstOrDefault(x => x.Tag == ExifTag.DateTime);
                if (dateTimeValue == null)
                {
                    return false;
                }

                if (!DateTime.TryParseExact((string)dateTimeValue.GetValue()!, "yyyy:MM:dd HH:mm:ss", CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
                {
                    return false;
                }

                return true;
            }
            catch (Exception ex)
            {
                logger.LogDebug(ex, "Unable to read EXIF metadata for photo {PhotoId}", photo.Id);
                return false;
            }
        }

        private IDataProvider GetDataProviderForPhoto(Photo photo, IDictionary<int, IDataProvider> providers)
        {
            var galleryId = photo.Directory.GalleryId;
            if (providers.TryGetValue(galleryId, out var provider))
            {
                return provider;
            }

            provider = dataService.GetDataProvider(photo.Directory.Gallery);
            providers[galleryId] = provider;
            return provider;
        }

        private sealed class PhotoCaptureDateBackfillState
        {
            public int? LastProcessedPhotoId { get; set; }

            public bool Completed { get; set; }
        }
    }
}
