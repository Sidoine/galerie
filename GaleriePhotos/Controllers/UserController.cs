using GaleriePhotos.Data;
using GaleriePhotos.Models;
using GaleriePhotos.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace GaleriePhotos.Controllers
{
    [Route("api/users")]
    public class UserController : Controller
    {
        private readonly ApplicationDbContext applicationDbContext;
        private readonly UserManager<ApplicationUser> userManager;

        public UserController(ApplicationDbContext applicationDbContext, UserManager<ApplicationUser> userManager)
        {
            this.applicationDbContext = applicationDbContext;
            this.userManager = userManager;
        }

        [HttpGet("")]
        [Authorize]
        public async Task<ActionResult<UserViewModel[]>> GetAll()
        {
            // TODO add an API to get the user id by email instead of listing all the users to any authenticated user
            var user = await this.applicationDbContext.Users.ToArrayAsync();
            var userClaims = applicationDbContext.UserClaims.AsEnumerable().GroupBy(x => x.UserId).ToDictionary(x => x.Key, x => x.ToArray());
            return Ok(user.Select(x => new UserViewModel(x, userClaims.TryGetValue(x.Id, out var claims) ? claims : new IdentityUserClaim<string>[0])).ToArray());
        }

        [HttpPatch("{id}")]
        [Authorize(Policy = Policies.Administrator)]
        public async Task<ActionResult> Patch(string id, [FromBody] UserPatchViewModel viewModel)
        {
            var user = await userManager.FindByIdAsync(id);
            if (user == null) return NotFound();
            if (viewModel.Administrator.IsSet)
            {
                if (viewModel.Administrator.Value)
                {
                    await userManager.AddClaimAsync(user, new Claim(Claims.Administrator, true.ToString()));
                }
                else
                {
                    var claims = await userManager.GetClaimsAsync(user);
                    var claim = claims.FirstOrDefault(x => x.Type == Claims.Administrator);
                    if (claim != null) await userManager.RemoveClaimAsync(user, claim);
                }
            }

            // NOTE: DirectoryVisibility is now managed through GalleryMember, not claims
            // Use the new GalleryMember endpoints instead

            return Ok();
        }
    }
}
