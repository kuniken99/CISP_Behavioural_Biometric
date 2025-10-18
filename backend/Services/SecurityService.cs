using System;
using System.Security.Cryptography;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using db_biometrics_mvp.Backend.Data;
using db_biometrics_mvp.Backend.Models;
using System.Text;

namespace db_biometrics_mvp.Backend.Services
{
    public class SecurityService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private const int SaltSize = 32;
        private const int HashSize = 32;
        private const int Iterations = 10000;

        public SecurityService(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public string HashPassword(string password)
        {
            var salt = new byte[SaltSize];
            RandomNumberGenerator.Fill(salt);

            using var pbkdf2 = new Rfc2898DeriveBytes(password, salt, Iterations, HashAlgorithmName.SHA256);
            var hash = pbkdf2.GetBytes(HashSize);

            var combinedBytes = new byte[SaltSize + HashSize];
            Buffer.BlockCopy(salt, 0, combinedBytes, 0, SaltSize);
            Buffer.BlockCopy(hash, 0, combinedBytes, SaltSize, HashSize);

            return Convert.ToBase64String(combinedBytes);
        }

        public bool VerifyPassword(string password, string storedHash)
        {
            var combinedBytes = Convert.FromBase64String(storedHash);
            var salt = new byte[SaltSize];
            var hash = new byte[HashSize];
            Buffer.BlockCopy(combinedBytes, 0, salt, 0, SaltSize);
            Buffer.BlockCopy(combinedBytes, SaltSize, hash, 0, HashSize);

            using var pbkdf2 = new Rfc2898DeriveBytes(password, salt, Iterations, HashAlgorithmName.SHA256);
            var computedHash = pbkdf2.GetBytes(HashSize);

            return CryptographicOperations.FixedTimeEquals(hash, computedHash);
        }

        public async Task<(bool success, string message)> CheckLoginAttempt(string username)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
            if (user == null)
                return (false, "User not found");

            if (user.IsLocked && user.LockoutEnd > DateTime.UtcNow)
            {
                var remainingTime = user.LockoutEnd.Value - DateTime.UtcNow;
                return (false, $"Account is locked. Try again in {remainingTime.Minutes} minutes.");
            }

            if (user.IsLocked && user.LockoutEnd <= DateTime.UtcNow)
            {
                user.IsLocked = false;
                user.FailedLoginAttempts = 0;
                await _context.SaveChangesAsync();
            }

            return (true, "Login attempt allowed");
        }

        public async Task HandleFailedLoginAttempt(string username)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
            if (user != null)
            {
                user.FailedLoginAttempts++;
                if (user.FailedLoginAttempts >= 3)
                {
                    user.IsLocked = true;
                    // Exponential backoff: 5 minutes * 2^(attempts-3)
                    int lockoutMinutes = 5 * (int)Math.Pow(2, user.FailedLoginAttempts - 3);
                    user.LockoutEnd = DateTime.UtcNow.AddMinutes(lockoutMinutes);
                }
                await _context.SaveChangesAsync();
            }
        }

        public async Task ResetLoginAttempts(string username)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
            if (user != null)
            {
                user.FailedLoginAttempts = 0;
                user.IsLocked = false;
                user.LockoutEnd = null;
                await _context.SaveChangesAsync();
            }
        }

        public bool ValidatePasswordStrength(string password)
        {
            if (string.IsNullOrWhiteSpace(password)) return false;
            if (password.Length < 12) return false;

            bool hasUppercase = password.Any(char.IsUpper);
            bool hasLowercase = password.Any(char.IsLower);
            bool hasDigit = password.Any(char.IsDigit);
            bool hasSpecialChar = password.Any(ch => !char.IsLetterOrDigit(ch));

            return hasUppercase && hasLowercase && hasDigit && hasSpecialChar;
        }
    }
}