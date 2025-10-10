// backend/Models/KeyStroke.cs
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace db_biometrics_mvp.Backend.Models
{
    public class KeyStroke
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int UserId { get; set; }
        
        [ForeignKey("UserId")]
        public virtual User User { get; set; }
        
        [Required]
        public string SessionId { get; set; } = string.Empty;
        
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        
        [Required]
        public string Key { get; set; } = string.Empty; // The key pressed (hashed for security)
        
        public string EventType { get; set; } = string.Empty; // keydown, keyup, keypress
        
        public int DwellTime { get; set; } = 0; // Time key was held down (ms)
        
        public int FlightTime { get; set; } = 0; // Time between key release and next key press (ms)
        
        public double TypingSpeed { get; set; } = 0.0; // Characters per minute
        
        public bool IsShiftPressed { get; set; } = false;
        
        public bool IsCtrlPressed { get; set; } = false;
        
        public bool IsAltPressed { get; set; } = false;
        
        public string KeyCode { get; set; } = string.Empty; // Key code for identification
        
        public long TimestampMs { get; set; } = 0; // Precise timestamp in milliseconds
        
        public double Rhythm { get; set; } = 0.0; // Typing rhythm pattern
        
        public string Context { get; set; } = string.Empty; // Context where keystroke occurred (form, field, etc.)
        
        public int Pressure { get; set; } = 0; // Key pressure if available
        
        public bool IsBackspace { get; set; } = false; // Special handling for backspace
        
        public int SequenceNumber { get; set; } = 0; // Order in the typing sequence
    }
}