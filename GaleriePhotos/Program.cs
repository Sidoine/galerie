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

namespace GaleriePhotos
{
    public class Program
    {
        public static void Main(string[] args)
        {
            IWebHost webHost = CreateWebHostBuilder(args).Build();

            using (var scope = webHost.Services.CreateScope())
            {
                var services = scope.ServiceProvider;
                var env = services.GetService<IOptions<GalerieOptions>>();
                if (env.Value.GenerateTypeScript)
                {
                    services.GetService<ApplicationPartManager>().CreateTypeScriptServices("ClientApp/src/services", 0);
                }
            }
            webHost.Run();
        }

        public static IWebHostBuilder CreateWebHostBuilder(string[] args) =>
            WebHost.CreateDefaultBuilder(args)
                .UseStartup<Startup>();
    }
}
