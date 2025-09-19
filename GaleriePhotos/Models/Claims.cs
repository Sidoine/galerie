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

        public static bool IsGalleryAdministrator(this ClaimsPrincipal claimsPrincipal, Gallery gallery)
        {
            if (claimsPrincipal.IsAdministrator()) return true; // global admin
            var userId = claimsPrincipal.GetUserId();
            if (userId == null) return false;
            return gallery.Members.Any(gm => gm.UserId == userId && gm.IsAdministrator);
        }
    }
}
