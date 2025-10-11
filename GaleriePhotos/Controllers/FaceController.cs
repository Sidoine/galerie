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
        public async Task<ActionResult<FaceNameViewModel>> GetName(int galleryId, int id)
        {
            var gallery = await _galleryService.Get(galleryId);
            if (gallery == null) return NotFound();
            if (!User.IsGalleryMember(gallery)) return Forbid();

            var name = await applicationDbContext.FaceNames
                .Where(x => x.GalleryId == galleryId && x.Id == id)
                .Select(x => new FaceNameViewModel
                {
                    Id = x.Id,
                    Name = x.Name,
                    NumberOfPhotos = applicationDbContext.Faces.Count(f => f.FaceNameId == x.Id)
                })
                .FirstOrDefaultAsync();
            if (name == null) return NotFound();
            return Ok(name);
        }

        /// <summary>
        /// Retourne la liste des photos associées à un nom de visage donné dans la galerie.
        /// </summary>
        /// <param name="galleryId">Identifiant de la galerie</param>
        /// <param name="name">Nom du visage</param>
        /// <returns>Liste de PhotoViewModel</returns>
        [HttpGet("{galleryId}/face-names/{id}/photos")]
        public async Task<ActionResult<PhotoViewModel[]>> GetPhotosByFaceName(int galleryId, int id)
        {
            var gallery = await _galleryService.Get(galleryId);
            if (gallery == null) return NotFound();
            if (!User.IsGalleryMember(gallery)) return Forbid();

            var photos = await applicationDbContext.Faces
                .Include(f => f.Photo)
                .Include(f => f.FaceName)
                .Where(f => f.FaceName != null && f.FaceNameId == id && f.Photo.Directory.GalleryId == galleryId)
                .Select(f => f.Photo)
                .Distinct()
                .OrderBy(f => f.DateTime)
                .ToListAsync();

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
    }
}