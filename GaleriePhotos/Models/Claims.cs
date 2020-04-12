using System;
using System.Linq;
using System.Security.Claims;

namespace GaleriePhotos.Models
{
    public static class Claims
    {
        public const string Administrator = "Administrator";
        public const string Visibility = "Visibility";

        public static bool IsAdministrator(this ClaimsPrincipal claimsPrincipal)
        {
            return claimsPrincipal.HasClaim(Claims.Administrator, true.ToString());
        }

        public static DirectoryVisibility GetDirectoryVisibility(this ClaimsPrincipal claimsPrincipal)
        {
            var claim = claimsPrincipal.Claims.FirstOrDefault(x => x.Type == Claims.Visibility)?.Value;
            return claim != null ? Enum.Parse<DirectoryVisibility>(claim) : DirectoryVisibility.None;
        }
    }
}
