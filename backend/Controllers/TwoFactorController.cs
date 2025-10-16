using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using db_biometrics_mvp.Backend.Data;
using db_biometrics_mvp.Backend.Models;
using db_biometrics_mvp.Backend.Services;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace db_biometrics_mvp.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TwoFactorController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITwoFactorAuthService _twoFactorService;
        private readonly IRecaptchaService _recaptchaService;
        private readonly ILogger<TwoFactorController> _logger;
        private readonly IConfiguration _configuration;

        public TwoFactorController(AppDbContext context, ITwoFactorAuthService twoFactorService, IRecaptchaService recaptchaService, ILogger<TwoFactorController> logger, IConfiguration configuration)
        {
            _context = context;
            _twoFactorService = twoFactorService;
            _recaptchaService = recaptchaService;
            _logger = logger;
            _configuration = configuration;
        }

        [AllowAnonymous]
        [HttpPost("setup")]
        public async Task<IActionResult> SetupTwoFactor([FromBody] SetupTwoFactorDto dto)
        {
            // For initial setup, we'll use email to identify the user since they're not fully authenticated yet
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email && u.IsEmailVerified && !u.IsTwoFactorEnabled);
            
            if (user == null)
            {
                return BadRequest(new { message = "User not found or 2FA already enabled." });
            }

            // Generate secret key
            var secretKey = _twoFactorService.GenerateSecretKey();
            
            // Generate QR code URI
            var qrCodeUri = _twoFactorService.GenerateQrCodeUri(user.Email, secretKey);
            
            // Generate QR code image
            var qrCodeImage = _twoFactorService.GenerateQrCodeImage(qrCodeUri);
            
            // Get manual entry code
            var manualEntryCode = _twoFactorService.GetManualEntryCode(secretKey);

            // Store the secret temporarily (we'll confirm it when user verifies the code)
            var existingTwoFactor = await _context.TwoFactorAuths.FirstOrDefaultAsync(t => t.UserId == user.Id);
            if (existingTwoFactor != null)
            {
                existingTwoFactor.SecretKey = secretKey;
                existingTwoFactor.IsEnabled = false; // Not enabled until verified
                _context.TwoFactorAuths.Update(existingTwoFactor);
            }
            else
            {
                var twoFactorAuth = new TwoFactorAuth
                {
                    UserId = user.Id,
                    SecretKey = secretKey,
                    IsEnabled = false,
                    CreatedAt = DateTime.UtcNow
                };
                _context.TwoFactorAuths.Add(twoFactorAuth);
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                qrCodeImage = Convert.ToBase64String(qrCodeImage),
                manualEntryCode = manualEntryCode,
                message = "2FA setup initiated. Please scan the QR code or enter the manual code in your authenticator app."
            });
        }

        [AllowAnonymous]
        [HttpPost("verify")]
        public async Task<IActionResult> VerifyTwoFactor([FromBody] VerifyTwoFactorDto dto)
        {
            // Verify reCAPTCHA first
            var isRecaptchaValid = await _recaptchaService.VerifyTokenAsync(dto.RecaptchaToken);
            if (!isRecaptchaValid)
            {
                return BadRequest(new { message = "reCAPTCHA verification failed. Please try again." });
            }

            var user = await _context.Users
                .Include(u => u.TwoFactorAuth)
                .FirstOrDefaultAsync(u => u.Email == dto.Email && u.IsEmailVerified);
            
            if (user == null || user.TwoFactorAuth == null)
            {
                return BadRequest(new { message = "User not found or 2FA not set up." });
            }

            // Validate the TOTP code
            var isValid = _twoFactorService.ValidateTotp(user.TwoFactorAuth.SecretKey, dto.Code);
            
            if (!isValid)
            {
                return BadRequest(new { message = "Invalid verification code. Please try again." });
            }

            // Enable 2FA for the user
            user.IsTwoFactorEnabled = true;
            user.TwoFactorAuth.IsEnabled = true;
            
            _context.Users.Update(user);
            _context.TwoFactorAuths.Update(user.TwoFactorAuth);

            // Log the activity
            await _context.AuditLogs.AddAsync(new AuditLog 
            { 
                Username = user.Username, 
                Action = "TWO_FACTOR_SETUP_COMPLETED", 
                Details = $"User {user.Email} successfully set up 2FA" 
            });

            await _context.SaveChangesAsync();

            _logger.LogInformation("2FA setup completed for user {Email}", user.Email);

            // Generate JWT token for the user after successful 2FA setup
            var token = GenerateJwtToken(user);

            return Ok(new { 
                message = "Two-factor authentication has been successfully set up!",
                token = token,
                user = new {
                    id = user.Id,
                    username = user.Username,
                    email = user.Email,
                    role = user.Role
                }
            });
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> LoginWithTwoFactor([FromBody] LoginTwoFactorDto dto)
        {
            var user = await _context.Users
                .Include(u => u.TwoFactorAuth)
                .FirstOrDefaultAsync(u => u.Email == dto.Email && u.IsEmailVerified && u.IsTwoFactorEnabled);
            
            if (user == null || user.TwoFactorAuth == null || !user.TwoFactorAuth.IsEnabled)
            {
                return BadRequest(new { message = "User not found or 2FA not enabled." });
            }

            // Validate the TOTP code
            var isValid = _twoFactorService.ValidateTotp(user.TwoFactorAuth.SecretKey, dto.Code);
            
            if (!isValid)
            {
                // Log failed 2FA attempt
                await _context.AuditLogs.AddAsync(new AuditLog 
                { 
                    Username = user.Username, 
                    Action = "FAILED_TWO_FACTOR_LOGIN", 
                    Details = $"Failed 2FA login attempt for user {user.Email}" 
                });
                await _context.SaveChangesAsync();
                
                return BadRequest(new { message = "Invalid verification code. Please try again." });
            }

            // Reset failed login attempts on successful 2FA login
            if (user.FailedLoginAttempts > 0 || user.IsLocked)
            {
                user.FailedLoginAttempts = 0;
                user.IsLocked = false;
                user.LockoutEnd = null;
            }

            // Update last login time
            user.LastLoginAt = DateTime.UtcNow;
            _context.Users.Update(user);

            // Log the activity
            await _context.AuditLogs.AddAsync(new AuditLog 
            { 
                Username = user.Username, 
                Action = "TWO_FACTOR_LOGIN_SUCCESS", 
                Details = $"User {user.Email} successfully logged in with 2FA" 
            });

            await _context.SaveChangesAsync();

            // Generate JWT token for authenticated user
            var token = GenerateJwtToken(user);

            return Ok(new { 
                message = "Two-factor authentication successful!",
                token,
                user = new { user.Username, user.Email, user.Role }
            });
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
                expires: DateTime.Now.AddMinutes(15), // Token valid for 15 minutes (matches session timeout)
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        [HttpOptions("setup")]
        public IActionResult OptionsSetup()
        {
            return Ok();
        }

        [HttpOptions("verify")]
        public IActionResult OptionsVerify()
        {
            return Ok();
        }

        [HttpOptions("login")]
        public IActionResult OptionsLogin()
        {
            return Ok();
        }
    }

    // DTOs for 2FA operations
    public class SetupTwoFactorDto
    {
        public string Email { get; set; } = string.Empty;
    }

    public class VerifyTwoFactorDto
    {
        public string Email { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string RecaptchaToken { get; set; } = string.Empty;
    }

    public class LoginTwoFactorDto
    {
        public string Email { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
    }
}
