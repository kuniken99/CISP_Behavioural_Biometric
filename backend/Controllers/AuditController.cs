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
        public async Task<IActionResult> GetActivityLogs([FromQuery] int limit = 50, [FromQuery] int page = 1)
        {
            // Calculate pagination
            var pageSize = Math.Min(limit, 50); // Cap at 50 for performance
            var skip = (page - 1) * pageSize;

            try
            {
                // Optimize query with pagination and caching
                var logs = await _context.AuditLogs
                    .AsNoTracking() // Don't track changes for read-only data
                    .OrderByDescending(l => l.Timestamp)
                    .Skip(skip)
                    .Take(pageSize)
                    .Select(l => new {
                        l.Id,
                        l.Timestamp,
                        l.Username,
                        l.Action,
                        l.Details
                    })
                    .ToListAsync();

                // Get total count for pagination info (only when needed)
                var totalCount = page == 1 ? await _context.AuditLogs.CountAsync() : 0;

                return Ok(new { 
                    logs = logs,
                    totalCount = totalCount,
                    currentPage = page,
                    pageSize = pageSize,
                    hasMore = logs.Count == pageSize
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching activity logs", error = ex.Message });
            }
        }
    }
}