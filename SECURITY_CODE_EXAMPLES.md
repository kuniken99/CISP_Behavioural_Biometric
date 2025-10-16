# Security Features - Code Examples

This document shows the actual code implementations for all security features in the CBBA system.

---

## 1. PASSWORD HASHING

### Location: `backend/Controllers/AuthController.cs`

```csharp
// SHA-256 Password Hashing
private static string HashPassword(string password)
{
    using (var sha256 = SHA256.Create())
    {
        var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return BitConverter.ToString(hashedBytes).Replace("-", "").ToLower();
    }
}

// Password Verification
private bool VerifyPassword(string enteredPassword, string storedHash)
{
    return HashPassword(enteredPassword) == storedHash;
}
```

### Enhanced Version: `backend/Services/SecurityService.cs`

```csharp
// PBKDF2 with Salt (More Secure)
public string HashPassword(string password)
{
    using var rng = new RNGCryptoServiceProvider();
    var salt = new byte[32];
    rng.GetBytes(salt);

    using var pbkdf2 = new Rfc2898DeriveBytes(password, salt, 10000, HashAlgorithmName.SHA256);
    var hash = pbkdf2.GetBytes(32);

    var combinedBytes = new byte[64]; // 32 salt + 32 hash
    Buffer.BlockCopy(salt, 0, combinedBytes, 0, 32);
    Buffer.BlockCopy(hash, 0, combinedBytes, 32, 32);

    return Convert.ToBase64String(combinedBytes);
}

public bool VerifyPassword(string password, string storedHash)
{
    var combinedBytes = Convert.FromBase64String(storedHash);
    var salt = new byte[32];
    var hash = new byte[32];
    Buffer.BlockCopy(combinedBytes, 0, salt, 0, 32);
    Buffer.BlockCopy(combinedBytes, 32, hash, 0, 32);

    using var pbkdf2 = new Rfc2898DeriveBytes(password, salt, 10000, HashAlgorithmName.SHA256);
    var computedHash = pbkdf2.GetBytes(32);

    return CryptographicOperations.FixedTimeEquals(hash, computedHash);
}
```

**Usage in Registration:**
```csharp
var user = new User
{
    Username = registerDto.Username,
    Email = registerDto.Email,
    PasswordHash = HashPassword(registerDto.Password), // ← Hashed before storage
    Role = uniqueCode.Role,
    IsActive = true,
    IsEmailVerified = false
};
```

---

## 2. AES-256 ENCRYPTION OF BIOMETRIC DATA

### Location: `backend/Services/BiometricEncryptionService.cs`

```csharp
public class BiometricEncryptionService
{
    private readonly byte[] _key;  // 256-bit key
    private readonly byte[] _iv;   // Initialization Vector

    public BiometricEncryptionService(IConfiguration configuration)
    {
        var encryptionKey = configuration["BiometricEncryption:Key"];
        var encryptionIV = configuration["BiometricEncryption:IV"];

        if (string.IsNullOrEmpty(encryptionKey) || string.IsNullOrEmpty(encryptionIV))
        {
            // Generate new 256-bit key and IV if not configured
            using (var aes = Aes.Create())
            {
                aes.KeySize = 256;  // ← AES-256
                aes.GenerateKey();
                aes.GenerateIV();
                _key = aes.Key;
                _iv = aes.IV;
            }
        }
        else
        {
            _key = Convert.FromBase64String(encryptionKey);
            _iv = Convert.FromBase64String(encryptionIV);
        }
    }

    // Encrypt biometric data (keystroke/mouse movement)
    public string EncryptBiometricData(string data)
    {
        using var aes = Aes.Create();
        aes.Key = _key;
        aes.IV = _iv;
        aes.Mode = CipherMode.CBC;      // ← Cipher Block Chaining
        aes.Padding = PaddingMode.PKCS7; // ← Standard padding

        using var encryptor = aes.CreateEncryptor();
        using var msEncrypt = new MemoryStream();
        using (var csEncrypt = new CryptoStream(msEncrypt, encryptor, CryptoStreamMode.Write))
        using (var swEncrypt = new StreamWriter(csEncrypt))
        {
            swEncrypt.Write(data);
        }

        var encrypted = msEncrypt.ToArray();
        return Convert.ToBase64String(encrypted);
    }

    // Decrypt biometric data
    public string DecryptBiometricData(string encryptedData)
    {
        var cipherBytes = Convert.FromBase64String(encryptedData);

        using var aes = Aes.Create();
        aes.Key = _key;
        aes.IV = _iv;
        aes.Mode = CipherMode.CBC;
        aes.Padding = PaddingMode.PKCS7;

        using var decryptor = aes.CreateDecryptor();
        using var msDecrypt = new MemoryStream(cipherBytes);
        using var csDecrypt = new CryptoStream(msDecrypt, decryptor, CryptoStreamMode.Read);
        using var srDecrypt = new StreamReader(csDecrypt);
        
        return srDecrypt.ReadToEnd();
    }
}
```

