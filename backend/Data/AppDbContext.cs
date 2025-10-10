// AppDbContext.cs
using Microsoft.EntityFrameworkCore;
using db_biometrics_mvp.Backend.Models;
using System;
using System.Security.Cryptography; // For password hashing
using System.Text;

namespace db_biometrics_mvp.Backend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; } = default!;
        public DbSet<AuditLog> AuditLogs { get; set; } = default!;
        public DbSet<DbConfiguration> DbConfigurations { get; set; } = default!;
        public DbSet<WebsiteContent> WebsiteContents { get; set; } = default!;
        public DbSet<Alert> Alerts { get; set; } = default!;
        
        // New tables for CBBA system
        public DbSet<DBAConsole> DBAConsoles { get; set; } = default!;
        public DbSet<PrivilegedAdministrator> PrivilegedAdministrators { get; set; } = default!;
        public DbSet<CBBA> CBBAs { get; set; } = default!;
        public DbSet<CaptchaVerification> CaptchaVerifications { get; set; } = default!;
        public DbSet<MouseMovement> MouseMovements { get; set; } = default!;
        public DbSet<KeyStroke> KeyStrokes { get; set; } = default!;
        public DbSet<BiometricProfile> BiometricProfiles { get; set; } = default!;
        public DbSet<SecurityLog> SecurityLogs { get; set; } = default!;
        public DbSet<RiskScore> RiskScores { get; set; } = default!;
        
        // Add new tables for authentication flow
        public DbSet<EmailVerificationToken> EmailVerificationTokens { get; set; } = default!;
        public DbSet<TwoFactorAuth> TwoFactorAuths { get; set; } = default!;
        public DbSet<PasswordResetToken> PasswordResetTokens { get; set; } = default!;

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.ConfigureWarnings(warnings =>
                warnings.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure decimal properties to avoid truncation warnings
            modelBuilder.Entity<BiometricProfile>()
                .Property(e => e.ProfileAccuracy)
                .HasPrecision(18, 6);
            
            modelBuilder.Entity<BiometricProfile>()
                .Property(e => e.ThresholdScore)
                .HasPrecision(18, 6);
            
            modelBuilder.Entity<CBBA>()
                .Property(e => e.Confidence)
                .HasPrecision(18, 6);
            
            modelBuilder.Entity<CBBA>()
                .Property(e => e.RiskScore)
                .HasPrecision(18, 6);
            
            modelBuilder.Entity<RiskScore>()
                .Property(e => e.BaselineScore)
                .HasPrecision(18, 6);
            
            modelBuilder.Entity<RiskScore>()
                .Property(e => e.BehavioralScore)
                .HasPrecision(18, 6);
            
            modelBuilder.Entity<RiskScore>()
                .Property(e => e.BiometricScore)
                .HasPrecision(18, 6);
            
            modelBuilder.Entity<RiskScore>()
                .Property(e => e.Confidence)
                .HasPrecision(18, 6);
            
            modelBuilder.Entity<RiskScore>()
                .Property(e => e.ContextualScore)
                .HasPrecision(18, 6);
            
            modelBuilder.Entity<RiskScore>()
                .Property(e => e.CurrentScore)
                .HasPrecision(18, 6);
            
            modelBuilder.Entity<RiskScore>()
                .Property(e => e.HistoricalScore)
                .HasPrecision(18, 6);
            
            modelBuilder.Entity<RiskScore>()
                .Property(e => e.PreviousScore)
                .HasPrecision(18, 6);
            
            modelBuilder.Entity<SecurityLog>()
                .Property(e => e.RiskScore)
                .HasPrecision(18, 6);

            // Seed initial data for MVP
            var adminPasswordHash = HashPassword("adminpass");
            var dbaPasswordHash = HashPassword("dbapass");

            modelBuilder.Entity<User>().HasData(
                new User { Id = 1, Username = "admin", Email = "admin@system.com", PasswordHash = adminPasswordHash, Role = "admin", IsActive = true, IsEmailVerified = true, IsTwoFactorEnabled = true },
                new User { Id = 2, Username = "dbauser", Email = "dba@system.com", PasswordHash = dbaPasswordHash, Role = "dba", IsActive = true, IsEmailVerified = true, IsTwoFactorEnabled = true },
                new User { Id = 3, Username = "testuser", Email = "test@system.com", PasswordHash = dbaPasswordHash, Role = "user", IsActive = true, IsEmailVerified = true, IsTwoFactorEnabled = false },
                new User { Id = 4, Username = "tank108", Email = "tank108@uni.coventry.ac.uk", PasswordHash = adminPasswordHash, Role = "admin", IsActive = true, IsEmailVerified = true, IsTwoFactorEnabled = true }
            );

            modelBuilder.Entity<DbConfiguration>().HasData(
                new DbConfiguration { Id = 1 } // Default configuration
            );

            modelBuilder.Entity<WebsiteContent>().HasData(
                new WebsiteContent { Id = 1, Content = "# Welcome to DBA Admin Console\n\nThis is a placeholder for website content." }
            );

            // Fix: Use static DateTime values for HasData to avoid the "PendingModelChangesWarning"
            modelBuilder.Entity<AuditLog>().HasData(
                new AuditLog { Id = 1, Timestamp = new DateTime(2025, 8, 23, 17, 0, 0, DateTimeKind.Utc), Username = "system", Action = "DB_INIT", Details = "Initial database migration completed.", IpAddress = "127.0.0.1" }
            );

            modelBuilder.Entity<Alert>().HasData(
                new Alert { Id = 1, Timestamp = new DateTime(2025, 8, 23, 16, 55, 0, DateTimeKind.Utc), Type = "Security", Message = "Failed login attempt for 'baduser'", Severity = "Medium", Status = "Active" },
                new Alert { Id = 2, Timestamp = new DateTime(2025, 8, 23, 16, 40, 0, DateTimeKind.Utc), Type = "Performance", Message = "High CPU usage detected on primary DB server", Severity = "Low", Status = "Active" }
            );
        }

        private static string HashPassword(string password)
        {
            using (var sha256 = System.Security.Cryptography.SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes(password));
                return BitConverter.ToString(hashedBytes).Replace("-", "").ToLower();
            }
        }
    }
}