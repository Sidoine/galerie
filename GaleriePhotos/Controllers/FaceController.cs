using System;
using System.Linq;
using System.Threading.Tasks;
using GaleriePhotos.Data;
using GaleriePhotos.Models;
using GaleriePhotos.Services;
using GaleriePhotos.ViewModels;
using Galerie.Server.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace GaleriePhotos.Controllers
{
    [Route("api/gallery")]
    public class FaceController : Controller
    {
        private readonly ApplicationDbContext applicationDbContext;
        private readonly FaceDetectionService faceDetectionService;
        private readonly GalleryService _galleryService;
        private readonly PhotoService _photoService;

        public FaceController(
            ApplicationDbContext applicationDbContext,
            FaceDetectionService faceDetectionService,
            GalleryService galleryService,
            PhotoService photoService)
        {
            this.applicationDbContext = applicationDbContext;
            this.faceDetectionService = faceDetectionService;
            _galleryService = galleryService;
            _photoService = photoService;
        }

        /// <summary>
        /// Assigne un nom à un visage détecté
        /// </summary>
        /// <param name="faceId">ID du visage</param>
        /// <param name="model">Nom à assigner</param>
        /// <returns>Succès ou échec de l'opération</returns>
        [HttpPost("{galleryId}/faces/{faceId}/name")]
        public async Task<ActionResult> AssignName(int galleryId, int faceId, [FromBody] FaceAssignNameViewModel model)
        {
            if (string.IsNullOrWhiteSpace(model.Name))
            {
                return BadRequest("Le nom ne peut pas être vide");
            }

            var gallery = await _galleryService.Get(galleryId);
            if (gallery == null) return NotFound();
            if (!User.IsGalleryAdministrator(gallery)) return Forbid();

            var success = await faceDetectionService.AssignNameToFaceAsync(gallery, faceId, model.Name.Trim());
            
            if (!success)
            {
                return NotFound("Visage non trouvé");
            }

            return Ok();
        }

        /// <summary>
        /// Obtient des visages similaires pour un nom donné
        /// </summary>
        /// <param name="model">Nom et nombre de résultats souhaités</param>
        /// <returns>Liste des visages similaires non nommés</returns>
        [HttpPost("{galleryId}/faces/similar")]
        public async Task<ActionResult<FaceViewModel[]>> GetSimilarFaces(int galleryId, [FromBody] SimilarFacesRequestViewModel model)
        {
            if (string.IsNullOrWhiteSpace(model.Name))
            {
                return BadRequest("Le nom ne peut pas être vide");
            }

            var similarFaces = await faceDetectionService.GetSimilarFacesAsync(galleryId, model.Name.Trim(), model.Limit);
            
            var result = similarFaces.Select(f => new FaceViewModel
            {
                Id = f.Id,
                PhotoId = f.PhotoId,
                X = f.X,
                Y = f.Y,
                Width = f.Width,
                Height = f.Height,
                Name = null,
                CreatedAt = f.CreatedAt,
                NamedAt = f.NamedAt,
                AutoNamedFromFaceId = f.AutoNamedFromFaceId,
            }).ToArray();

            return Ok(result);
        }

        /// <summary>
        /// Obtient un échantillon de visages sans nom
        /// </summary>
        /// <param name="model">Nombre de visages souhaités</param>
        /// <returns>Liste des visages sans nom</returns>
        [HttpPost("{galleryId}/faces/unnamed-sample")]
        public async Task<ActionResult<FaceViewModel[]>> GetUnnamedFacesSample(int galleryId, [FromBody] UnnamedFacesSampleRequestViewModel model)
        {
            var gallery = await _galleryService.Get(galleryId);
            if (gallery == null) return NotFound();
            if (!User.IsGalleryAdministrator(gallery)) return Forbid();

            var unnamedFaces = await faceDetectionService.GetUnnamedFacesSampleAsync(galleryId, model.Count);
            
            var result = unnamedFaces.Select(f => new FaceViewModel
            {
                Id = f.Id,
                PhotoId = f.PhotoId,
                X = f.X,
                Y = f.Y,
                Width = f.Width,
                Height = f.Height,
                Name = f.FaceName?.Name,
                CreatedAt = f.CreatedAt,
                NamedAt = f.NamedAt,
                AutoNamedFromFaceId = f.AutoNamedFromFaceId,
            }).ToArray();

            return Ok(result);
        }

        /// <summary>
        /// Obtient tous les visages d'une photo spécifique
        /// </summary>
        /// <param name="photoId">ID de la photo</param>
        /// <returns>Liste des visages détectés dans la photo</returns>
        [HttpGet("{galleryId}/photos/{photoId}/faces")]
        public async Task<ActionResult<FaceViewModel[]>> GetFacesByPhoto(int galleryId, int photoId)
        {
            var gallery = await _galleryService.Get(galleryId);
            if (gallery == null) return NotFound();
            if (!User.IsGalleryAdministrator(gallery)) return Forbid();

            var faces = await applicationDbContext.Faces
                .Include(f => f.Photo)
                .Include(f => f.FaceName)
                .Where(f => f.PhotoId == photoId && f.Photo.Directory.GalleryId == galleryId)
                .ToListAsync();

            var result = faces.Select(f => new FaceViewModel
            {
                Id = f.Id,
                PhotoId = f.PhotoId,
                X = f.X,
                Y = f.Y,
                Width = f.Width,
                Height = f.Height,
                Name = f.FaceName?.Name,
                CreatedAt = f.CreatedAt,
                NamedAt = f.NamedAt,
                AutoNamedFromFaceId = f.AutoNamedFromFaceId,
            }).ToArray();

            return Ok(result);
        }

        /// <summary>
        /// Obtient les noms distincts assignés aux visages
        /// </summary>
        /// <returns>Liste des noms distincts</returns>
        [HttpGet("{galleryId}/faces/names")]
        public async Task<ActionResult<FaceNameViewModel[]>> GetNames(int galleryId)
        {
            var gallery = await _galleryService.Get(galleryId);
            if (gallery == null) return NotFound();
            if (!User.IsGalleryMember(gallery)) return Forbid();

            var names = await applicationDbContext.FaceNames
                .Where(x => x.GalleryId == galleryId)
                .OrderBy(n => n.Name)
                .Select(x => new FaceNameViewModel
                {
                    Id = x.Id,
                    Name = x.Name,
                    NumberOfPhotos = applicationDbContext.Faces.Count(f => f.FaceNameId == x.Id)
                })
                .ToArrayAsync();

            return Ok(names);
        }

        [HttpGet("{galleryId}/faces/names/{id}")]
        public async Task<ActionResult<FaceNameFullViewModel>> GetName(int galleryId, int id)
        {
            var gallery = await _galleryService.Get(galleryId);
            if (gallery == null) return NotFound();
            if (!User.IsGalleryMember(gallery)) return Forbid();

            var name = await applicationDbContext.FaceNames
                .Where(x => x.GalleryId == galleryId && x.Id == id)
                .Select(x => new FaceNameFullViewModel
                {
                    Id = x.Id,
                    Name = x.Name,
                    NumberOfPhotos = applicationDbContext.Faces.Count(f => f.FaceNameId == x.Id),
                    MinDate = applicationDbContext.Faces.Where(f => f.FaceNameId == x.Id).Min(f => f.Photo.DateTime),
                    MaxDate = applicationDbContext.Faces.Where(f => f.FaceNameId == x.Id).Max(f => f.Photo.DateTime),
                    CoverPhotoId = applicationDbContext.Faces.Where(f => f.FaceNameId == x.Id).OrderBy(f => f.Photo.DateTime).Select(f => f.Photo.PublicId.ToString()).FirstOrDefault()
                })
                .FirstOrDefaultAsync();
            if (name == null) return NotFound();

            // Calculate date jumps
            var photoDates = await applicationDbContext.Faces
                .Where(f => f.FaceNameId == id)
                .Select(f => f.Photo.DateTime)
                .ToListAsync();
            name.DateJumps = DateJumpHelper.CalculateDateJumps(name.MinDate, name.MaxDate, photoDates);

            return Ok(name);
        }

        /// <summary>
        /// Retourne la liste des photos associées à un nom de visage donné dans la galerie.
        /// </summary>
        /// <param name="galleryId">Identifiant de la galerie</param>
        /// <param name="name">Nom du visage</param>
        /// <returns>Liste de PhotoViewModel</returns>
        [HttpGet("{galleryId}/face-names/{id}/photos")]
        public async Task<ActionResult<PhotoViewModel[]>> GetPhotosByFaceName(int galleryId, int id, string sortOrder = "asc", int offset = 0, int count = 25, DateTime? startDate = null)
        {
            var gallery = await _galleryService.Get(galleryId);
            if (gallery == null) return NotFound();
            if (!User.IsGalleryMember(gallery)) return Forbid();

            var query = applicationDbContext.Faces
                .Include(f => f.Photo)
                    .ThenInclude(p => p.Place)
                .Include(f => f.FaceName)
                .Where(f => f.FaceName != null && f.FaceNameId == id && f.Photo.Directory.GalleryId == galleryId)
                .Select(f => f.Photo)
                .Distinct();
            
            // If startDate is provided, filter from that date
            if (startDate.HasValue)
            {
                query = sortOrder == "asc"
                    ? query.Where(p => p.DateTime >= startDate.Value)
                    : query.Where(p => p.DateTime <= startDate.Value);
            }

            // Handle negative offsets by reversing sort order
            bool reverseSort = offset < 0;
            int absOffset = Math.Abs(offset);

            // Apply sorting
            var orderedQuery = (sortOrder == "asc" && !reverseSort) || (sortOrder == "desc" && reverseSort)
                ? query.OrderBy(p => p.DateTime)
                : query.OrderByDescending(p => p.DateTime);

            // Apply pagination
            var photos = await orderedQuery
                .Skip(absOffset)
                .Take(count)
                .ToListAsync();

            // If we reversed the sort for negative offset, reverse the results back
            if (reverseSort)
            {
                photos.Reverse();
            }

            var result = photos.Select(p => new PhotoViewModel(p)).ToArray();
            return Ok(result);
        }

        /// <summary>
        /// Suggère un nom pour un visage sans nom. Retourne { name, similarity } ou { name: null } si aucun visage suffisamment proche.
        /// </summary>
        [HttpPost("{galleryId}/faces/{faceId}/suggest-name")]
        public async Task<ActionResult<FaceNameSuggestionResponseViewModel>> SuggestName(int galleryId, int faceId, [FromBody] FaceNameSuggestionRequestViewModel model)
        {
            var gallery = await _galleryService.Get(galleryId);
            if (gallery == null) return NotFound();
            if (!User.IsGalleryAdministrator(gallery)) return Forbid();

            var suggestion = await faceDetectionService.SuggestNameForFaceAsync(galleryId, faceId, model.Threshold);

            if (suggestion == null)
            {
                return Ok(new FaceNameSuggestionResponseViewModel { Name = null });
            }

            return Ok(new FaceNameSuggestionResponseViewModel { Name = suggestion.Name });
        }

        /// <summary>
        /// Gets the thumbnail for a face name, returning the thumbnail of the latest face linked to the face name.
        /// </summary>
        /// <param name="galleryId">Gallery ID</param>
        /// <param name="faceNameId">Face name ID</param>
        /// <returns>Face thumbnail image</returns>
        [HttpGet("{galleryId}/face-names/{faceNameId}/thumbnail")]
        public async Task<ActionResult> GetFaceNameThumbnail(int galleryId, int faceNameId)
        {
            var gallery = await _galleryService.Get(galleryId);
            if (gallery == null) return NotFound();
            if (!User.IsGalleryMember(gallery)) return Forbid();

            // Get the latest face linked to this face name
            var latestFace = await applicationDbContext.Faces
                .Include(f => f.Photo)
                    .ThenInclude(p => p.Directory)
                        .ThenInclude(d => d.Gallery)
                .Where(f => f.FaceNameId == faceNameId && f.Photo.Directory.GalleryId == galleryId)
                .OrderByDescending(f => f.CreatedAt)
                .FirstOrDefaultAsync();

            if (latestFace == null)
            {
                return NotFound("No faces found for this face name");
            }

            var thumbnailStream = await _photoService.GetFaceThumbnail(latestFace);
            if (thumbnailStream == null)
            {
                return NotFound("Face thumbnail not available");
            }

            return File(thumbnailStream, "image/jpeg");
        }

        /// <summary>
        /// Gets the thumbnail (cropped face region) for a specific face id.
        /// </summary>
        /// <param name="galleryId">Gallery id</param>
        /// <param name="faceId">Face id</param>
        /// <returns>Face thumbnail image</returns>
        [HttpGet("{galleryId}/faces/{faceId}/thumbnail")]
        public async Task<ActionResult> GetFaceThumbnail(int galleryId, int faceId)
        {
            var gallery = await _galleryService.Get(galleryId);
            if (gallery == null) return NotFound();
            if (!User.IsGalleryMember(gallery)) return Forbid();

            // Ensure face belongs to gallery
            var face = await applicationDbContext.Faces
                .Include(f => f.Photo)
                    .ThenInclude(p => p.Directory)
                        .ThenInclude(d => d.Gallery)
                .Where(f => f.Id == faceId && f.Photo.Directory.GalleryId == galleryId)
                .FirstOrDefaultAsync();

            if (face == null)
            {
                return NotFound("Face not found");
            }

            var thumbnailStream = await _photoService.GetFaceThumbnail(face);
            if (thumbnailStream == null)
            {
                return NotFound("Face thumbnail not available");
            }

            return File(thumbnailStream, "image/jpeg");
        }

        /// <summary>
        /// Supprime un visage (Face) de la galerie. Réservé aux administrateurs de la galerie.
        /// </summary>
        /// <param name="galleryId">Identifiant de la galerie</param>
        /// <param name="faceId">Identifiant du visage</param>
        [HttpDelete("{galleryId}/faces/{faceId}")]
        public async Task<ActionResult> DeleteFace(int galleryId, int faceId)
        {
            var gallery = await _galleryService.Get(galleryId);
            if (gallery == null) return NotFound();
            if (!User.IsGalleryAdministrator(gallery)) return Forbid();

            // Récupère le face en s'assurant qu'il appartient bien à la galerie
            var face = await applicationDbContext.Faces
                .Include(f => f.Photo)
                    .ThenInclude(p => p.Directory)
                .Where(f => f.Id == faceId && f.Photo.Directory.GalleryId == galleryId)
                .FirstOrDefaultAsync();

            if (face == null) return NotFound();

            applicationDbContext.Faces.Remove(face);
            await applicationDbContext.SaveChangesAsync();

            return NoContent();
        }

        /// <summary>
        /// Gets random pairs of auto-named faces with their reference faces for verification.
        /// Used in the dashboard to verify the relevance of auto-naming parameters.
        /// </summary>
        /// <param name="galleryId">Gallery ID</param>
        /// <param name="count">Number of random pairs to return (default: 10, max: 50)</param>
        /// <returns>List of auto-named face pairs</returns>
        [HttpGet("{galleryId}/faces/auto-named-pairs")]
        public async Task<ActionResult<AutoNamedFacePairViewModel[]>> GetAutoNamedFacePairs(int galleryId, [FromQuery] int count = 10)
        {
            var gallery = await _galleryService.Get(galleryId);
            if (gallery == null) return NotFound();
            if (!User.IsGalleryAdministrator(gallery)) return Forbid();

            if (count <= 0) count = 10;
            if (count > 50) count = 50;

            // Get all auto-named faces with their reference faces
            var autoNamedFaces = await applicationDbContext.Faces
                .Include(f => f.Photo)
                .Include(f => f.FaceName)
                .Include(f => f.AutoNamedFromFace)
                    .ThenInclude(rf => rf!.Photo)
                .Where(f => f.AutoNamedFromFaceId != null && f.Photo.Directory.GalleryId == galleryId)
                .OrderBy(f => Guid.NewGuid()) // Random order
                .Take(count)
                .ToListAsync();

            var result = autoNamedFaces.Select(f => new AutoNamedFacePairViewModel
            {
                FaceId = f.Id,
                PhotoId = f.PhotoId,
                Name = f.FaceName?.Name,
                X = f.X,
                Y = f.Y,
                Width = f.Width,
                Height = f.Height,
                NamedAt = f.NamedAt,
                ReferenceFaceId = f.AutoNamedFromFace!.Id,
                ReferencePhotoId = f.AutoNamedFromFace.PhotoId,
                ReferenceX = f.AutoNamedFromFace.X,
                ReferenceY = f.AutoNamedFromFace.Y,
                ReferenceWidth = f.AutoNamedFromFace.Width,
                ReferenceHeight = f.AutoNamedFromFace.Height
            }).ToArray();

            return Ok(result);
        }

        /// <summary>
        /// Removes the auto-assigned name from a face (undo auto-naming operation).
        /// This keeps the face but removes its name and reference to the model face.
        /// </summary>
        /// <param name="galleryId">Gallery ID</param>
        /// <param name="faceId">Face ID to remove auto-naming from</param>
        [HttpPost("{galleryId}/faces/{faceId}/undo-auto-name")]
        public async Task<ActionResult> UndoAutoNaming(int galleryId, int faceId)
        {
            var gallery = await _galleryService.Get(galleryId);
            if (gallery == null) return NotFound();
            if (!User.IsGalleryAdministrator(gallery)) return Forbid();

            // Get the face and ensure it belongs to the gallery and was auto-named
            var face = await applicationDbContext.Faces
                .Include(f => f.Photo)
                    .ThenInclude(p => p.Directory)
                .Where(f => f.Id == faceId 
                    && f.Photo.Directory.GalleryId == galleryId 
                    && f.AutoNamedFromFaceId != null)
                .FirstOrDefaultAsync();

            if (face == null) return NotFound("Face not found or was not auto-named");

            // Remove the auto-naming
            face.FaceNameId = null;
            face.AutoNamedFromFaceId = null;
            face.NamedAt = null;

            await applicationDbContext.SaveChangesAsync();

            return Ok();
        }

        /// <summary>
        /// Met à jour le nom d'un visage (FaceName). Réservé aux administrateurs de la galerie.
        /// </summary>
        /// <param name="galleryId">Identifiant de la galerie</param>
        /// <param name="faceNameId">Identifiant du nom de visage</param>
        /// <param name="model">Nouveau nom</param>
        [HttpPatch("{galleryId}/face-names/{faceNameId}")]
        public async Task<ActionResult> UpdateFaceName(int galleryId, int faceNameId, [FromBody] FaceNameUpdateViewModel model)
        {
            if (string.IsNullOrWhiteSpace(model.Name))
            {
                return BadRequest("Le nom ne peut pas être vide");
            }

            var gallery = await _galleryService.Get(galleryId);
            if (gallery == null) return NotFound();
            if (!User.IsGalleryAdministrator(gallery)) return Forbid();

            // Récupère le FaceName en s'assurant qu'il appartient bien à la galerie
            var faceName = await applicationDbContext.FaceNames
                .Where(fn => fn.Id == faceNameId && fn.GalleryId == galleryId)
                .FirstOrDefaultAsync();

            if (faceName == null) return NotFound();

            // Vérifie qu'il n'existe pas déjà un autre FaceName avec ce nom dans la galerie
            var existingFaceName = await applicationDbContext.FaceNames
                .Where(fn => fn.GalleryId == galleryId && fn.Name == model.Name.Trim() && fn.Id != faceNameId)
                .FirstOrDefaultAsync();

            if (existingFaceName != null)
            {
                return BadRequest("Un nom de visage avec ce nom existe déjà dans cette galerie");
            }

            faceName.Name = model.Name.Trim();
            await applicationDbContext.SaveChangesAsync();

            return Ok();
        }
    }
}