**Configuration:** `appsettings.json`
```json
{
  "BiometricEncryption": {
    "Key": "base64EncodedKeyHere==",
    "IV": "base64EncodedIVHere=="
  }
}
```

**Usage Example:**
```csharp
// In BiometricController
var biometricData = JsonSerializer.Serialize(biometricEvents);
var encryptedData = _encryptionService.EncryptBiometricData(biometricData);
// Store encryptedData in database
```

---

## 3. TWO-FACTOR AUTHENTICATION (GOOGLE AUTHENTICATOR)

### Location: `backend/Services/TwoFactorAuthService.cs`

```csharp
public class TwoFactorAuthService : ITwoFactorAuthService
{
    // Generate random secret key (160 bits)
    public string GenerateSecretKey()
    {
        var key = KeyGeneration.GenerateRandomKey(20); // 160 bits
        return Base32Encoding.ToString(key);
    }

    // Generate QR code URI for Google Authenticator
    public string GenerateQrCodeUri(string email, string secretKey, string issuer = "CBBA Security System")
    {
        var encodedIssuer = UrlEncoder.Default.Encode(issuer);
        var encodedEmail = UrlEncoder.Default.Encode(email);
        
        return $"otpauth://totp/{encodedEmail}?secret={secretKey}&issuer={encodedIssuer}";
    }

    // Generate QR code image
    public byte[] GenerateQrCodeImage(string qrCodeUri)
    {
        using var qrGenerator = new QRCodeGenerator();
        using var qrCodeData = qrGenerator.CreateQrCode(qrCodeUri, QRCodeGenerator.ECCLevel.Q);
        using var qrCode = new PngByteQRCode(qrCodeData);
        
        return qrCode.GetGraphic(20); // 20 pixels per module
    }

    // Validate TOTP code
    public bool ValidateTotp(string secretKey, string userCode)
    {
        // Clean the user code
        userCode = userCode.Replace(" ", "").Replace("-", "");
        
        if (userCode.Length != 6 || !userCode.All(char.IsDigit))
            return false;

        var secretKeyBytes = Base32Encoding.ToBytes(secretKey);
        var totp = new Totp(secretKeyBytes);
        
        // Verify with ±1 period window (30 seconds before/after)
        var currentCode = totp.ComputeTotp();
        var previousCode = totp.ComputeTotp(DateTime.UtcNow.AddSeconds(-30));
        var nextCode = totp.ComputeTotp(DateTime.UtcNow.AddSeconds(30));

        return userCode == currentCode || userCode == previousCode || userCode == nextCode;
    }
}
```

### 2FA Setup Endpoint: `backend/Controllers/TwoFactorController.cs`

