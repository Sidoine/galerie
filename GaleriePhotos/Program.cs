using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.ApplicationParts;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Folke.CsTsService;
using Microsoft.Extensions.Options;
using GaleriePhotos.Data;
using Microsoft.EntityFrameworkCore;
using GaleriePhotos.Services;
using Microsoft.Extensions.Hosting;

namespace GaleriePhotos
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            IWebHost webHost = CreateWebHostBuilder(args).Build();

            using (var scope = webHost.Services.CreateScope())
            {
                var services = scope.ServiceProvider;

                try { 
                    var seedingService = services.GetRequiredService<SeedingService>();
                    await seedingService.Seed();
                }
                catch (Exception ex)
                {
                    var logger = services.GetRequiredService<ILogger<Program>>();
                    logger.LogError(ex, "An error occurred while seeding the database.");
                }

                var env = services.GetRequiredService<IOptions<GalerieOptions>>();
                if (env.Value.GenerateTypeScript)
                {
                    try
                    {

                        services.GetRequiredService<ApplicationPartManager>().CreateTypeScriptServices("ClientApp/src/services", 0);
                    }
                    catch (Exception ex)
                    {
                        var logger = services.GetRequiredService<ILogger<Program>>();
                        logger.LogError(ex, "An error occurred while generating the services.");
                    }
                }
            }
            webHost.Run();
        }

        public static IWebHostBuilder CreateWebHostBuilder(string[] args)
        {
            var builder = WebHost.CreateDefaultBuilder(args);
            string? port = Environment.GetEnvironmentVariable("PORT");
            if (port != null)
            {
                builder.UseUrls($"http://*:{port}");
            }
            builder.UseStartup<Startup>();
            builder.ConfigureAppConfiguration((hostContext, builder) =>
            {
                if (hostContext.HostingEnvironment.IsDevelopment())
                {
                    builder.AddUserSecrets<Program>();
                }
            });
            return builder;
        }

    }
}
