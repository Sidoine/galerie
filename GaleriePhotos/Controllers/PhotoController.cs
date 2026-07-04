using System;
using System.IO;
using Galerie.Server.ViewModels;
using GaleriePhotos;
using GaleriePhotos.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using System.Linq;
using GaleriePhotos.ViewModels;
using System.Threading.Tasks;
using GaleriePhotos.Data;
using GaleriePhotos.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.IO.Compression;

namespace Galerie.Server.Controllers
{
    [Route("api/photos")]
    public class PhotoController : Controller
    {
        private readonly IOptions<GalerieOptions> options;
        private readonly PhotoService photoService;
        private readonly ApplicationDbContext applicationDbContext;
        private readonly DataService dataService;
        private readonly GalleryService galleryService;

        public PhotoController(IOptions<GalerieOptions> options, PhotoService photoService, ApplicationDbContext applicationDbContext, DataService dataService, GalleryService galleryService)
        {
            this.options = options;
            this.photoService = photoService;
            this.applicationDbContext = applicationDbContext;
            this.dataService = dataService;
            this.galleryService = galleryService;
        }

        /// <summary>
        /// Gets the full image for a photo by its public ID.
        /// NOTE: This endpoint allows anonymous access for public sharing via the publicId (GUID) which acts as a secret token.
        /// This is a design decision to enable photo sharing without authentication, but anyone with the URL can access the photo.
        /// </summary>
        [HttpGet("{publicId}/image")]
        [AllowAnonymous]
        public async Task<IActionResult> GetImage(Guid publicId)
        {
            var photo = await photoService.GetPhoto(publicId);
            if (photo == null) return NotFound();
            var dataProvider = dataService.GetDataProvider(photo.Directory.Gallery);
            var bytes = await dataProvider.OpenFileRead(photo);
            if (bytes == null) return NotFound();
            return File(bytes, photoService.GetMimeType(photo), photo.FileName);
        }

        /// <summary>
        /// Gets the thumbnail for a photo by its public ID.
        /// NOTE: This endpoint allows anonymous access for public sharing via the publicId (GUID) which acts as a secret token.
        /// This is a design decision to enable photo sharing without authentication, but anyone with the URL can access the photo.
        /// </summary>
        [HttpGet("{publicId}/thumbnail")]
        [AllowAnonymous]
        public async Task<IActionResult> GetThumbnail(Guid publicId)
        {
            var photo = await photoService.GetPhoto(publicId);
            if (photo == null) return NotFound();

            var bytes = await photoService.GetThumbnail(photo);
            if (bytes == null) return NotFound();
            return File(bytes, "image/jpeg", photo.FileName);
        }

