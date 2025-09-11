using System.Linq;
using System.Threading.Tasks;
using GaleriePhotos.Data;
using GaleriePhotos.ViewModels;
using GaleriePhotos.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GaleriePhotos.Controllers
{
	[Authorize]
	[Route("api/me")]
	public class MeController : Controller
	{
		private readonly ApplicationDbContext applicationDbContext;
		public MeController(ApplicationDbContext applicationDbContext)
		{
			this.applicationDbContext = applicationDbContext;
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
	}
}
