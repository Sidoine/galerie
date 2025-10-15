using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using GaleriePhotos.Data;
using GaleriePhotos.Models;
using GaleriePhotos.Services;
using GaleriePhotos.ViewModels;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GaleriePhotos.Controllers;

[Route("api/galleries")]
public class GalleryMemberController : Controller
{
    private readonly ApplicationDbContext applicationDbContext;
    private readonly UserManager<ApplicationUser> userManager;
    private readonly GalleryService galleryService;

    public GalleryMemberController(ApplicationDbContext applicationDbContext, UserManager<ApplicationUser> userManager, GalleryService galleryService)
    {
        this.applicationDbContext = applicationDbContext;
        this.userManager = userManager;
        this.galleryService = galleryService;
    }

    [HttpGet("{galleryId}/members")]
    public async Task<ActionResult<GalleryMemberViewModel[]>> GetGalleryMembers(int galleryId)
    {
        var gallery = await galleryService.Get(galleryId);
        if (gallery == null) return NotFound("Gallery not found");

        if (!User.IsGalleryAdministrator(gallery))
            return Forbid();

        var galleryMembers = await applicationDbContext.GalleryMembers
            .Include(gm => gm.Gallery)
            .Include(gm => gm.User)
            .Where(gm => gm.GalleryId == galleryId)
            .ToArrayAsync();

        return Ok(galleryMembers.Select(gm => new GalleryMemberViewModel(gm)).ToArray());
    }

    [HttpPost("{galleryId}/members/{userId}")]
    public async Task<ActionResult<GalleryMemberViewModel>> AddUserToGallery(string userId, int galleryId, [FromBody] GalleryMemberPatchViewModel viewModel)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user == null) return NotFound("User not found");

        var gallery = await galleryService.Get(galleryId);
        if (gallery == null) return NotFound("Gallery not found");

        if (!User.IsGalleryAdministrator(gallery))
            return Forbid();

        var existingMember = await applicationDbContext.GalleryMembers
            .FirstOrDefaultAsync(gm => gm.UserId == userId && gm.GalleryId == galleryId);

        if (existingMember != null)
            return BadRequest("User is already a member of this gallery");

        var galleryMember = new GalleryMember(
            galleryId,
            userId,
            viewModel.DirectoryVisibility.IsSet ? viewModel.DirectoryVisibility.Value : 0,
            viewModel.IsAdministrator.IsSet && viewModel.IsAdministrator.Value
        )
        {
            Gallery = gallery,
            User = user
        };

        applicationDbContext.GalleryMembers.Add(galleryMember);
        await applicationDbContext.SaveChangesAsync();

        // Reload with navigation properties
        galleryMember = await applicationDbContext.GalleryMembers
            .Include(gm => gm.Gallery)
            .Include(gm => gm.User)
            .FirstAsync(gm => gm.Id == galleryMember.Id);

        return Ok(new GalleryMemberViewModel(galleryMember));
    }

    [HttpPatch("{galleryId}/members/{userId}")]
    public async Task<ActionResult<GalleryMemberViewModel>> UpdateUserGalleryMembership(string userId, int galleryId, [FromBody] GalleryMemberPatchViewModel viewModel)
    {
        var gallery = await galleryService.Get(galleryId);
        if (gallery == null) return NotFound();

        var galleryMember = await applicationDbContext.GalleryMembers
            .Include(gm => gm.Gallery)
            .Include(gm => gm.User)
            .FirstOrDefaultAsync(gm => gm.UserId == userId && gm.GalleryId == galleryId);

        if (galleryMember == null)
            return NotFound("Gallery membership not found");

            
        if (!User.IsGalleryAdministrator(gallery))
            return Forbid();

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

    [HttpDelete("{galleryId}/members/{userId}")]
    public async Task<ActionResult> RemoveUserFromGallery(string userId, int galleryId)
    {
        var gallery = await galleryService.Get(galleryId);
        if (gallery == null) return NotFound();
        
        if (!User.IsGalleryAdministrator(gallery))
            return Forbid();

        var galleryMember = await applicationDbContext.GalleryMembers
            .FirstOrDefaultAsync(gm => gm.UserId == userId && gm.GalleryId == galleryId);

        if (galleryMember == null)
            return NotFound("Gallery membership not found");

        applicationDbContext.GalleryMembers.Remove(galleryMember);
        await applicationDbContext.SaveChangesAsync();

        return Ok();
    }
}
