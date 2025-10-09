// backend/Models/DBAConsole.cs
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace db_biometrics_mvp.Backend.Models
{
    public class DBAConsole
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int UserId { get; set; }
        
        [ForeignKey("UserId")]
        public virtual User User { get; set; }
        
        [Required]
        public string SessionId { get; set; } = string.Empty;
        
        public DateTime LoginTime { get; set; }
        
        public DateTime? LogoutTime { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        public string IpAddress { get; set; } = string.Empty;
        
        public string UserAgent { get; set; } = string.Empty;
        
        public string DatabaseName { get; set; } = string.Empty;
        
        public string ConnectionString { get; set; } = string.Empty;
        
        public int QueryCount { get; set; } = 0;
        
        public DateTime LastActivity { get; set; }
        
        public string Status { get; set; } = "Active"; // Active, Inactive, Suspended
    }
}