using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using GaleriePhotos.Models;
using GaleriePhotos.Services.Background;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Xunit;

namespace GaleriePhotosTest.Services
{
    public class GalleryScanBackgroundServiceTests : IDisposable
    {
        private readonly TestApplicationDbContext _db;
        private readonly BackgroundStateService _stateService;
        private readonly Gallery _gallery;
        private readonly string _serviceKey = "gallery-scan";

        public GalleryScanBackgroundServiceTests()
        {
            var optionsBuilder = new DbContextOptionsBuilder<TestApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString());
            _db = new TestApplicationDbContext(optionsBuilder.Options);

            var logger = new LoggerFactory().CreateLogger<BackgroundStateService>();
            _stateService = new BackgroundStateService(logger);

            var tempPath = System.IO.Path.Combine(System.IO.Path.GetTempPath(), "GalleryScanTest_" + Guid.NewGuid());
            _gallery = new Gallery("Test Gallery", tempPath, tempPath, DataProviderType.FileSystem, null, null);
            _db.Galleries.Add(_gallery);
            _db.SaveChanges();
        }

        public void Dispose()
        {
            _db.Dispose();
        }

        [Fact]
        public async Task SaveAndLoadState_WithCompletionDate_PreservesDate()
        {
            // Arrange
            var completionDate = DateTime.UtcNow.AddHours(-10);
            var state = new Dictionary<int, TestGalleryScanState>
            {
                { _gallery.Id, new TestGalleryScanState 
                    { 
                        LastScannedDirectoryId = 42, 
                        LastCompletedScanDate = completionDate 
                    } 
                }
            };

            // Act
            await _stateService.SaveStateAsync(_db, _serviceKey, state, CancellationToken.None);
            var loadedState = await _stateService.GetStateEntityAsync<Dictionary<int, TestGalleryScanState>>(
                _db, _serviceKey, CancellationToken.None);

            // Assert
            Assert.NotNull(loadedState);
            Assert.True(loadedState.ContainsKey(_gallery.Id));
            Assert.Equal(42, loadedState[_gallery.Id].LastScannedDirectoryId);
            Assert.NotNull(loadedState[_gallery.Id].LastCompletedScanDate);
            // Allow small time difference due to serialization
            var actualDate = loadedState[_gallery.Id].LastCompletedScanDate;
            Assert.True(actualDate.HasValue && Math.Abs((actualDate.Value - completionDate).TotalSeconds) < 1);
        }

        [Fact]
        public async Task SaveState_WithNullCompletionDate_SavesCorrectly()
        {
            // Arrange
            var state = new Dictionary<int, TestGalleryScanState>
            {
                { _gallery.Id, new TestGalleryScanState 
                    { 
                        LastScannedDirectoryId = 10, 
                        LastCompletedScanDate = null 
                    } 
                }
            };

            // Act
            await _stateService.SaveStateAsync(_db, _serviceKey, state, CancellationToken.None);
            var loadedState = await _stateService.GetStateEntityAsync<Dictionary<int, TestGalleryScanState>>(
                _db, _serviceKey, CancellationToken.None);

            // Assert
            Assert.NotNull(loadedState);
            Assert.True(loadedState.ContainsKey(_gallery.Id));
            Assert.Equal(10, loadedState[_gallery.Id].LastScannedDirectoryId);
            Assert.Null(loadedState[_gallery.Id].LastCompletedScanDate);
        }

        [Fact]
        public async Task SaveState_UpdatesExistingState()
        {
            // Arrange
            var initialState = new Dictionary<int, TestGalleryScanState>
            {
                { _gallery.Id, new TestGalleryScanState 
                    { 
                        LastScannedDirectoryId = 5, 
                        LastCompletedScanDate = null 
                    } 
                }
            };
            await _stateService.SaveStateAsync(_db, _serviceKey, initialState, CancellationToken.None);

            var completionDate = DateTime.UtcNow;
            var updatedState = new Dictionary<int, TestGalleryScanState>
            {
                { _gallery.Id, new TestGalleryScanState 
                    { 
                        LastScannedDirectoryId = 10, 
                        LastCompletedScanDate = completionDate 
                    } 
                }
            };

            // Act
            await _stateService.SaveStateAsync(_db, _serviceKey, updatedState, CancellationToken.None);
            var loadedState = await _stateService.GetStateEntityAsync<Dictionary<int, TestGalleryScanState>>(
                _db, _serviceKey, CancellationToken.None);

            // Assert
            Assert.NotNull(loadedState);
            Assert.Equal(10, loadedState[_gallery.Id].LastScannedDirectoryId);
            Assert.NotNull(loadedState[_gallery.Id].LastCompletedScanDate);
        }

        // Helper class matching the structure of GalleryScanState
        private sealed class TestGalleryScanState
        {
            public int? LastScannedDirectoryId { get; set; }
            public DateTime? LastCompletedScanDate { get; set; }
        }
    }
}
