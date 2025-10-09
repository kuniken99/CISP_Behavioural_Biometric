// backend/Models/MouseMovement.cs
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace db_biometrics_mvp.Backend.Models
{
    public class MouseMovement
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int UserId { get; set; }
        
        [ForeignKey("UserId")]
        public virtual User User { get; set; }
        
        [Required]
        public string SessionId { get; set; } = string.Empty;
        
        public DateTime Timestamp { get; set; }
        
        public double X { get; set; } = 0.0; // X coordinate
        
        public double Y { get; set; } = 0.0; // Y coordinate
        
        public string EventType { get; set; } = string.Empty; // move, click, down, up, wheel
        
        public string Button { get; set; } = string.Empty; // left, right, middle
        
        public double Velocity { get; set; } = 0.0; // Calculated velocity
        
        public double Acceleration { get; set; } = 0.0; // Calculated acceleration
        
        public double Direction { get; set; } = 0.0; // Direction in degrees
        
        public double Pressure { get; set; } = 0.0; // Mouse pressure if available
        
        public int ClickDuration { get; set; } = 0; // Duration of click in milliseconds
        
        public double DistanceFromPrevious { get; set; } = 0.0; // Distance from previous point
        
        public long TimestampMs { get; set; } = 0; // Timestamp in milliseconds for precise timing
        
        public string ScreenResolution { get; set; } = string.Empty; // Screen resolution context
        
        public bool IsDrag { get; set; } = false; // Whether this is part of a drag operation
    }
}