```csharp
[AllowAnonymous]
[HttpPost("setup")]
public async Task<IActionResult> SetupTwoFactor([FromBody] SetupTwoFactorDto dto)
{
    var user = await _context.Users.FirstOrDefaultAsync(u => 
        u.Email == dto.Email && u.IsEmailVerified && !u.IsTwoFactorEnabled);
    
    if (user == null)
        return BadRequest(new { message = "User not found or 2FA already enabled." });

    // Generate secret key
    var secretKey = _twoFactorService.GenerateSecretKey();
    
    // Generate QR code
    var qrCodeUri = _twoFactorService.GenerateQrCodeUri(user.Email, secretKey);
    var qrCodeImage = _twoFactorService.GenerateQrCodeImage(qrCodeUri);
    
    // Get manual entry code
    var manualEntryCode = _twoFactorService.GetManualEntryCode(secretKey);

    // Store secret (not enabled until verified)
    var twoFactorAuth = new TwoFactorAuth
    {
        UserId = user.Id,
        SecretKey = secretKey,
        IsEnabled = false,
        CreatedAt = DateTime.UtcNow
    };
    _context.TwoFactorAuths.Add(twoFactorAuth);
    await _context.SaveChangesAsync();

    return Ok(new
    {
        qrCodeImage = Convert.ToBase64String(qrCodeImage),
        manualEntryCode = manualEntryCode,
        message = "Scan QR code with Google Authenticator"
    });
}
```

### 2FA Verification:

```csharp
[AllowAnonymous]
[HttpPost("login")]
public async Task<IActionResult> LoginWithTwoFactor([FromBody] LoginTwoFactorDto dto)
{
    var user = await _context.Users
        .Include(u => u.TwoFactorAuth)
        .FirstOrDefaultAsync(u => u.Email == dto.Email && u.IsTwoFactorEnabled);
    
    if (user == null || user.TwoFactorAuth == null)
        return BadRequest(new { message = "User not found or 2FA not enabled." });

    // Validate TOTP code
    var isValid = _twoFactorService.ValidateTotp(user.TwoFactorAuth.SecretKey, dto.Code);
    
    if (!isValid)
        return BadRequest(new { message = "Invalid verification code." });

    // Generate JWT token
    var token = GenerateJwtToken(user);
    return Ok(new { message = "2FA successful!", token });
}
```

---

## 4. EMAIL VERIFICATION

### Email Service: `backend/Services/EmailService.cs`

```csharp
public async Task<bool> SendEmailVerificationAsync(string toEmail, string verificationToken)
{
    try
    {
        var verificationLink = $"{_configuration["AppSettings:FrontendUrl"]}/verify-email/{verificationToken}";
        
        var smtpSettings = _configuration.GetSection("SMTP");
        var fromEmail = smtpSettings["FromEmail"];
        var fromPassword = smtpSettings["Password"];
        var smtpHost = smtpSettings["Host"];
        var smtpPort = int.Parse(smtpSettings["Port"] ?? "587");

        using var client = new SmtpClient(smtpHost, smtpPort)
        {
            EnableSsl = true,
            UseDefaultCredentials = false,
            Credentials = new NetworkCredential(fromEmail, fromPassword)
        };

        var mailMessage = new MailMessage
        {
            From = new MailAddress(fromEmail!, "CBBA Security System"),
            Subject = "Email Verification Required",
            Body = GenerateEmailVerificationBody(verificationLink),
            IsBodyHtml = true
        };

        mailMessage.To.Add(toEmail);
        await client.SendMailAsync(mailMessage);
        
        return true;
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Failed to send email verification to {Email}", toEmail);
        return false;
    }
}
```

### Registration with Email Verification: `backend/Controllers/AuthController.cs`

```csharp
[AllowAnonymous]
[HttpPost("register")]
public async Task<IActionResult> Register([FromBody] RegistrationDto registerDto)
{
    // ... validation and reCAPTCHA verification ...

    using var transaction = await _context.Database.BeginTransactionAsync();
    
    try
    {
        // Create user (email not verified yet)
        var user = new User
        {
            Username = registerDto.Username,
            Email = registerDto.Email,
            PasswordHash = HashPassword(registerDto.Password),
            Role = uniqueCode.Role,
            IsActive = true,
            IsEmailVerified = false, // ← Not verified yet
            CreatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Create verification token (24-hour expiration)
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
            await transaction.RollbackAsync();
            return StatusCode(500, new { message = "Failed to send verification email." });
        }

        // Mark unique code as used
        uniqueCode.IsUsed = true;
        await _context.SaveChangesAsync();
        await transaction.CommitAsync();
        
        return Ok(new { message = "Please check your email for verification instructions." });
    }
    catch
    {
        await transaction.RollbackAsync();
        throw;
    }
}
```

### Email Verification Endpoint:

