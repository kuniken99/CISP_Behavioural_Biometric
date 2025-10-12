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
        private readonly ILogger<AuthController> _logger;

        public AuthController(AppDbContext context, IConfiguration configuration, IRecaptchaService recaptchaService, IEmailService emailService, ILogger<AuthController> logger)
        {
            _context = context;
            _configuration = configuration;
            _recaptchaService = recaptchaService;
            _emailService = emailService;
            _logger = logger;
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

            // Check if email is verified
            if (!user.IsEmailVerified)
            {
                return Unauthorized(new { 
                    message = "Please verify your email address before logging in.",
                    emailNotVerified = true,
                    email = user.Email,
                    username = user.Username
                });
            }

            // Check if 2FA is required but not set up
            if (!user.IsTwoFactorEnabled)
            {
                return Unauthorized(new { 
                    message = "Two-factor authentication setup is required before logging in.",
                    twoFactorRequired = true,
                    email = user.Email,
                    username = user.Username
                });
            }
            else
            {
                // If user has 2FA enabled, they need to provide TOTP code
                return Unauthorized(new { 
                    message = "Please enter your two-factor authentication code.",
                    requiresTwoFactorCode = true,
                    email = user.Email,
                    username = user.Username
                });
            }
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
        
        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegistrationDto registerDto)
        {
            // Verify reCAPTCHA first
            var isRecaptchaValid = await _recaptchaService.VerifyTokenAsync(registerDto.RecaptchaToken);
            if (!isRecaptchaValid)
            {
                return BadRequest(new { message = "reCAPTCHA verification failed. Please try again." });
            }

            // Validate unique code
            var uniqueCode = await _context.UniqueCodes
                .FirstOrDefaultAsync(c => c.Code == registerDto.UniqueCode && 
                                         c.IsActive && 
                                         !c.IsUsed && 
                                         c.ExpiresAt > DateTime.UtcNow);

            if (uniqueCode == null)
            {
                return BadRequest(new { message = "Invalid, expired, or already used unique code." });
            }

            // Check if username already exists
            if (await _context.Users.AnyAsync(u => u.Username == registerDto.Username))
            {
                return BadRequest(new { message = "Username already exists." });
            }

            // Check if email already exists
            if (await _context.Users.AnyAsync(u => u.Email == registerDto.Email))
            {
                return BadRequest(new { message = "Email already exists." });
            }

            // Use database transaction to ensure atomicity
            using var transaction = await _context.Database.BeginTransactionAsync();
            
            try
            {
                // Create new user (but don't mark unique code as used yet)
                var user = new User
                {
                    Username = registerDto.Username,
                    Email = registerDto.Email,
                    PasswordHash = HashPassword(registerDto.Password),
                    Role = uniqueCode.Role, // Use role from unique code
                    IsActive = true,
                    IsEmailVerified = false, // Will be verified via email
                    CreatedAt = DateTime.UtcNow
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync(); // Save to get user ID

                // Create email verification token
                var verificationToken = Guid.NewGuid().ToString("N");
                var emailVerificationToken = new EmailVerificationToken
                {
                    UserId = user.Id,
                    Token = verificationToken,
                    CreatedAt = DateTime.UtcNow,
                    ExpiresAt = DateTime.UtcNow.AddHours(24), // 24-hour expiration
                    IsUsed = false
                };

                _context.EmailVerificationTokens.Add(emailVerificationToken);
                await _context.SaveChangesAsync();

                // Send email verification (this is the critical step that could fail)
                var emailSent = await _emailService.SendEmailVerificationAsync(user.Email, verificationToken);
                if (!emailSent)
                {
                    _logger.LogError("Failed to send verification email to {Email} during registration", user.Email);
                    // Rollback transaction if email sending fails
                    await transaction.RollbackAsync();
                    return StatusCode(500, new { message = "Registration failed: Unable to send verification email. Please try again." });
                }

                // Only mark unique code as used if everything succeeded (including email sending)
                uniqueCode.IsUsed = true;
                uniqueCode.UsedByUserId = user.Id;
                uniqueCode.UsedAt = DateTime.UtcNow;
                _context.UniqueCodes.Update(uniqueCode);
                await _context.SaveChangesAsync();
                
                // Log activity
                await _context.AuditLogs.AddAsync(new AuditLog 
                { 
                    Username = registerDto.Username, 
                    Action = "USER_REGISTRATION", 
                    Details = $"New user registered with email: {registerDto.Email}", 
                    IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "N/A" 
                });
                await _context.SaveChangesAsync();

                // Commit transaction - everything succeeded
                await transaction.CommitAsync();
                
                _logger.LogInformation("User registration completed successfully for {Email}", user.Email);
                return Ok(new { message = "Registration successful. Please check your email for verification instructions." });
            }
            catch (Exception ex)
            {
                // Rollback transaction on any error
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Registration failed for email {Email}", registerDto.Email);
                return StatusCode(500, new { message = "Registration failed due to an unexpected error. Please try again." });
            }
        }

        [AllowAnonymous]
        [HttpPost("resend-verification")]
        public async Task<IActionResult> ResendVerification([FromBody] ResendVerificationDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (user == null)
            {
                // Don't reveal if email exists or not for security
                return Ok(new { message = "If the email exists, a verification link has been sent." });
            }

            if (user.IsEmailVerified)
            {
                return BadRequest(new { message = "Email is already verified." });
            }

            // Invalidate any existing tokens for this user
            var existingTokens = await _context.EmailVerificationTokens
                .Where(t => t.UserId == user.Id && !t.IsUsed)
                .ToListAsync();
            
            foreach (var token in existingTokens)
            {
                token.IsUsed = true;
            }

            // Create new verification token
            var verificationToken = Guid.NewGuid().ToString("N");
            var emailVerificationToken = new EmailVerificationToken
            {
                UserId = user.Id,
                Token = verificationToken,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddHours(24),
                IsUsed = false
            };

            _context.EmailVerificationTokens.Add(emailVerificationToken);
            await _context.SaveChangesAsync();

            // Send verification email
            var emailSent = await _emailService.SendEmailVerificationAsync(user.Email, verificationToken);
            if (!emailSent)
            {
                _logger.LogWarning("Failed to send verification email to {Email}", user.Email);
            }

            return Ok(new { message = "Verification email sent successfully." });
        }

        [AllowAnonymous]
        [HttpGet("verify-email/{token}")]
        public async Task<IActionResult> VerifyEmail(string token)
        {
            var verificationToken = await _context.EmailVerificationTokens
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.Token == token && !t.IsUsed && t.ExpiresAt > DateTime.UtcNow);

            if (verificationToken == null)
            {
                return BadRequest(new { message = "Invalid or expired verification token." });
            }

            // Mark user as verified
            verificationToken.User.IsEmailVerified = true;
            verificationToken.IsUsed = true;
            
            // Update the user and token
            _context.Users.Update(verificationToken.User);
            _context.EmailVerificationTokens.Update(verificationToken);
            
            // Log activity
            await _context.AuditLogs.AddAsync(new AuditLog 
            { 
                Username = verificationToken.User.Username, 
                Action = "EMAIL_VERIFIED", 
                Details = $"Email verification completed for: {verificationToken.User.Email}", 
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "N/A" 
            });
            
            await _context.SaveChangesAsync();

            return Ok(new { 
                message = "Email verified successfully. You can now set up two-factor authentication.",
                requiresTwoFactorSetup = true,
                email = verificationToken.User.Email,
                username = verificationToken.User.Username
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

        [HttpOptions("register")]
        public IActionResult OptionsRegister()
        {
            return Ok();
        }

        [Authorize]
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            try
            {
                var username = User.Identity?.Name;
                if (string.IsNullOrEmpty(username))
                {
                    return Unauthorized(new { message = "User not authenticated." });
                }

                var user = await _context.Users
                    .Include(u => u.TwoFactorAuth)
                    .SingleOrDefaultAsync(u => u.Username == username);

                if (user == null)
                {
                    return NotFound(new { message = "User not found." });
                }

                var profileData = new
                {
                    username = user.Username,
                    email = user.Email,
                    role = user.Role,
                    accountStatus = user.IsActive ? "Active" : "Inactive",
                    twoFactorEnabled = user.IsTwoFactorEnabled,
                    emailVerified = user.IsEmailVerified,
                    lastLogin = user.LastLoginAt?.ToString("M/d/yyyy, h:mm:ss tt") ?? "Never",
                    createdAt = user.CreatedAt.ToString("M/d/yyyy, h:mm:ss tt")
                };

                return Ok(profileData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching user profile");
                return StatusCode(500, new { message = "Internal server error." });
            }
        }

        [HttpOptions("profile")]
        public IActionResult OptionsProfile()
        {
            return Ok();
        }
    }
}