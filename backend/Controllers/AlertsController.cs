// backend/Controllers/AlertsController.cs
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using db_biometrics_mvp.Backend.Data;

namespace db_biometrics_mvp.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Policy = "RequireDbaOrAdminRole")] // DBAs and Admins can view alerts
    public class AlertsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AlertsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("get-alerts")]
        public async Task<IActionResult> GetActiveAlerts()
        {
            var alerts = await _context.Alerts.OrderByDescending(a => a.Timestamp).ToListAsync();
            
            // If no alerts exist, provide some sample data
            if (!alerts.Any())
            {
                var random = new Random();
                var sampleAlerts = new[]
                {
                    new { 
                        Id = 1,
                        Timestamp = DateTime.Now.AddMinutes(-15),
                        Type = "Security",
                        Message = "Failed login attempt for user 'admin' from IP 192.168.1.100",
                        Severity = "High",
                        Status = "Active"
                    },
                    new { 
                        Id = 2,
                        Timestamp = DateTime.Now.AddMinutes(-30),
                        Type = "Performance",
                        Message = $"High CPU usage detected ({random.Next(75, 95)}%)",
                        Severity = "Medium",
                        Status = "Active"
                    },
                    new { 
                        Id = 3,
                        Timestamp = DateTime.Now.AddMinutes(-45),
                        Type = "Security",
                        Message = "Suspicious database access pattern detected",
                        Severity = "High",
                        Status = "Active"
                    },
                    new { 
                        Id = 4,
                        Timestamp = DateTime.Now.AddHours(-1),
                        Type = "Performance",
                        Message = $"Memory usage exceeds threshold ({random.Next(80, 95)}%)",
                        Severity = "Medium",
                        Status = "Resolved"
                    },
                    new { 
                        Id = 5,
                        Timestamp = DateTime.Now.AddHours(-2),
                        Type = "System",
                        Message = "Database backup completed successfully",
                        Severity = "Low",
                        Status = "Resolved"
                    }
                };
                
                return Ok(sampleAlerts);
            }
            
            return Ok(alerts);
        }
    }
}