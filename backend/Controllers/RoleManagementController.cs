// backend/Controllers/RoleManagementController.cs
using System;
using System.Collections.Generic;
using System.Linq;
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
    [Authorize(Policy = "RequireAdminRole")] // Only Admins can manage roles
    public class RoleManagementController : ControllerBase
    {
        private readonly AppDbContext _context;
        private static readonly List<string> _availableRoles = new List<string> { "user", "dba", "admin" }; // Hardcoded roles for MVP

        public RoleManagementController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("roles")]
        public IActionResult GetRoles()
        {
            return Ok(_availableRoles.Select(r => new { Name = r }));
        }

        [HttpPost("assign-role")]
        public async Task<IActionResult> AssignRoleToUser([FromBody] AssignRoleDto dto)
        {
            var user = await _context.Users.FindAsync(dto.UserId);
            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }
            if (!_availableRoles.Contains(dto.RoleName))
            {
                return BadRequest(new { message = "Invalid role name." });
            }

            user.Role = dto.RoleName;
            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            // Log activity
            await _context.AuditLogs.AddAsync(new AuditLog { Username = User.Identity?.Name ?? "Unknown", Action = "ASSIGN_ROLE", Details = $"Assigned role '{dto.RoleName}' to user: {user.Username}", IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "N/A" });
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Role '{dto.RoleName}' assigned to user {user.Username}." });
        }
    }
}