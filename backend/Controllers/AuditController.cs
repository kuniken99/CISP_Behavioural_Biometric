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
        public async Task<IActionResult> GetActivityLogs([FromQuery] int limit = 50)
        {
            // Optimize query by only selecting needed fields and limiting results
            var logs = await _context.AuditLogs
                .AsNoTracking() // Don't track changes for read-only data
                .OrderByDescending(l => l.Timestamp)
                .Take(Math.Min(limit, 100)) // Allow dynamic limit but cap at 100
                .Select(l => new {
                    l.Id,
                    l.Timestamp,
                    l.Username,
                    l.Action,
                    l.Details,
                    l.IpAddress
                })
                .ToListAsync();

            return Ok(logs);
        }
    }
}