        private (Photo? previous, Photo? next) GetNextAndPrevious(Photo photo, Photo[] images)
        {
            var index = Array.IndexOf(images, photo);
            Photo? previous = null;
            Photo? next = null;
            if (index != -1)
            {
                if (index > 0) previous = images[index - 1];
                if (index < images.Length - 1) next = images[index + 1];
            }
            return (previous, next);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<PhotoFullViewModel>> Get(int id)
        {
            var photo = await photoService.GetPhoto(id);
            if (photo == null) return NotFound();
            if (!photoService.IsDirectoryVisible(User, photo.Directory)) return Forbid();
            var images = await photoService.GetDirectoryImages(photo.Directory);
            if (images == null) return NotFound();
            var (previous, next) = GetNextAndPrevious(photo, images);
            var isPrivate = photoService.IsPrivate(photo.Directory);
            var isFavorite = await photoService.IsPhotoFavorite(id, User);
            var viewModel = new PhotoFullViewModel(photo, previous, next, isPrivate, isFavorite);
            return Ok(viewModel);
        }

        [Authorize(Policy = Policies.Administrator)]
        [HttpPatch("{id}")]
        public async Task<ActionResult> Patch(int id, [FromBody] PhotoPatchViewModel viewModel)
        {
            var photo = await photoService.GetPhoto(id);
            if (photo == null) return NotFound();
            if (viewModel.Description.IsSet)
            {
                var descriptionValue = viewModel.Description.Value;
                var trimmed = descriptionValue?.Trim();
                photo.Description = string.IsNullOrWhiteSpace(trimmed)
                    ? null
                    : trimmed;
            }
            await applicationDbContext.SaveChangesAsync();
            return Ok();
        }

        [Authorize(Policy = Policies.Administrator)]
        [HttpPatch("{id}/access")]
        public async Task<ActionResult> SetAccess(int id, [FromBody] PhotoAccessViewModel viewModel)
        {
            var photo = await photoService.GetPhoto(id);
            if (photo == null) return NotFound();
            if (viewModel.Private) await photoService.MoveToPrivate(photo);
            else await photoService.MoveToPublic(photo);
            return Ok();
        }

        [Authorize(Policy = Policies.Administrator)]
        [HttpPatch("{id}/rotate")]
        public async Task<ActionResult> Rotate(int id, [FromBody] PhotoRotateViewModel viewModel)
        {
            var photo = await photoService.GetPhoto(id);
            if (photo == null) return NotFound();
            if (!await photoService.RotatePhoto(photo, viewModel.Angle))
                return BadRequest("Impossible de faire pivoter la photo (angle invalide ou erreur interne).");
            return Ok();
        }

        [Authorize(Policy = Policies.Administrator)]
        [HttpPost("bulk-update-location")]
        public async Task<ActionResult> BulkUpdateLocation([FromBody] PhotoBulkUpdateLocationViewModel viewModel)
        {
            if (viewModel.PhotoIds == null || viewModel.PhotoIds.Length == 0)
                return BadRequest("Aucune photo spécifiée");

            await photoService.BulkUpdatePhotosLocation(viewModel.PhotoIds, viewModel.Latitude, viewModel.Longitude, viewModel.OverwriteExisting);
            return Ok();
        }

        [Authorize(Policy = Policies.Administrator)]
        [HttpPost("bulk-update-date")]
        public async Task<ActionResult> BulkUpdateDate([FromBody] PhotoBulkUpdateDateViewModel viewModel)
        {
            if (viewModel.PhotoIds == null || viewModel.PhotoIds.Length == 0)
                return BadRequest("Aucune photo spécifiée");

            await photoService.BulkUpdatePhotosDate(viewModel.PhotoIds, viewModel.DateTime);
            return Ok();
        }

        [Authorize(Policy = Policies.Administrator)]
        [HttpPost("galleries/{galleryId}/move")]
        public async Task<ActionResult> MovePhotos(int galleryId, [FromBody] PhotoMoveViewModel viewModel)
        {
            if (viewModel.PhotoIds == null || viewModel.PhotoIds.Length == 0)
                return BadRequest("Aucune photo spécifiée");

            var gallery = await galleryService.Get(galleryId);
            if (gallery == null) return NotFound("Galerie introuvable");
            if (!User.IsGalleryAdministrator(gallery)) return Forbid();

            try
            {
                await photoService.MovePhotosToDirectory(galleryId, viewModel.PhotoIds, viewModel.TargetDirectoryId);
                return Ok();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [Authorize]
        [HttpPost("{id}/favorite")]
        public async Task<ActionResult<bool>> ToggleFavorite(int id)
        {
            var photo = await photoService.GetPhoto(id);
            if (photo == null) return NotFound();
            if (!photoService.IsDirectoryVisible(User, photo.Directory)) return Forbid();

            var isFavorite = await photoService.TogglePhotoFavorite(id, User);
            return Ok(isFavorite);
        }

        [Authorize]
        [HttpPost("download-zip")]
        public async Task<IActionResult> DownloadZip([FromBody] PhotoDownloadZipViewModel viewModel)
        {
            if (viewModel.PhotoIds == null || viewModel.PhotoIds.Length == 0)
                return BadRequest("Aucune photo spécifiée");

            var requestedIds = viewModel.PhotoIds
                .Where(id => id > 0)
                .Distinct()
                .ToArray();

            if (requestedIds.Length == 0)
                return BadRequest("Aucune photo valide spécifiée");

            var photosById = await applicationDbContext.Photos
                .Include(x => x.Directory)
                    .ThenInclude(x => x.Gallery)
                        .ThenInclude(x => x.Members)
                .Where(x => requestedIds.Contains(x.Id))
                .ToDictionaryAsync(x => x.Id);

            var photos = requestedIds
                .Where(photosById.ContainsKey)
                .Select(id => photosById[id])
                .ToArray();

            if (photos.Length == 0)
                return NotFound("Aucune photo introuvable");

            if (photos.Any(photo => !photoService.IsDirectoryVisible(User, photo.Directory)))
                return Forbid();

            var providersByGalleryId = new Dictionary<int, IDataProvider>();
            IDataProvider GetProvider(Photo photo)
            {
                if (!providersByGalleryId.TryGetValue(photo.Directory.GalleryId, out var provider))
                {
                    provider = dataService.GetDataProvider(photo.Directory.Gallery);
                    providersByGalleryId[photo.Directory.GalleryId] = provider;
                }

                return provider;
            }

            var usedEntryNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            await using var zipMemoryStream = new MemoryStream();
            using (var archive = new ZipArchive(zipMemoryStream, ZipArchiveMode.Create, leaveOpen: true))
            {
                foreach (var photo in photos)
                {
                    var provider = GetProvider(photo);
                    await using var sourceStream = await provider.OpenFileRead(photo);
                    if (sourceStream == null)
                        continue;

                    var baseEntryName = BuildZipEntryName(photo);
                    var entryName = EnsureUniqueEntryName(baseEntryName, usedEntryNames);
                    var entry = archive.CreateEntry(entryName, CompressionLevel.Fastest);

                    await using var entryStream = entry.Open();
                    await sourceStream.CopyToAsync(entryStream);
                }
            }

            if (zipMemoryStream.Length == 0)
                return NotFound("Impossible de récupérer les fichiers demandés");

            var fileName = $"photos-{DateTime.UtcNow:yyyyMMdd-HHmmss}.zip";
            return File(zipMemoryStream.ToArray(), "application/zip", fileName);
        }

        private static string BuildZipEntryName(Photo photo)
        {
            var sanitizedFileName = SanitizeSegment(photo.FileName);
            if (string.IsNullOrWhiteSpace(photo.Directory.Path))
                return sanitizedFileName;

            var pathSegments = photo.Directory.Path
                .Split(new[] { '\\', '/' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(SanitizeSegment)
                .Where(segment => !string.IsNullOrWhiteSpace(segment));

            var prefix = string.Join("/", pathSegments);
            if (string.IsNullOrWhiteSpace(prefix))
                return sanitizedFileName;

            return $"{prefix}/{sanitizedFileName}";
        }

        private static string SanitizeSegment(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return "file";

            var invalidChars = Path.GetInvalidFileNameChars();
            var sanitized = new string(value.Select(c => invalidChars.Contains(c) ? '_' : c).ToArray()).Trim();

            return string.IsNullOrWhiteSpace(sanitized) ? "file" : sanitized;
        }

        private static string EnsureUniqueEntryName(string entryName, HashSet<string> usedEntryNames)
        {
            if (usedEntryNames.Add(entryName))
                return entryName;

            var extension = Path.GetExtension(entryName);
            var fileNameWithoutExtension = Path.GetFileNameWithoutExtension(entryName);
            var directoryName = Path.GetDirectoryName(entryName)?.Replace('\\', '/');

            var suffix = 1;
            while (true)
            {
                var candidateFileName = $"{fileNameWithoutExtension} ({suffix}){extension}";
                var candidate = string.IsNullOrEmpty(directoryName)
                    ? candidateFileName
                    : $"{directoryName}/{candidateFileName}";

                if (usedEntryNames.Add(candidate))
                    return candidate;

                suffix++;
            }
        }
    }
}
