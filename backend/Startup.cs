// backend/Startup.cs

using System;
using System.Net.Http;
using System.Text;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using db_biometrics_mvp.Backend.Services;
using db_biometrics_mvp.Backend.Data;
using db_biometrics_mvp.Backend.Middleware;

namespace db_biometrics_mvp.Backend
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        public void ConfigureServices(IServiceCollection services)
        {
            // Add MVC Controllers to the service collection
            services.AddControllers()
                .AddJsonOptions(options =>
                {
                    options.JsonSerializerOptions.MaxDepth = 64; // Increase max depth for nested objects
                });

            // Configure Kestrel to accept larger requests (500MB for training data)
            services.Configure<Microsoft.AspNetCore.Server.Kestrel.Core.KestrelServerOptions>(options =>
            {
                options.Limits.MaxRequestBodySize = 524288000; // 500 MB (for up to 10,000 training samples)
            });

            // Configure SQL Server DbContext using the connection string from appsettings.json
            services.AddDbContext<AppDbContext>(options =>
                options.UseSqlServer(
                    Configuration.GetConnectionString("DefaultConnection"),
                    sqlServerOptionsAction: sqlOptions =>
                    {
                        sqlOptions.EnableRetryOnFailure(
                            maxRetryCount: 5, // Number of retry attempts
                            maxRetryDelay: TimeSpan.FromSeconds(30), // Max delay between retries
                            errorNumbersToAdd: null); // Use default transient error codes
                    }));
                
            // Configure JWT Authentication
            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            }).AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = Configuration["Jwt:Issuer"],
                    ValidAudience = Configuration["Jwt:Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Configuration["Jwt:Key"]!))
                };
            });

            // Configure Authorization Policies for role-based access control
            services.AddAuthorization(options =>
            {
                options.AddPolicy("RequireAdminRole", policy => policy.RequireRole("admin"));
                options.AddPolicy("RequireDbaOrAdminRole", policy => policy.RequireRole("dba", "admin"));
            });

            // Register the PythonCBBAService and HttpClient
            services.AddHttpClient<PythonCBBAService>();

            // Register the reCAPTCHA service
            services.AddHttpClient<IRecaptchaService, RecaptchaService>();

            // Register the Email service
            services.AddScoped<IEmailService, EmailService>();

            // Register the Two-Factor Authentication service
            services.AddScoped<ITwoFactorAuthService, TwoFactorAuthService>();

            // Register the Auto-Training service
            services.AddSingleton<IAutoTrainingService, AutoTrainingService>();

            // Configure Session with in-memory cache
            services.AddDistributedMemoryCache(); // Required for session storage
            services.AddSession(options =>
            {
                options.IdleTimeout = TimeSpan.FromMinutes(30); // Session timeout after 30 minutes of inactivity
                options.Cookie.HttpOnly = true; // Make the session cookie HTTP-only for security
                options.Cookie.IsEssential = true; // Mark as essential for GDPR compliance
                options.Cookie.SameSite = Microsoft.AspNetCore.Http.SameSiteMode.Lax; // CSRF protection
            });

            // Configure CORS
           

            services.AddCors(options =>
            {
                options.AddPolicy("FrontendPolicy", builder =>
                {
                    builder.WithOrigins(
                            "https://cbba.app", // Custom domain
                            "http://localhost:3000",
                            "https://n4r8cp9x-3000.asse.devtunnels.ms", // update this if tunnel changes
                            "https://csip-ken.vercel.app", // Vercel production domain
                            "https://csip-hfje2gfkh-kens-projects-7a196530.vercel.app", // Vercel deployment
                            "https://csip-e6mnv2p2g-kens-projects-7a196530.vercel.app", // Vercel previous deployment
                            "https://csip-efn15ogfn-kens-projects-7a196530.vercel.app"  // Vercel deployment
                        )
                        .SetIsOriginAllowedToAllowWildcardSubdomains()
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials();
                });
            });
        }

        // This method is called by the runtime to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            // Apply any pending database migrations on application startup
            // Temporarily disabled due to PendingModelChangesWarning
            /*using (var scope = app.ApplicationServices.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                dbContext.Database.Migrate();
            }*/

            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            app.UseRouting();

            // Use the CORS middleware before Authentication and Authorization
            app.UseCors("FrontendPolicy");

            // Enable Session middleware (must be before authentication)
            app.UseSession();

            // Enable Authentication and Authorization middleware
            app.UseAuthentication();
            app.UseAuthorization();

            // Add Session Tracking Middleware (after authentication)
            app.UseMiddleware<SessionTrackingMiddleware>();

            // Map incoming requests to controller actions
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
            });
        }
    }
}