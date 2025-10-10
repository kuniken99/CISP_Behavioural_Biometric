using System.ComponentModel.DataAnnotations;

namespace db_biometrics_mvp.Backend.Models
{
    public class EmailVerificationToken
    {
        public int Id { get; set; }
        
        [Required]
        public int UserId { get; set; }
        public User User { get; set; } = default!;
        
        [Required]
        public string Token { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime ExpiresAt { get; set; }
        public bool IsUsed { get; set; }
    }
}
