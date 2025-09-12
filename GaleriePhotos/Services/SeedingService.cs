using GaleriePhotos.Data;
using GaleriePhotos.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace GaleriePhotos.Services
{
    public class SeedingService
    {
        private readonly ApplicationDbContext applicationDbContext;
        private readonly UserManager<ApplicationUser> userManager;
        private readonly IOptions<AdministratorOptions> options;

        public SeedingService(ApplicationDbContext applicationDbContext, UserManager<ApplicationUser> userManager, IOptions<AdministratorOptions> options)
        {
            this.applicationDbContext = applicationDbContext;
            this.userManager = userManager;
            this.options = options;
        }

        public async Task Seed()
        {
            await this.applicationDbContext.Database.MigrateAsync();
            if (!await this.applicationDbContext.Users.AnyAsync() && options.Value.Login != null && options.Value.Password != null)
            {
                var user = new ApplicationUser { Email = options.Value.Login, UserName = options.Value.Login, EmailConfirmed = true };
                var result = await this.userManager.CreateAsync(user, options.Value.Password);
                if (result.Succeeded)
                {
                    await this.userManager.AddClaimAsync(user, new Claim(Claims.Administrator, true.ToString()));
                }
            }
            
            if (!await this.applicationDbContext.UserClaims.AnyAsync())
            {
                var user = await this.applicationDbContext.Users.FirstAsync();
                await userManager.AddClaimAsync(user, new Claim(Claims.Administrator, true.ToString())); 
            }

            // Seed default directory visibilities for galleries that don't have any
            await SeedDefaultDirectoryVisibilities();
            
            await this.applicationDbContext.SaveChangesAsync();
        }

        private async Task SeedDefaultDirectoryVisibilities()
        {
            var galleries = await this.applicationDbContext.Galleries
                .Where(g => !this.applicationDbContext.GalleryDirectoryVisibilities.Any(v => v.GalleryId == g.Id))
                .ToListAsync();

            foreach (var gallery in galleries)
            {
                var defaultVisibilities = new[]
                {
                    new GalleryDirectoryVisibility
                    {
                        Name = "Mylene",
                        Icon = """<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12,2A2,2 0 0,1 14,4A2,2 0 0,1 12,6A2,2 0 0,1 10,4A2,2 0 0,1 12,2M10.5,22V16H7.5L10.09,8.41C10.34,7.59 11.1,7 12,7C12.9,7 13.66,7.59 13.91,8.41L16.5,16H13.5V22H10.5Z" /></svg>""",
                        Value = 1,
                        GalleryId = gallery.Id,
                        Gallery = gallery
                    },
                    new GalleryDirectoryVisibility
                    {
                        Name = "Sidoine",
                        Icon = """<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M11.95,9.27C13.96,9.27 15.59,7.64 15.59,5.63C15.59,3.63 13.96,2 11.95,2C9.94,2 8.32,3.63 8.32,5.63C8.32,7.64 9.94,9.27 11.95,9.27M9.36,12.97C9.36,12.97 8.27,15.94 7.96,16.5C7.85,16.71 7.87,16.77 7.6,16.77C7.33,16.77 6.91,16.5 6.91,16.5C6.91,16.5 6.71,16.37 6.79,16.14C7.03,15.4 8.12,11.08 8.35,10.25C8.6,9.36 9.28,9.39 9.28,9.39H9.93L12.03,13.04L14.14,9.39H14.92C14.92,9.39 15.23,9.43 15.46,9.7C15.7,9.97 15.75,10.44 15.75,10.44L17.14,15.84C17.14,15.84 17.24,16.22 17.21,16.33C17.17,16.5 17.08,16.5 17.08,16.5C17.08,16.5 16.69,16.62 16.47,16.69C16.07,16.82 16,16.44 16,16.44L14.7,13.04L14.55,22H12.6L12.27,16.89C12.27,16.89 12.21,16.76 12.03,16.76C11.86,16.76 11.8,16.89 11.8,16.89L11.45,22H9.5L9.37,12.97H9.36Z" /></svg>""",
                        Value = 2,
                        GalleryId = gallery.Id,
                        Gallery = gallery
                    }
                };

                this.applicationDbContext.GalleryDirectoryVisibilities.AddRange(defaultVisibilities);
            }
        }
    }
}
