using GaleriePhotos.Data;
using GaleriePhotos.Models;
using GaleriePhotos.Services;
using Microsoft.AspNetCore.Authentication.BearerToken;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using System;
using System.Text.RegularExpressions;

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
                    var match = Regex.Match(url, @"postgres://(\w+):(\w+)@([\w\-\.]+):(\d+)/(\w+)");
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
                options.UseNpgsql(connectionString, x => x.UseVector());
            });

            services.AddIdentityApiEndpoints<ApplicationUser>(options =>
            {
                options.Password.RequireDigit = false;
                options.Password.RequireLowercase = false;
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequireUppercase = false;
                options.Password.RequiredLength = 4;
                options.SignIn.RequireConfirmedAccount = false;
            })
                .AddEntityFrameworkStores<ApplicationDbContext>();

            services.AddOptions<BearerTokenOptions>(IdentityConstants.BearerScheme)
                .Configure(options => options.RefreshTokenExpiration = TimeSpan.FromDays(30));

            services.AddControllersWithViews();
            services.AddRazorPages();

            // In production, the React files will be served from this directory
            services.AddSpaStaticFiles(configuration =>
            {
                configuration.RootPath = "ClientApp/dist";
            });

            services.Configure<SendGridOptions>(Configuration.GetSection("SendGrid"));
            services.Configure<SmtpOptions>(Configuration.GetSection("Smtp"));
            services.Configure<GalerieOptions>(Configuration.GetSection("Galerie"));
            services.Configure<AdministratorOptions>(Configuration.GetSection("Administrator"));
            services.AddSingleton<DataService>();
            services.AddScoped<PhotoService>();
            services.AddScoped<SeedingService>();
            services.AddScoped<FaceDetectionService>();
            services.AddHostedService<FaceDetectionBackgroundService>();
            services.AddScoped<GalleryService>();
            services.AddScoped<PlaceService>();
            services.AddHttpClient<PlaceService>();
            services.AddHostedService<PlaceLocationBackgroundService>();

            services.AddAuthorization(options =>
            {
                options.AddPolicy(Policies.Administrator, policy => policy.RequireClaim(Claims.Administrator, true.ToString()));
                // options.AddPolicy(Policies.Images, policy => policy.RequireAuthenticatedUser().AddAuthenticationSchemes("Identity.Application"));
                //options.FallbackPolicy = new AuthorizationPolicyBuilder()
                //    .RequireAuthenticatedUser()
                //    .Build();
            });
            // Choix dynamique entre SMTP et SendGrid
            var smtpSection = Configuration.GetSection("Smtp");
            var smtpHost = smtpSection.GetValue<string>("Host");
            if (!string.IsNullOrWhiteSpace(smtpHost))
            {
                // services.AddScoped<IEmailSender, SmtpEmailSender>();
                services.AddSingleton<IEmailSender<ApplicationUser>, SmtpEmailSender>();
            }
            else
            {
                services.AddSingleton<IEmailSender<ApplicationUser>, SendGridEmailSender>();
            }
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
            
            app.UseRouting();

            app.UseAuthentication();
            app.UseAuthorization();
            
            app.UseStaticFiles();
            app.UseSpaStaticFiles();
            
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllerRoute(
                    name: "default",
                    pattern: "{controller}/{action=Index}/{id?}");
                endpoints.MapRazorPages();
                endpoints.MapIdentityApi<ApplicationUser>();
            });

            app.UseSpa(spa => 
            {
                spa.Options.SourcePath = "ClientApp";
                spa.Options.PackageManagerCommand = "yarn";

                if (env.IsDevelopment())
                {
                    spa.UseProxyToSpaDevelopmentServer("http://localhost:8081/");
                }
            });
        }
    }
}