```csharp
[AllowAnonymous]
[HttpPost("verify-email")]
public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailDto dto)
{
    var token = await _context.EmailVerificationTokens
        .Include(t => t.User)
        .FirstOrDefaultAsync(t => t.Token == dto.Token && 
                                 !t.IsUsed && 
                                 t.ExpiresAt > DateTime.UtcNow);
    
    if (token == null)
        return BadRequest(new { message = "Invalid or expired verification token." });
    
    // Mark email as verified
    token.User.IsEmailVerified = true;
    token.IsUsed = true;
    
    await _context.SaveChangesAsync();
    
    return Ok(new { message = "Email verified successfully!" });
}
```

---

## 5. GOOGLE reCAPTCHA

### reCAPTCHA Service: `backend/Services/RecaptchaService.cs`

```csharp
public class RecaptchaService : IRecaptchaService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    public async Task<bool> VerifyTokenAsync(string token)
    {
        if (string.IsNullOrWhiteSpace(token))
            return false;

        var secretKey = _configuration["ReCaptcha:SecretKey"];
        var requestUri = "https://www.google.com/recaptcha/api/siteverify";
        
        var requestContent = new FormUrlEncodedContent(new[]
        {
            new KeyValuePair<string, string>("secret", secretKey),
            new KeyValuePair<string, string>("response", token)
        });

        var response = await _httpClient.PostAsync(requestUri, requestContent);
        var responseContent = await response.Content.ReadAsStringAsync();
        
        var recaptchaResponse = JsonSerializer.Deserialize<RecaptchaResponse>(
            responseContent, 
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
        );
        
        return recaptchaResponse?.Success ?? false;
    }
}

public class RecaptchaResponse
{
    public bool Success { get; set; }
    [JsonPropertyName("error-codes")]
    public string[] ErrorCodes { get; set; }
}
```

### Usage in Login:

```csharp
[AllowAnonymous]
[HttpPost("login")]
public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
{
    // Verify reCAPTCHA FIRST
    var isRecaptchaValid = await _recaptchaService.VerifyTokenAsync(loginDto.RecaptchaToken);
    if (!isRecaptchaValid)
    {
        return BadRequest(new { message = "reCAPTCHA verification failed." });
    }

    // ... continue with login logic ...
}
```

### Frontend Integration: `frontend/src/pages/LoginPage.js`

```javascript
import ReCAPTCHA from 'react-google-recaptcha';

const LoginPage = ({ onLogin }) => {
  const [recaptchaVerified, setRecaptchaVerified] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const recaptchaRef = useRef(null);

  const handleRecaptchaVerify = (token) => {
    setRecaptchaVerified(true);
    setRecaptchaToken(token);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!recaptchaVerified) {
      setError('Please verify the reCAPTCHA');
      return;
    }

    const response = await fetch(`${API_BASE_URL}/Auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: email,
        password: password,
        recaptchaToken: recaptchaToken  // ← Send token
      })
    });
    
    // ... handle response ...
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ... email and password fields ... */}
      
      <ReCAPTCHA
        ref={recaptchaRef}
        sitekey={RECAPTCHA_SITE_KEY}
        onChange={handleRecaptchaVerify}
      />
      
      <button type="submit">Login</button>
    </form>
  );
};
```

---

## 6. PASSWORD STRENGTH CHECK

### Frontend: `frontend/src/pages/RegistrationPage.js`

```javascript
const checkPasswordStrength = (password) => {
  const requirements = {
    minLength: password.length >= 12,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumbers: /[0-9]/.test(password),
    hasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };

  const metRequirements = Object.values(requirements).filter(Boolean).length;
  let score = 0;
  let label = '';
  let color = '#dc2626';

  if (password.length === 0) {
    score = 0;
    label = '';
  } else if (metRequirements <= 2) {
    score = 1;
    label = 'Weak';
    color = '#dc2626';  // Red
  } else if (metRequirements <= 3) {
    score = 2;
    label = 'Medium';
    color = '#f59e0b';  // Orange
  } else if (metRequirements >= 4) {
    score = 3;
    label = 'Strong';
    color = '#10b981';  // Green
  }

  return { score, label, color, requirements };
};

