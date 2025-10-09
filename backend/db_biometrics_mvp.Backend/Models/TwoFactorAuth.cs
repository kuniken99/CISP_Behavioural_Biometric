using System.ComponentModel.DataAnnotations;

namespace db_biometrics_mvp.Backend.Models
{
    public class TwoFactorAuth
    {
        public int Id { get; set; }
        
        [Required]
        public int UserId { get; set; }
        public User User { get; set; } = default!;
        
        [Required]
        public string SecretKey { get; set; } = string.Empty;
        
        public bool IsEnabled { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
