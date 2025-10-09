// backend/Controllers/AuditController.cs
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
    [Authorize(Policy = "RequireDbaOrAdminRole")] // DBAs and Admins can view audit logs
    public class AuditController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuditController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("activity-logs")]
        public async Task<IActionResult> GetActivityLogs()
        {
            var logs = await _context.AuditLogs.OrderByDescending(l => l.Timestamp).Take(100).ToListAsync(); // Get last 100 logs
            return Ok(logs);
        }
    }
}