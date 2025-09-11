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
    [Authorize(Policy = Policies.Administrator)]
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
        public async Task<ActionResult<UserViewModel[]>> GetAll()
        {
            var user = await this.applicationDbContext.Users.ToArrayAsync();
            var userClaims = applicationDbContext.UserClaims.AsEnumerable().GroupBy(x => x.UserId).ToDictionary(x => x.Key, x => x.ToArray());
            return Ok(user.Select(x => new UserViewModel(x, userClaims.TryGetValue(x.Id, out var claims) ? claims : new IdentityUserClaim<string>[0])).ToArray());
        }

        [HttpPatch("{id}")]
        public async Task<ActionResult> Patch(string id, [FromBody]UserPatchViewModel viewModel)
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

        [HttpGet("administrator")]
        public ActionResult<bool> IsAdministrator()
        {
            return Ok(this.User.Claims.Any(x => x.Type == Claims.Administrator && x.Value == true.ToString()));
        }

        [HttpGet("{userId}/galleries")]
        public async Task<ActionResult<GalleryMemberViewModel[]>> GetUserGalleries(string userId)
        {
            var galleryMembers = await applicationDbContext.GalleryMembers
                .Include(gm => gm.Gallery)
                .Include(gm => gm.User)
                .Where(gm => gm.UserId == userId)
                .ToArrayAsync();
            
            return Ok(galleryMembers.Select(gm => new GalleryMemberViewModel(gm)).ToArray());
        }

        [HttpPost("{userId}/galleries/{galleryId}")]
        public async Task<ActionResult<GalleryMemberViewModel>> AddUserToGallery(string userId, int galleryId, [FromBody]GalleryMemberPatchViewModel viewModel)
        {
            var user = await userManager.FindByIdAsync(userId);
            if (user == null) return NotFound("User not found");
            
            var gallery = await applicationDbContext.Galleries.FindAsync(galleryId);
            if (gallery == null) return NotFound("Gallery not found");

            var existingMember = await applicationDbContext.GalleryMembers
                .FirstOrDefaultAsync(gm => gm.UserId == userId && gm.GalleryId == galleryId);
            
            if (existingMember != null) 
                return BadRequest("User is already a member of this gallery");

            var galleryMember = new GalleryMember(
                galleryId,
                userId,
                viewModel.DirectoryVisibility.IsSet ? viewModel.DirectoryVisibility.Value : DirectoryVisibility.None,
                viewModel.IsAdministrator.IsSet && viewModel.IsAdministrator.Value
            );

            applicationDbContext.GalleryMembers.Add(galleryMember);
            await applicationDbContext.SaveChangesAsync();

            // Reload with navigation properties
            galleryMember = await applicationDbContext.GalleryMembers
                .Include(gm => gm.Gallery)
                .Include(gm => gm.User)
                .FirstAsync(gm => gm.Id == galleryMember.Id);

            return Ok(new GalleryMemberViewModel(galleryMember));
        }

        [HttpPatch("{userId}/galleries/{galleryId}")]
        public async Task<ActionResult<GalleryMemberViewModel>> UpdateUserGalleryMembership(string userId, int galleryId, [FromBody]GalleryMemberPatchViewModel viewModel)
        {
            var galleryMember = await applicationDbContext.GalleryMembers
                .Include(gm => gm.Gallery)
                .Include(gm => gm.User)
                .FirstOrDefaultAsync(gm => gm.UserId == userId && gm.GalleryId == galleryId);
                
            if (galleryMember == null) 
                return NotFound("Gallery membership not found");

            if (viewModel.DirectoryVisibility.IsSet)
            {
                galleryMember.DirectoryVisibility = viewModel.DirectoryVisibility.Value;
            }
            if (viewModel.IsAdministrator.IsSet)
            {
                galleryMember.IsAdministrator = viewModel.IsAdministrator.Value;
            }

            await applicationDbContext.SaveChangesAsync();
            
            return Ok(new GalleryMemberViewModel(galleryMember));
        }

        [HttpDelete("{userId}/galleries/{galleryId}")]
        public async Task<ActionResult> RemoveUserFromGallery(string userId, int galleryId)
        {
            var galleryMember = await applicationDbContext.GalleryMembers
                .FirstOrDefaultAsync(gm => gm.UserId == userId && gm.GalleryId == galleryId);
                
            if (galleryMember == null) 
                return NotFound("Gallery membership not found");

            applicationDbContext.GalleryMembers.Remove(galleryMember);
            await applicationDbContext.SaveChangesAsync();
            
            return Ok();
        }
    }
}
