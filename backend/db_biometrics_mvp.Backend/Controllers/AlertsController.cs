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
            var alerts = await _context.Alerts.Where(a => a.Status == "Active").OrderByDescending(a => a.Timestamp).ToListAsync();
            return Ok(alerts);
        }
    }
}