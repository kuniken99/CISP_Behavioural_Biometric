// backend/Models/SecurityLogs.cs
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace db_biometrics_mvp.Backend.Models
{
    public class SecurityLog
    {
        [Key]
        public int Id { get; set; }
        
        public DateTime Timestamp { get; set; }
        
        public int? UserId { get; set; } // Nullable in case of system-wide events
        
        [ForeignKey("UserId")]
        public virtual User? User { get; set; }
        
        [Required]
        public string EventType { get; set; } = string.Empty; // LOGIN_ATTEMPT, ANOMALY_DETECTED, PRIVILEGE_ESCALATION, etc.
        
        [Required]
        public string Severity { get; set; } = "Medium"; // Low, Medium, High, Critical
        
        public string Source { get; set; } = string.Empty; // CBBA, DBAConsole, System, etc.
        
        public string IpAddress { get; set; } = string.Empty;
        
        public string UserAgent { get; set; } = string.Empty;
        
        public string SessionId { get; set; } = string.Empty;
        
        public string Description { get; set; } = string.Empty;
        
        public string Details { get; set; } = string.Empty; // JSON string with additional details
        
        public string Action { get; set; } = string.Empty; // Action performed by the system
        
        public bool IsResolved { get; set; } = false;
        
        public DateTime? ResolvedTime { get; set; }
        
        public string ResolvedBy { get; set; } = string.Empty; // Username who resolved the issue
        
        public string ResolutionNotes { get; set; } = string.Empty;
        
        public decimal RiskScore { get; set; } = 0.0m;
        
        public string Category { get; set; } = string.Empty; // Authentication, Authorization, DataAccess, etc.
        
        public bool RequiresInvestigation { get; set; } = false;
    }
}