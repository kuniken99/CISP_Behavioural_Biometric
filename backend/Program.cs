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
                    
                    // Configure max request body size for both Kestrel and IIS
                    webBuilder.ConfigureKestrel(options =>
                    {
                        options.Limits.MaxRequestBodySize = 524288000; // 500MB for large training batches
                    });
                });
    }
}