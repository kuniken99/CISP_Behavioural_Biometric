// backend/Models/CBBA.cs
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace db_biometrics_mvp.Backend.Models
{
    public class CBBA
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int UserId { get; set; }
        
        [ForeignKey("UserId")]
        public virtual User User { get; set; } = null!;
        
        [Required]
        public string SessionId { get; set; } = string.Empty;
        
        public DateTime StartTime { get; set; } = DateTime.UtcNow;
        
        public DateTime? EndTime { get; set; }
        
        public string BiometricData { get; set; } = string.Empty; // JSON string of biometric events
        
        public decimal RiskScore { get; set; } = 0.0m;
        
        public string AuthenticationStatus { get; set; } = "Pending"; // Pending, Authenticated, Failed, Suspicious
        
        public string ModelVersion { get; set; } = string.Empty;
        
        public decimal Confidence { get; set; } = 0.0m; // Model confidence score
        
        public bool IsAnomaly { get; set; } = false;
        
        public string AnomalyDetails { get; set; } = string.Empty; // JSON string of anomaly information
        
        public DateTime ProcessedTime { get; set; } = DateTime.UtcNow;
        
        public string DeviceFingerprint { get; set; } = string.Empty;
        
        public string IpAddress { get; set; } = string.Empty;
        
        public int EventCount { get; set; } = 0; // Number of biometric events in this session
    }
}