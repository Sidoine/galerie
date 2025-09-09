using System;
using System.Linq;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using GaleriePhotos.Data;

namespace GaleriePhotos.Models
{
    public static class Claims
    {
        public const string Administrator = "Administrator";
        public const string Visibility = "Visibility";

        public static string? GetUserId(this ClaimsPrincipal claimsPrincipal)
        {
            return claimsPrincipal.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier)?.Value;
        }

        public static bool IsAdministrator(this ClaimsPrincipal claimsPrincipal)
        {
            return claimsPrincipal.HasClaim(Claims.Administrator, true.ToString());
        }

        public static DirectoryVisibility GetDirectoryVisibility(this ClaimsPrincipal claimsPrincipal)
        {
            var claim = claimsPrincipal.Claims.FirstOrDefault(x => x.Type == Claims.Visibility)?.Value;
            return claim != null ? Enum.Parse<DirectoryVisibility>(claim) : DirectoryVisibility.None;
        }

        // New method to get directory visibility from GalleryMember for a specific gallery
        public static DirectoryVisibility GetDirectoryVisibility(this ClaimsPrincipal claimsPrincipal, int galleryId, ApplicationDbContext context)
        {
            var userId = claimsPrincipal.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return DirectoryVisibility.None;

            var galleryMember = context.GalleryMembers
                .FirstOrDefault(gm => gm.UserId == userId && gm.GalleryId == galleryId);
            
            return galleryMember?.DirectoryVisibility ?? DirectoryVisibility.None;
        }

        public static bool IsDirectoryVisible(this ClaimsPrincipal claimsPrincipal, PhotoDirectory directory)
        {
            return claimsPrincipal.IsAdministrator() || (directory.Visibility & claimsPrincipal.GetDirectoryVisibility()) != 0;
        }

        // New method to check directory visibility using GalleryMember
        public static bool IsDirectoryVisible(this ClaimsPrincipal claimsPrincipal, PhotoDirectory directory, ApplicationDbContext context)
        {
            return claimsPrincipal.IsAdministrator() || 
                   (directory.Visibility & claimsPrincipal.GetDirectoryVisibility(directory.GalleryId, context)) != 0;
        }
    }
}
