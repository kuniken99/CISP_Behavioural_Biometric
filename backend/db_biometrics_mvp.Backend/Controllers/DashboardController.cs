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
        public async Task<IActionResult> GetDashboardMetrics()
        {
            // Simulate fetching real-time database metrics
            var metrics = new
            {
                Uptime = "12 days, 3 hours",
                CpuUsage = new Random().Next(10, 40),
                MemoryUsage = new Random().Next(500, 2000), // in MB
                DatabaseSize = new Random().Next(100, 500), // in GB
                ActiveUsers = new Random().Next(5, 50),
                TransactionsPerSecond = new Random().Next(500, 2000)
            };
            return Ok(metrics);
        }
    }
}