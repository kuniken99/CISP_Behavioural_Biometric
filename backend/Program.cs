// backend/Program.cs

using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;

namespace db_biometrics_mvp.Backend
{
    public class Program
    {
        public static void Main(string[] args)
        {
            CreateHostBuilder(args).Build().Run();
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.UseStartup<Startup>();
                    webBuilder.UseIISIntegration(); // Add IIS integration for Azure App Service
                    // Increase max request body size for large training data batches
                    // Default: 30MB, Increased: 500MB for up to 10,000 training samples
                    webBuilder.UseKestrel(options =>
                    {
                        options.Limits.MaxRequestBodySize = 524288000; // 500MB
                    });
                });
    }
}