// backend/Models/RiskScore.cs
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace db_biometrics_mvp.Backend.Models
{
    public class RiskScore
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int UserId { get; set; }
        
        [ForeignKey("UserId")]
        public virtual User User { get; set; }
        
        public string SessionId { get; set; } = string.Empty;
        
        public DateTime CalculatedTime { get; set; } = DateTime.UtcNow;
        
        [Required]
        public decimal CurrentScore { get; set; } = 0.0m; // Current risk score (0.0 - 1.0)
        
        public decimal PreviousScore { get; set; } = 0.0m; // Previous risk score for comparison
        
        public decimal BaselineScore { get; set; } = 0.0m; // User's baseline risk score
        
        public string RiskLevel { get; set; } = "Low"; // Low, Medium, High, Critical
        
        public string CalculationMethod { get; set; } = string.Empty; // Algorithm/method used
        
        public string ModelVersion { get; set; } = string.Empty; // Version of the risk assessment model
        
        public string FactorsConsidered { get; set; } = string.Empty; // JSON string of factors that influenced the score
        
        public decimal BiometricScore { get; set; } = 0.0m; // Score from biometric analysis
        
        public decimal BehavioralScore { get; set; } = 0.0m; // Score from behavioral analysis
        
        public decimal ContextualScore { get; set; } = 0.0m; // Score from contextual factors (time, location, etc.)
        
        public decimal HistoricalScore { get; set; } = 0.0m; // Score based on historical patterns
        
        public bool IsAnomaly { get; set; } = false;
        
        public string AnomalyReasons { get; set; } = string.Empty; // JSON string of reasons for anomaly
        
        public DateTime ExpiryTime { get; set; } = DateTime.UtcNow.AddHours(1); // When this score expires
        
        public bool IsActive { get; set; } = true;
        
        public string Recommendations { get; set; } = string.Empty; // JSON string of recommended actions
        
        public decimal Confidence { get; set; } = 0.0m; // Confidence in the calculated score
    }
}