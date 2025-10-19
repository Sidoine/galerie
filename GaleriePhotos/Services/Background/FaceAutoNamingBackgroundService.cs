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
        private readonly BackgroundStateService backgroundStateService;
        private readonly TimeSpan ProcessingInterval = TimeSpan.FromMinutes(5); // Process every 5 minutes
        private const float DefaultThreshold = 0.6f; // L2 distance threshold for face similarity
        private const string ServiceStateId = "face-auto-naming";
        private const int BatchSize = 100;

        public FaceAutoNamingBackgroundService(
            IServiceProvider serviceProvider,
            ILogger<FaceAutoNamingBackgroundService> logger,
            BackgroundStateService backgroundStateService)
        {
            this.serviceProvider = serviceProvider;
            this.logger = logger;
            this.backgroundStateService = backgroundStateService;
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

            // Load last processed face ID state
            var state = await backgroundStateService.GetStateEntityAsync<FaceAutoNamingState>(
                context,
                ServiceStateId,
                cancellationToken);

            logger.LogInformation("Processing face auto-naming for batch starting at Id {StartId}, Count {Count}", state.LastProcessedFaceId ?? 0, BatchSize);
            try
            {
                var nextId = await faceDetectionService.AutoNameSimilarFacesAsync(
                    state.LastProcessedFaceId ?? 0,
                    DefaultThreshold,
                    batchSize: BatchSize);

                // Save state of last processed face ID
                state.LastProcessedFaceId = nextId;
                await backgroundStateService.SaveStateAsync(
                    context,
                    ServiceStateId,
                    state,
                    cancellationToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error processing gallery for face auto-naming");
            }
        }

        // State for tracking last processed face ID
        private sealed class FaceAutoNamingState
        {
            public int? LastProcessedFaceId { get; set; }
        }
    }
}