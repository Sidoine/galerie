using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.SpaServices.ReactDevelopmentServer;
using Microsoft.EntityFrameworkCore;
using GaleriePhotos.Data;
using GaleriePhotos.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using GaleriePhotos.Services;
using System;
using System.Text.RegularExpressions;
using System.Net;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity.UI.Services;

namespace GaleriePhotos
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddDatabaseDeveloperPageExceptionFilter();
            services.AddDbContext<ApplicationDbContext>(options =>
            {
                var connectionString = Configuration.GetConnectionString("DefaultConnection");
                string? url = Environment.GetEnvironmentVariable("DATABASE_URL");
                if (url != null)
                {
                    var match = Regex.Match(url, @"postgres://(\w+):(\w+)@([\w\-]+):(\d+)/(\w+)");
                    if (match.Success)
                    {
                        var userName = match.Groups[1].Value;
                        var password = match.Groups[2].Value;
                        var server = match.Groups[3].Value;
                        var port = match.Groups[4].Value;
                        var database = match.Groups[5].Value;
                        connectionString = $"Host={server};Port={port};User ID={userName};Password={password};Database={database}";
                    }
                }
                options.UseNpgsql(connectionString);
            });

            services.AddDefaultIdentity<ApplicationUser>(options =>
            {
                options.Password.RequireDigit = false;
                options.Password.RequireLowercase = false;
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequireUppercase = false;
                options.Password.RequiredLength = 4;
                options.SignIn.RequireConfirmedAccount = false;
            })
                .AddEntityFrameworkStores<ApplicationDbContext>();

            //services.AddIdentityServer(options =>
            //{
            //    options.PublicOrigin = Configuration["IdentityServer:PublicOrigin"];
            //    options.IssuerUri = options.PublicOrigin;
            //})
            services.AddIdentityServer().AddApiAuthorization<ApplicationUser, ApplicationDbContext>(options =>
                {
                    var apiResource = options.ApiResources[0];
                    apiResource.UserClaims.Add(Claims.Administrator);
                    apiResource.UserClaims.Add(Claims.Visibility);
                });

            services.AddAuthentication()
                .AddIdentityServerJwt();

            services.AddControllersWithViews();
            services.AddRazorPages();

            // In production, the React files will be served from this directory
            services.AddSpaStaticFiles(configuration =>
            {
                configuration.RootPath = "ClientApp/build";
            });

            services.Configure<SendGridOptions>(Configuration.GetSection("SendGrid"));
            services.Configure<GalerieOptions>(Configuration.GetSection("Galerie"));
            services.Configure<AdministratorOptions>(Configuration.GetSection("Administrator"));
            services.AddScoped<PhotoService>();
            services.AddScoped<SeedingService>();
            services.AddAuthorization(options =>
            {
                options.AddPolicy(Policies.Administrator, policy => policy.RequireClaim(Claims.Administrator, true.ToString()));
                options.AddPolicy(Policies.Images, policy => policy.RequireAuthenticatedUser().AddAuthenticationSchemes("Identity.Application"));
            });
            services.AddScoped<IEmailSender, EmailSender>();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
                app.UseMigrationsEndPoint();
            }
            else
            {
                app.UseExceptionHandler("/Error");
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                app.UseHsts();
            }

            app.UseHttpsRedirection();
            app.UseStaticFiles();
            app.UseSpaStaticFiles();

            app.UseRouting();

            app.UseAuthentication();
            app.UseIdentityServer();
            app.UseAuthorization();
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllerRoute(
                    name: "default",
                    pattern: "{controller}/{action=Index}/{id?}");
                endpoints.MapRazorPages();
            });

            app.UseSpa(spa =>
            {
                spa.Options.SourcePath = "ClientApp";

                if (env.IsDevelopment())
                {
                    spa.UseReactDevelopmentServer(npmScript: "start");
                }
            });
        }
    }
}
