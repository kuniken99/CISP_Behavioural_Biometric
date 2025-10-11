// backend/Models/UniqueCode.cs
using System.ComponentModel.DataAnnotations;

namespace db_biometrics_mvp.Backend.Models
{
    public class UniqueCode
    {
        public int Id { get; set; }
        
        [Required]
        public string Code { get; set; } = string.Empty;
        
        [Required]
        public string Role { get; set; } = string.Empty; // Role to assign when code is used
        
        public string? Note { get; set; } // Optional note for the code
        
        public bool IsUsed { get; set; } = false;
        
        public bool IsActive { get; set; } = true;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime ExpiresAt { get; set; }
        
        public int? UsedByUserId { get; set; } // Reference to user who used the code
        
        public DateTime? UsedAt { get; set; }
        
        public string CreatedBy { get; set; } = string.Empty; // Username of admin who created the code
    }

    // DTO for unique code generation
    public class GenerateUniqueCodeDto
    {
        [Required]
        public string Role { get; set; } = string.Empty;
        
        [Range(1, 365)]
        public int ExpiresInDays { get; set; } = 7;
        
        public string? Note { get; set; }
    }

    // DTO for deactivating unique code
    public class DeactivateUniqueCodeDto
    {
        [Required]
        public int CodeId { get; set; }
    }
}