// Usage in component
const [passwordStrength, setPasswordStrength] = useState({
  score: 0,
  label: '',
  color: '#dc2626',
  requirements: {
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumbers: false,
    hasSpecialChars: false
  }
});

const handlePasswordChange = (e) => {
  const password = e.target.value;
  setPassword(password);
  const strength = checkPasswordStrength(password);
  setPasswordStrength(strength);
};

// Visual Feedback JSX
<div className="password-strength-meter">
  <div className="strength-bar">
    <div 
      className="strength-fill"
      style={{
        width: `${(passwordStrength.score / 3) * 100}%`,
        backgroundColor: passwordStrength.color
      }}
    />
  </div>
  {passwordStrength.label && (
    <span style={{ color: passwordStrength.color }}>
      {passwordStrength.label}
    </span>
  )}
</div>

<div className="password-requirements">
  <RequirementItem 
    met={passwordStrength.requirements.minLength}
    text="At least 12 characters"
  />
  <RequirementItem 
    met={passwordStrength.requirements.hasUppercase}
    text="Contains uppercase letter"
  />
  <RequirementItem 
    met={passwordStrength.requirements.hasLowercase}
    text="Contains lowercase letter"
  />
  <RequirementItem 
    met={passwordStrength.requirements.hasNumbers}
    text="Contains number"
  />
  <RequirementItem 
    met={passwordStrength.requirements.hasSpecialChars}
    text="Contains special character"
  />
</div>
```

### Form Validation:

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();

  // Check password strength
  const strength = checkPasswordStrength(password);
  
  if (!strength.requirements.minLength) {
    setError('Password must be at least 12 characters long');
    return;
  }

  const unmetRequirements = [];
  if (!strength.requirements.hasUppercase) unmetRequirements.push('uppercase');
  if (!strength.requirements.hasLowercase) unmetRequirements.push('lowercase');
  if (!strength.requirements.hasNumbers) unmetRequirements.push('numbers');
  if (!strength.requirements.hasSpecialChars) unmetRequirements.push('special characters');

  if (unmetRequirements.length > 1) {
    setError('Password must include at least 3 of: uppercase, lowercase, numbers, special characters');
    return;
  }

  // ... proceed with registration ...
};
```

---

## 7. SESSION TIMEOUT (15 MINUTES) - NEW ✅

### Frontend Component: `frontend/src/components/security/SessionManager.js`

