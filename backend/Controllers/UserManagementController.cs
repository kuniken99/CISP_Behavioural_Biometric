// backend/Controllers/UserManagementController.cs
using System;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
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
    [Authorize(Policy = "RequireAdminRole")] // Only Admins can manage users
    public class UserManagementController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UserManagementController(AppDbContext context)
        {
            _context = context;
        }

        // Helper for password hashing (match AppDbContext)
        private static string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                return BitConverter.ToString(hashedBytes).Replace("-", "").ToLower();
            }
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _context.Users
                                    .Select(u => new { u.Id, u.Username, u.Role, u.IsActive })
                                    .ToListAsync();

            // Log activity
            await _context.AuditLogs.AddAsync(new AuditLog { Username = User.Identity?.Name ?? "Unknown", Action = "VIEW_USERS", Details = "Viewed all system users.", IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "N/A" });
            await _context.SaveChangesAsync();

            return Ok(users);
        }

        [HttpPost("create-user")]
        public async Task<IActionResult> CreateUser([FromBody] UserCreateDto dto)
        {
            if (await _context.Users.AnyAsync(u => u.Username == dto.Username))
            {
                return BadRequest(new { message = "Username already exists." });
            }

            var newUser = new User
            {
                Username = dto.Username,
                PasswordHash = HashPassword(dto.Password),
                Role = dto.Role,
                IsActive = true
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            // Log activity
            await _context.AuditLogs.AddAsync(new AuditLog { Username = User.Identity?.Name ?? "Unknown", Action = "CREATE_USER", Details = $"Created user: {newUser.Username} with role: {newUser.Role}", IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "N/A" });
            await _context.SaveChangesAsync();

            return Ok(new { message = "User created successfully." });
        }

        [HttpPut("update-user")]
        public async Task<IActionResult> UpdateUser([FromBody] UserUpdateDto dto)
        {
            var user = await _context.Users.FindAsync(dto.UserId);
            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            if (!string.IsNullOrEmpty(dto.Username) && user.Username != dto.Username && await _context.Users.AnyAsync(u => u.Username == dto.Username))
            {
                return BadRequest(new { message = "New username already exists." });
            }

            user.Username = dto.Username ?? user.Username;
            user.Role = dto.Role ?? user.Role;
            user.IsActive = dto.IsActive ?? user.IsActive;

            if (!string.IsNullOrEmpty(dto.NewPassword))
            {
                user.PasswordHash = HashPassword(dto.NewPassword);
            }

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            // Log activity
            await _context.AuditLogs.AddAsync(new AuditLog { Username = User.Identity?.Name ?? "Unknown", Action = "UPDATE_USER", Details = $"Updated user: {user.Username} (ID: {user.Id})", IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "N/A" });
            await _context.SaveChangesAsync();

            return Ok(new { message = "User updated successfully." });
        }

        [HttpPost("toggle-user-status")]
        public async Task<IActionResult> ToggleUserStatus([FromBody] ToggleUserStatusDto dto)
        {
            var user = await _context.Users.FindAsync(dto.UserId);
            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            user.IsActive = dto.IsActive;
            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            // Log activity
            await _context.AuditLogs.AddAsync(new AuditLog { Username = User.Identity?.Name ?? "Unknown", Action = "TOGGLE_USER_STATUS", Details = $"User {user.Username} set to IsActive: {user.IsActive}", IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "N/A" });
            await _context.SaveChangesAsync();

            return Ok(new { message = "User status updated successfully." });
        }
    }
}