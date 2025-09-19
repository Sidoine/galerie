using System.Linq;
using System.Threading.Tasks;
using GaleriePhotos.Data;
using GaleriePhotos.ViewModels;
using GaleriePhotos.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;

namespace GaleriePhotos.Controllers
{
	[Authorize]
	[Route("api/me")]
	public class MeController : Controller
	{
		private readonly ApplicationDbContext applicationDbContext;
        private readonly UserManager<ApplicationUser> userManager;

        public MeController(ApplicationDbContext applicationDbContext, UserManager<ApplicationUser> userManager)
		{
			this.applicationDbContext = applicationDbContext;
            this.userManager = userManager;
        }

		[HttpGet("galleries")]
		public async Task<ActionResult<GalleryMemberViewModel[]>> GetMyGalleries()
		{
			var userId = User.GetUserId();
			if (userId == null) return Unauthorized();
			var galleryMembers = await applicationDbContext.GalleryMembers
				.Include(gm => gm.Gallery)
				.Include(gm => gm.User)
				.Where(gm => gm.UserId == userId)
				.ToArrayAsync();
			return Ok(galleryMembers.Select(gm => new GalleryMemberViewModel(gm)).ToArray());
		}
		

        [HttpGet("me")]
        [Authorize]
        public async Task<ActionResult<UserViewModel>> GetMe()
        {
            var user = await userManager.GetUserAsync(User);
            if (user == null) return NotFound();
            var claims = await applicationDbContext.UserClaims.Where(uc => uc.UserId == user.Id).ToArrayAsync();
            return Ok(new UserViewModel(user, claims));
        }
	}
}
