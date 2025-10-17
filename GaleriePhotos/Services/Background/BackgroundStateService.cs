using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using GaleriePhotos.Data;
using GaleriePhotos.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GaleriePhotos.Services.Background
{
    public class BackgroundStateService
    {
        private readonly ILogger<BackgroundStateService> logger;

        public BackgroundStateService(ILogger<BackgroundStateService> logger)
        {
            this.logger = logger;
        }

        public async Task<T> GetStateEntityAsync<T>(
            ApplicationDbContext context,
            string serviceId,
            CancellationToken cancellationToken)
            where T : new()
        {
            var entity = await context.BackgroundServiceStates
                .SingleOrDefaultAsync(s => s.Id == serviceId, cancellationToken);

            var state = Deserialize<T>(entity, serviceId);
            return state;
        }

        public async Task<BackgroundServiceState> SaveStateAsync<T>(
            ApplicationDbContext context,
            string serviceId,
            T state,
            CancellationToken cancellationToken)
        {
            var serializedState = Serialize(state);
            var existingEntity = await context.BackgroundServiceStates
                .SingleOrDefaultAsync(s => s.Id == serviceId, cancellationToken);

            if (existingEntity == null)
            {
                existingEntity = new BackgroundServiceState
                {
                    Id = serviceId,
                    State = serializedState
                };
                context.BackgroundServiceStates.Add(existingEntity);
            }
            else
            {
                existingEntity.State = serializedState;
            }

            await context.SaveChangesAsync(cancellationToken);
            return existingEntity;
        }
        
        private T Deserialize<T>(BackgroundServiceState? stateEntity, string serviceId)
            where T : new()
        {
            if (stateEntity == null || string.IsNullOrWhiteSpace(stateEntity.State))
            {
                return new T();
            }

            try
            {
                return JsonSerializer.Deserialize<T>(stateEntity.State)
                    ?? new T();
            }
            catch (JsonException ex)
            {
                logger.LogWarning(ex, "Invalid background service state for {ServiceId}, resetting", serviceId);
                return new T();
            }
        }

        private string Serialize<T>(T state)
        {
            return JsonSerializer.Serialize(state);
        }
    }
}