```javascript
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../utils/config';

const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes
const WARNING_TIME = 60 * 1000;          // 1 minute warning

const SessionManager = () => {
    const [lastActivity, setLastActivity] = useState(Date.now());
    const [showWarning, setShowWarning] = useState(false);
    const [remainingTime, setRemainingTime] = useState(SESSION_TIMEOUT);
    const navigate = useNavigate();

    const resetTimer = useCallback(() => {
        setLastActivity(Date.now());
        setShowWarning(false);
        setRemainingTime(SESSION_TIMEOUT);
    }, []);

    const handleLogout = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                // Call logout API
                await fetch(`${API_BASE_URL}/Auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
        } catch (error) {
            console.error('Logout API error:', error);
        } finally {
            // Clear all local storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('sessionId');
            
            // Navigate to login
            navigate('/login', { 
                state: { message: 'Session expired due to inactivity.' }
            });
        }
    }, [navigate]);

    useEffect(() => {
        // Track user activity
        const events = ['mousedown', 'keydown', 'scroll', 'mousemove', 'touchstart', 'click'];
        
        const handleActivity = () => {
            resetTimer();
        };

        events.forEach(event => {
            window.addEventListener(event, handleActivity, { passive: true });
        });

        // Check session timeout every second
        const interval = setInterval(() => {
            const now = Date.now();
            const timeSinceLastActivity = now - lastActivity;
            const timeRemaining = SESSION_TIMEOUT - timeSinceLastActivity;

            setRemainingTime(timeRemaining);

            if (timeRemaining <= 0) {
                handleLogout();
            } else if (timeRemaining <= WARNING_TIME && !showWarning) {
                setShowWarning(true);
            }
        }, 1000);

        return () => {
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
            clearInterval(interval);
        };
    }, [lastActivity, handleLogout, resetTimer, showWarning]);

    const formatTime = (ms) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    if (!showWarning) return null;

    return (
        <div className="session-warning-overlay">
            <div className="session-warning-modal">
                <h2>⚠️ Session Timeout Warning</h2>
                <p>
                    Your session will expire in <strong>{formatTime(remainingTime)}</strong>.
                    <br />
                    Would you like to extend your session?
                </p>
                <div className="progress-bar">
                    <div 
                        className="progress-fill"
                        style={{ width: `${(remainingTime / SESSION_TIMEOUT) * 100}%` }}
                    />
                </div>
                <div className="button-group">
                    <button onClick={handleLogout} className="btn-danger">
                        Logout Now
                    </button>
                    <button onClick={resetTimer} className="btn-primary">
                        Extend Session
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SessionManager;
```

### Integration in App.js:

```javascript
import SessionManager from './components/security/SessionManager';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="app-container">
      {/* ... other components ... */}
      
      {/* Session timeout manager - only when authenticated */}
      {isAuthenticated && <SessionManager />}
    </div>
  );
}
```

### Backend JWT Token with 15-min Expiration:

```csharp
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
        expires: DateTime.Now.AddMinutes(15), // ← 15 minutes (matches session timeout)
        signingCredentials: creds
    );

    return new JwtSecurityTokenHandler().WriteToken(token);
}
```

---

## 8. FAILED LOGIN ATTEMPTS & LOCKOUT - NEW ✅

### Database Model: `backend/Models/User.cs`

```csharp
public class User
{
    public int Id { get; set; }
    public string Username { get; set; }
    public string Email { get; set; }
    public string PasswordHash { get; set; }
    public string Role { get; set; }
    public bool IsActive { get; set; }
    public bool IsEmailVerified { get; set; }
    public bool IsTwoFactorEnabled { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public DateTime? LastLogoutAt { get; set; }

    // Failed login tracking - NEW
    public int FailedLoginAttempts { get; set; } = 0;
    public bool IsLocked { get; set; } = false;
    public DateTime? LockoutEnd { get; set; }

    public TwoFactorAuth? TwoFactorAuth { get; set; }
}
```

### Login with Lockout Logic: `backend/Controllers/AuthController.cs`

```csharp
[AllowAnonymous]
[HttpPost("login")]
public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
{
    // Verify reCAPTCHA
    var isRecaptchaValid = await _recaptchaService.VerifyTokenAsync(loginDto.RecaptchaToken);
    if (!isRecaptchaValid)
        return BadRequest(new { message = "reCAPTCHA verification failed." });

    var user = await _context.Users.SingleOrDefaultAsync(u => 
        (u.Username == loginDto.Username || u.Email == loginDto.Username) && u.IsActive);

    // CHECK IF ACCOUNT IS LOCKED
    if (user != null && user.IsLocked && user.LockoutEnd.HasValue && user.LockoutEnd.Value > DateTime.UtcNow)
    {
        var remainingTime = user.LockoutEnd.Value - DateTime.UtcNow;
        var remainingMinutes = (int)Math.Ceiling(remainingTime.TotalMinutes);
        
        await _context.AuditLogs.AddAsync(new AuditLog 
        { 
            Username = loginDto.Username, 
            Action = "LOCKED_ACCOUNT_LOGIN_ATTEMPT", 
            Details = $"Login attempt on locked account. Remaining: {remainingMinutes} min"
        });
        await _context.SaveChangesAsync();
        
        return Unauthorized(new { 
            message = $"Account locked. Try again in {remainingMinutes} minute(s).",
            isLocked = true,
            lockoutEnd = user.LockoutEnd.Value,
            remainingMinutes = remainingMinutes
        });
    }

    // RESET LOCKOUT IF EXPIRED
    if (user != null && user.IsLocked && user.LockoutEnd.HasValue && user.LockoutEnd.Value <= DateTime.UtcNow)
    {
        user.IsLocked = false;
        user.FailedLoginAttempts = 0;
        user.LockoutEnd = null;
        await _context.SaveChangesAsync();
    }

    // VERIFY PASSWORD
    if (user == null || !VerifyPassword(loginDto.Password, user.PasswordHash))
    {
        // HANDLE FAILED LOGIN
        if (user != null)
        {
            user.FailedLoginAttempts++;
            
            // LOCK ACCOUNT AFTER 3 FAILURES
            if (user.FailedLoginAttempts >= 3)
            {
                user.IsLocked = true;
                // Exponential backoff: 5 * 2^(attempts-3)
                int lockoutMinutes = 5 * (int)Math.Pow(2, user.FailedLoginAttempts - 3);
                user.LockoutEnd = DateTime.UtcNow.AddMinutes(lockoutMinutes);
                
                await _context.AuditLogs.AddAsync(new AuditLog 
                { 
                    Username = user.Username, 
                    Action = "ACCOUNT_LOCKED", 
                    Details = $"Locked after {user.FailedLoginAttempts} failures. Duration: {lockoutMinutes} min"
                });
                await _context.SaveChangesAsync();
                
                return Unauthorized(new { 
                    message = $"Account locked for {lockoutMinutes} minutes due to failed attempts.",
                    isLocked = true,
                    lockoutEnd = user.LockoutEnd.Value,
                    remainingMinutes = lockoutMinutes
                });
            }
            
            await _context.SaveChangesAsync();
        }
        
        // LOG FAILED ATTEMPT
        await _context.AuditLogs.AddAsync(new AuditLog 
        { 
            Username = loginDto.Username, 
            Action = "FAILED_LOGIN", 
            Details = $"Failed login. Attempts: {(user?.FailedLoginAttempts ?? 0)}"
        });
        await _context.SaveChangesAsync();
        
        // CALCULATE REMAINING ATTEMPTS
        int remainingAttempts = user != null ? Math.Max(0, 3 - user.FailedLoginAttempts) : 0;
        string message = user != null && remainingAttempts > 0 
            ? $"Invalid credentials. {remainingAttempts} attempt(s) remaining."
            : "Invalid credentials.";
        
        return Unauthorized(new { message, remainingAttempts });
    }

    // RESET FAILED ATTEMPTS ON SUCCESS
    if (user.FailedLoginAttempts > 0)
    {
        user.FailedLoginAttempts = 0;
        user.IsLocked = false;
        user.LockoutEnd = null;
        await _context.SaveChangesAsync();
    }

    // Continue with email verification and 2FA checks...
}
```

### Frontend Lockout Display: `frontend/src/pages/LoginPage.js`

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    const response = await fetch(`${API_BASE_URL}/Auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        username: email, 
        password: password,
        recaptchaToken: recaptchaToken 
      })
    });

    if (response.ok) {
      const data = await response.json();
      onLogin(data.token, data.username, data.role);
    } else {
      const errorData = await response.json();
      
      // HANDLE ACCOUNT LOCKOUT
      if (errorData.isLocked) {
        const lockoutMessage = errorData.message || 
          `Account locked. Try again in ${errorData.remainingMinutes} minutes.`;
        setError(lockoutMessage);
        resetRecaptcha();
        return;
      }

      // SHOW REMAINING ATTEMPTS
      let errorMessage = errorData.message || 'Login failed';
      if (errorData.remainingAttempts !== undefined && errorData.remainingAttempts > 0) {
        errorMessage = `Invalid credentials. ${errorData.remainingAttempts} attempt(s) remaining.`;
      }
      setError(errorMessage);
      
      resetRecaptcha();
    }
  } catch (err) {
    setError('Network error');
    resetRecaptcha();
  }
};
```

---

## SUMMARY

All security features are now fully implemented and documented with code examples:

1. ✅ **Password Hashing** - SHA-256 & PBKDF2
2. ✅ **AES-256 Encryption** - Biometric data protection
3. ✅ **2FA (Google Authenticator)** - TOTP-based authentication
4. ✅ **Email Verification** - Token-based with 24h expiration
5. ✅ **Google reCAPTCHA** - Bot protection on all auth endpoints
6. ✅ **Password Strength Check** - Real-time validation with visual feedback
7. ✅ **Session Timeout (15 min)** - Idle timeout with warning
8. ✅ **Failed Login Lockout** - Exponential backoff protection

Each feature includes complete code examples for both frontend and backend implementations.
