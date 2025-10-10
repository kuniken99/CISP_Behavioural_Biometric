using System.ComponentModel.DataAnnotations;

namespace db_biometrics_mvp.Backend.Models
{
    public class PasswordResetToken
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Token { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public bool IsUsed { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation property
        public virtual User User { get; set; } = default!;
    }

    // DTO for confirming password reset
    public class ConfirmResetPasswordDto
    {
        [Required]
        public string Token { get; set; } = string.Empty;
        
        [Required]
        [MinLength(8)]
        public string NewPassword { get; set; } = string.Empty;
        
        [Required]
        [Compare("NewPassword")]
        public string ConfirmPassword { get; set; } = string.Empty;
        
        [Required]
        public string RecaptchaToken { get; set; } = string.Empty;
    }
}