// backend/Models/PrivilegedAdministrator.cs
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace db_biometrics_mvp.Backend.Models
{
    public class PrivilegedAdministrator
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int UserId { get; set; }
        
        [ForeignKey("UserId")]
        public virtual User User { get; set; } = null!;
        
        [Required]
        public string AdminLevel { get; set; } = string.Empty; // SuperAdmin, Admin, DBAdmin
        
        public string PermissionLevel { get; set; } = string.Empty; // Full, Limited, ReadOnly
        
        public DateTime GrantedDate { get; set; } = DateTime.UtcNow;
        
        public DateTime? ExpiryDate { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        public string GrantedBy { get; set; } = string.Empty; // Username who granted the privileges
        
        public string Permissions { get; set; } = string.Empty; // JSON string of specific permissions
        
        public DateTime LastAccess { get; set; } = DateTime.UtcNow;
        
        public string AccessScope { get; set; } = string.Empty; // Database scope or system scope
        
        public bool RequiresTwoFactor { get; set; } = true;
        
        public string Notes { get; set; } = string.Empty;
    }
}