// backend/Models/BiometricProfiles.cs
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace db_biometrics_mvp.Backend.Models
{
    public class BiometricProfile
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int UserId { get; set; }
        
        [ForeignKey("UserId")]
        public virtual User User { get; set; } = null!;
        
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
        
        public string ProfileVersion { get; set; } = "1.0";
        
        public string MouseProfile { get; set; } = string.Empty; // JSON string of mouse behavioral patterns
        
        public string KeystrokeProfile { get; set; } = string.Empty; // JSON string of keystroke patterns
        
        public string TypingRhythm { get; set; } = string.Empty; // JSON string of typing rhythm patterns
        
        public double AverageTypingSpeed { get; set; } = 0.0; // WPM
        
        public double AverageMouseVelocity { get; set; } = 0.0;
        
        public string PreferredClickPatterns { get; set; } = string.Empty; // JSON string
        
        public int SessionCount { get; set; } = 0; // Number of sessions used to build this profile
        
        public decimal ProfileAccuracy { get; set; } = 0.0m; // Accuracy of the profile model
        
        public bool IsActive { get; set; } = true;
        
        public string ModelParameters { get; set; } = string.Empty; // JSON string of ML model parameters
        
        public DateTime LastTrainingDate { get; set; } = DateTime.UtcNow;
        
        public string DeviceContext { get; set; } = string.Empty; // Device information when profile was created
        
        public decimal ThresholdScore { get; set; } = 0.5m; // Threshold for anomaly detection
        
        public string AdaptationRate { get; set; } = "Medium"; // How quickly the profile adapts to changes

        // CBBA fields
        public string EncryptedProfile { get; set; } = string.Empty; // AES-256 encrypted biometric profile BLOB
        
        public bool IsTrained { get; set; } = false; // Whether the ML model has been trained
        
        public DateTime? TrainedAt { get; set; } // When the model was last trained
        
        public int SampleCount { get; set; } = 0; // Number of samples used for training
        
        public string? IsolationForestParams { get; set; } // ML model parameters for Isolation Forest
        
        public string? SVMParams { get; set; } // ML model parameters for SVM
        
        public string? OneClassSVMParams { get; set; } // ML model parameters for One-Class SVM
        
        public string? FeatureWeights { get; set; } // Feature weights for ML models
        
        public string? EncryptionKeyId { get; set; } // ID of the encryption key used
        
        public string? EncryptionAlgorithm { get; set; } // Encryption algorithm used (e.g., AES-256)
    }
}