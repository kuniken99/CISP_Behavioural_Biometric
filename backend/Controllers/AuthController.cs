// backend/Controllers/AuthController.cs
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using db_biometrics_mvp.Backend.Data;
using db_biometrics_mvp.Backend.Models;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Authorization; // For password hashing
using db_biometrics_mvp.Backend.Services;

namespace db_biometrics_mvp.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IRecaptchaService _recaptchaService;
        private readonly IEmailService _emailService;

        public AuthController(AppDbContext context, IConfiguration configuration, IRecaptchaService recaptchaService, IEmailService emailService)
        {
            _context = context;
            _configuration = configuration;
            _recaptchaService = recaptchaService;
            _emailService = emailService;
        }


        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            // Verify reCAPTCHA first
            var isRecaptchaValid = await _recaptchaService.VerifyTokenAsync(loginDto.RecaptchaToken);
            if (!isRecaptchaValid)
            {
                return BadRequest(new { message = "reCAPTCHA verification failed. Please try again." });
            }

            var user = await _context.Users.SingleOrDefaultAsync(u => 
                (u.Username == loginDto.Username || u.Email == loginDto.Username) && u.IsActive);

            if (user == null || !VerifyPassword(loginDto.Password, user.PasswordHash))
            {
                return Unauthorized(new { message = "Invalid credentials." });
            }

            var token = GenerateJwtToken(user);
            return Ok(new { token, username = user.Username, role = user.Role });
        }

        // Helper for password hashing (match AppDbContext)
        private static string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                return BitConverter.ToString(hashedBytes).Replace("-", "").ToLower();
            }
        }

        // Helper for password verification
        private bool VerifyPassword(string enteredPassword, string storedHash)
        {
            return HashPassword(enteredPassword) == storedHash;
        }

        private string GenerateJwtToken(User user)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddHours(2), // Token valid for 2 hours
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        [AllowAnonymous]
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto resetPasswordDto)
        {
            // Verify reCAPTCHA first
            var isRecaptchaValid = await _recaptchaService.VerifyTokenAsync(resetPasswordDto.RecaptchaToken);
            if (!isRecaptchaValid)
            {
                return BadRequest(new { message = "reCAPTCHA verification failed. Please try again." });
            }

            // Check if user exists
            var user = await _context.Users.SingleOrDefaultAsync(u => u.Email == resetPasswordDto.Email && u.IsActive);
            
            // Always return success message for security (prevent email enumeration)
            var successMessage = "If the email address is valid, you will receive a password reset link shortly.";

            if (user != null)
            {
                // Generate a secure reset token
                var resetToken = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");
                
                // Invalidate any existing reset tokens for this user
                var existingTokens = await _context.PasswordResetTokens
                    .Where(t => t.UserId == user.Id && !t.IsUsed && t.ExpiresAt > DateTime.UtcNow)
                    .ToListAsync();
                
                foreach (var token in existingTokens)
                {
                    token.IsUsed = true;
                }

                // Create new reset token (expires in 1 hour)
                var passwordResetToken = new PasswordResetToken
                {
                    UserId = user.Id,
                    Token = resetToken,
                    ExpiresAt = DateTime.UtcNow.AddHours(1),
                    IsUsed = false
                };

                _context.PasswordResetTokens.Add(passwordResetToken);
                await _context.SaveChangesAsync();

                // Send email
                var emailSent = await _emailService.SendPasswordResetEmailAsync(user.Email!, resetToken);
                
                if (!emailSent)
                {
                    // Log the error but don't reveal it to the user for security
                    // In production, you might want to have better error handling
                }
            }
            
            return Ok(new { message = successMessage });
        }

        [AllowAnonymous]
        [HttpPost("confirm-reset-password")]
        public async Task<IActionResult> ConfirmResetPassword([FromBody] ConfirmResetPasswordDto confirmDto)
        {
            // Verify reCAPTCHA first
            var isRecaptchaValid = await _recaptchaService.VerifyTokenAsync(confirmDto.RecaptchaToken);
            if (!isRecaptchaValid)
            {
                return BadRequest(new { message = "reCAPTCHA verification failed. Please try again." });
            }

            // Find the reset token
            var resetToken = await _context.PasswordResetTokens
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.Token == confirmDto.Token && !t.IsUsed && t.ExpiresAt > DateTime.UtcNow);

            if (resetToken == null)
            {
                return BadRequest(new { message = "Invalid or expired reset token." });
            }

            // Update user password
            resetToken.User.PasswordHash = HashPassword(confirmDto.NewPassword);
            
            // Mark token as used
            resetToken.IsUsed = true;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Password has been reset successfully. You can now login with your new password." });
        }

        [AllowAnonymous]
        [HttpGet("verify-reset-token/{token}")]
        public async Task<IActionResult> VerifyResetToken(string token)
        {
            var resetToken = await _context.PasswordResetTokens
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.Token == token && !t.IsUsed && t.ExpiresAt > DateTime.UtcNow);

            if (resetToken == null)
            {
                return BadRequest(new { message = "Invalid or expired reset token.", isValid = false });
            }

            return Ok(new { 
                message = "Token is valid.", 
                isValid = true,
                email = resetToken.User.Email,
                expiresAt = resetToken.ExpiresAt 
            });
        }
        
        [HttpOptions("login")]
        public IActionResult OptionsLogin()
        {
            // The CORS middleware handles the headers. This just ensures the
            // preflight request doesn't return a 404.
            return Ok();
        }

        [HttpOptions("reset-password")]
        public IActionResult OptionsResetPassword()
        {
            return Ok();
        }
    }
}