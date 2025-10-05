// backend/Models/CaptchaVerification.cs
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace db_biometrics_mvp.Backend.Models
{
    public class CaptchaVerification
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int UserId { get; set; }
        
        [ForeignKey("UserId")]
        public virtual User User { get; set; }
        
        [Required]
        public string SessionId { get; set; } = string.Empty;
        
        public DateTime CreatedTime { get; set; } = DateTime.UtcNow;
        
        public DateTime? CompletedTime { get; set; }
        
        public string CaptchaType { get; set; } = string.Empty; // Text, Image, Audio, Puzzle
        
        public string ChallengeData { get; set; } = string.Empty; // The captcha challenge (encrypted)
        
        public string ExpectedAnswer { get; set; } = string.Empty; // Expected answer (hashed)
        
        public string UserAnswer { get; set; } = string.Empty; // User provided answer
        
        public bool IsCorrect { get; set; } = false;
        
        public int AttemptNumber { get; set; } = 1;
        
        public DateTime ExpiryTime { get; set; } = DateTime.UtcNow.AddMinutes(5);
        
        public string IpAddress { get; set; } = string.Empty;
        
        public string UserAgent { get; set; } = string.Empty;
        
        public bool IsExpired => DateTime.UtcNow > ExpiryTime;
        
        public TimeSpan SolveTime { get; set; } = TimeSpan.Zero; // Time taken to solve
        
        public string Difficulty { get; set; } = "Medium"; // Easy, Medium, Hard
    }
}