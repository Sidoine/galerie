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
            await this.applicationDbContext.SaveChangesAsync();
        }
    }
}
