// backend/Controllers/DashboardController.cs
using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace db_biometrics_mvp.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Policy = "RequireDbaOrAdminRole")] // Only DBAs and Admins can view dashboard
    public class DashboardController : ControllerBase
    {
        [HttpGet("metrics")]
        public IActionResult GetDashboardMetrics()
        {
            var random = new Random();
            
            // Simulate fetching real-time database metrics
            var metrics = new
            {
                Uptime = "12 days, 3 hours",
                CpuUsage = random.Next(10, 40),
                MemoryUsage = random.Next(500, 2000), // in MB
                DatabaseSize = random.Next(100, 500), // in GB
                ActiveUsers = random.Next(5, 50),
                TransactionsPerSecond = random.Next(500, 2000),
                
                // System Health metrics that change on refresh
                SystemHealth = new
                {
                    DatabaseConnections = $"{random.Next(25, 85)}/100",
                    DiskSpace = $"{random.Next(15, 35) / 10.0:F1}TB free",
                    NetworkLatency = $"{random.Next(8, 25)}ms",
                    ErrorRate = $"{random.Next(1, 15) / 100.0:F2}%"
                }
            };
            return Ok(metrics);
        }
    }
}