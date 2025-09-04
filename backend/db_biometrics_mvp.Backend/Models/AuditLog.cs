// backend/Models/AuditLog.cs
using System;
using System.ComponentModel.DataAnnotations;

namespace db_biometrics_mvp.Backend.Models
{
    public class AuditLog
    {
        public int Id { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        [Required]
        public string Username { get; set; } = string.Empty;
        [Required]
        public string Action { get; set; } = string.Empty; // e.g., "LOGIN", "CREATE_USER", "UPDATE_TABLE", "ANOMALY_DETECTED"
        public string Details { get; set; } = string.Empty;
        public string IpAddress { get; set; } = string.Empty;
        public string? SessionId { get; set; } // Link to CBBA session
    }

    public class Alert
    {
        public int Id { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string Type { get; set; } = "Security"; // "Security", "Performance"
        public string Message { get; set; } = string.Empty;
        public string Severity { get; set; } = "High"; // "Low", "Medium", "High", "Critical"
        public string Status { get; set; } = "Active"; // "Active", "Resolved"
    }
}