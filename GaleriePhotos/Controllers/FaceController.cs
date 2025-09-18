using System;
using System.Linq;
using System.Threading.Tasks;
using GaleriePhotos.Data;
using GaleriePhotos.Models;
using GaleriePhotos.Services;
using GaleriePhotos.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GaleriePhotos.Controllers
{
    [Authorize(Policy = Policies.Images)]
    [Route("api/faces")]
    public class FaceController : Controller
    {
        private readonly ApplicationDbContext applicationDbContext;
        private readonly FaceDetectionService faceDetectionService;

        public FaceController(
            ApplicationDbContext applicationDbContext,
            FaceDetectionService faceDetectionService)
        {
            this.applicationDbContext = applicationDbContext;
            this.faceDetectionService = faceDetectionService;
        }

        /// <summary>
        /// Assigne un nom à un visage détecté
        /// </summary>
        /// <param name="faceId">ID du visage</param>
        /// <param name="model">Nom à assigner</param>
        /// <returns>Succès ou échec de l'opération</returns>
        [HttpPost("{faceId}/name")]
        public async Task<ActionResult> AssignName(int faceId, [FromBody] FaceAssignNameViewModel model)
        {
            if (string.IsNullOrWhiteSpace(model.Name))
            {
                return BadRequest("Le nom ne peut pas être vide");
            }

            var success = await faceDetectionService.AssignNameToFaceAsync(faceId, model.Name.Trim());
            
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
        [HttpPost("similar")]
        public async Task<ActionResult<FaceViewModel[]>> GetSimilarFaces([FromBody] SimilarFacesRequestViewModel model)
        {
            if (string.IsNullOrWhiteSpace(model.Name))
            {
                return BadRequest("Le nom ne peut pas être vide");
            }

            var similarFaces = await faceDetectionService.GetSimilarFacesAsync(model.Name.Trim(), model.Limit);
            
            var result = similarFaces.Select(f => new FaceViewModel
            {
                Id = f.Id,
                PhotoId = f.PhotoId,
                X = f.X,
                Y = f.Y,
                Width = f.Width,
                Height = f.Height,
                Name = f.Name,
                CreatedAt = f.CreatedAt,
                NamedAt = f.NamedAt,
                PhotoFileName = f.Photo?.FileName,
                PhotoThumbnailUrl = f.Photo != null ? $"/api/directory/{GetPhotoDirectoryId(f.Photo)}/photos/{f.PhotoId}/thumbnail" : null
            }).ToArray();

            return Ok(result);
        }

        /// <summary>
        /// Obtient un échantillon de visages sans nom
        /// </summary>
        /// <param name="model">Nombre de visages souhaités</param>
        /// <returns>Liste des visages sans nom</returns>
        [HttpPost("unnamed-sample")]
        public async Task<ActionResult<FaceViewModel[]>> GetUnnamedFacesSample([FromBody] UnnamedFacesSampleRequestViewModel model)
        {
            var unnamedFaces = await faceDetectionService.GetUnnamedFacesSampleAsync(model.Count);
            
            var result = unnamedFaces.Select(f => new FaceViewModel
            {
                Id = f.Id,
                PhotoId = f.PhotoId,
                X = f.X,
                Y = f.Y,
                Width = f.Width,
                Height = f.Height,
                Name = f.Name,
                CreatedAt = f.CreatedAt,
                NamedAt = f.NamedAt,
                PhotoFileName = f.Photo?.FileName,
                PhotoThumbnailUrl = f.Photo != null ? $"/api/directory/{GetPhotoDirectoryId(f.Photo)}/photos/{f.PhotoId}/thumbnail" : null
            }).ToArray();

            return Ok(result);
        }

        /// <summary>
        /// Obtient tous les visages d'une photo spécifique
        /// </summary>
        /// <param name="photoId">ID de la photo</param>
        /// <returns>Liste des visages détectés dans la photo</returns>
        [HttpGet("photo/{photoId}")]
        public async Task<ActionResult<FaceViewModel[]>> GetFacesByPhoto(int photoId)
        {
            var faces = await applicationDbContext.Faces
                .Include(f => f.Photo)
                .Where(f => f.PhotoId == photoId)
                .ToListAsync();

            var result = faces.Select(f => new FaceViewModel
            {
                Id = f.Id,
                PhotoId = f.PhotoId,
                X = f.X,
                Y = f.Y,
                Width = f.Width,
                Height = f.Height,
                Name = f.Name,
                CreatedAt = f.CreatedAt,
                NamedAt = f.NamedAt,
                PhotoFileName = f.Photo?.FileName
            }).ToArray();

            return Ok(result);
        }

        /// <summary>
        /// Obtient les noms distincts assignés aux visages
        /// </summary>
        /// <returns>Liste des noms distincts</returns>
        [HttpGet("names")]
        public async Task<ActionResult<string[]>> GetDistinctNames()
        {
            var names = await applicationDbContext.Faces
                .Where(f => !string.IsNullOrEmpty(f.Name))
                .Select(f => f.Name!)
                .Distinct()
                .OrderBy(n => n)
                .ToArrayAsync();

            return Ok(names);
        }

        private int GetPhotoDirectoryId(Photo photo)
        {
            // This is a simplified approach - in a real scenario, you might need to
            // look up the photo directory based on the photo's gallery and path
            // For now, we'll assume we can derive it from the gallery ID
            return photo.GalleryId;
        }
    }
}