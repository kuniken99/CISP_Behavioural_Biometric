// backend/Models/User.cs
using System.ComponentModel.DataAnnotations;

namespace db_biometrics_mvp.Backend.Models
{
    public class User
    {
        public int Id { get; set; }
        [Required]
        public string Username { get; set; } = string.Empty;
        [Required]
        public string PasswordHash { get; set; } = string.Empty; // Store hashed passwords
        public string Role { get; set; } = "user"; // "user", "dba", "admin"
        public bool IsActive { get; set; } = true;
    }

    // DTO for user creation
    public class UserCreateDto
    {
        [Required]
        public string Username { get; set; } = string.Empty;
        [Required]
        public string Password { get; set; } = string.Empty;
        public string Role { get; set; } = "user";
    }

    // DTO for user update
    public class UserUpdateDto
    {
        public int UserId { get; set; }
        public string? Username { get; set; }
        public string? Role { get; set; }
        public bool? IsActive { get; set; }
        public string? NewPassword { get; set; }
    }

    // DTO for login
    public class LoginDto
    {
        [Required]
        public string Username { get; set; } = string.Empty;
        [Required]
        public string Password { get; set; } = string.Empty;
    }

    // DTO for role assignment
    public class AssignRoleDto
    {
        public int UserId { get; set; }
        public string RoleName { get; set; } = string.Empty;
    }

    // DTO for toggle user status
    public class ToggleUserStatusDto
    {
        public int UserId { get; set; }
        public bool IsActive { get; set; }
    }
}