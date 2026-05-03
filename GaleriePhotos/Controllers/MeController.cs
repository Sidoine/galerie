using System.Linq;
using System.Threading.Tasks;
using GaleriePhotos.Data;
using GaleriePhotos.ViewModels;
using GaleriePhotos.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using GaleriePhotos.Services;

namespace GaleriePhotos.Controllers
{
	[Authorize]
	[Route("api/me")]
	public class MeController : Controller
	{
		private readonly ApplicationDbContext applicationDbContext;
		private readonly UserManager<ApplicationUser> userManager;
		private readonly PhotoService photoService;

		public MeController(ApplicationDbContext applicationDbContext, UserManager<ApplicationUser> userManager, PhotoService photoService)
		{
			this.applicationDbContext = applicationDbContext;
			this.userManager = userManager;
			this.photoService = photoService;
		}

		[HttpGet("galleries")]
		public async Task<ActionResult<GalleryViewModel[]>> GetMyGalleries()
		{
			var userId = User.GetUserId();
			if (userId == null) return Unauthorized();
			var galleries = await applicationDbContext.GalleryMembers
				.Include(gm => gm.Gallery)
				.Where(gm => gm.UserId == userId)
				.ToArrayAsync();
			return Ok(galleries.Select(gm => new GalleryViewModel
			{
				Id = gm.Gallery.Id,
				Name = gm.Gallery.Name,
				RootDirectoryId = photoService.GetRootDirectory(gm.Gallery).Id
			}).ToArray());
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
