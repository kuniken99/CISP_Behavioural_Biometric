// backend/Controllers/ConfigController.cs
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using db_biometrics_mvp.Backend.Data;
using db_biometrics_mvp.Backend.Models;

namespace db_biometrics_mvp.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Policy = "RequireAdminRole")] // Only Admins can change DB config
    public class ConfigController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ConfigController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("get-config")]
        public async Task<IActionResult> GetDbConfiguration()
        {
            var config = await _context.DbConfigurations.FirstOrDefaultAsync() ?? new DbConfiguration(); // Get first config or new default

            // Log activity
            await _context.AuditLogs.AddAsync(new AuditLog { Username = User.Identity?.Name ?? "Unknown", Action = "VIEW_DB_CONFIG", Details = "Viewed database configuration.", IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "N/A" });
            await _context.SaveChangesAsync();

            return Ok(config);
        }

        [HttpPut("update-config")]
        public async Task<IActionResult> UpdateDbConfiguration([FromBody] DbConfiguration updatedConfig)
        {
            var config = await _context.DbConfigurations.FirstOrDefaultAsync();
            if (config == null)
            {
                _context.DbConfigurations.Add(updatedConfig);
            }
            else
            {
                config.MaxConnections = updatedConfig.MaxConnections;
                config.QueryTimeoutSeconds = updatedConfig.QueryTimeoutSeconds;
                config.BackupSchedule = updatedConfig.BackupSchedule;
                config.EnableAuditing = updatedConfig.EnableAuditing;
                config.LogLevel = updatedConfig.LogLevel;
                _context.DbConfigurations.Update(config);
            }
            await _context.SaveChangesAsync();

            // Log activity
            await _context.AuditLogs.AddAsync(new AuditLog { Username = User.Identity?.Name ?? "Unknown", Action = "UPDATE_DB_CONFIG", Details = "Updated database configuration parameters.", IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "N/A" });
            await _context.SaveChangesAsync();

            return Ok(new { message = "Database configuration updated successfully." });
        }
    }
}