# CBBA Security Features Documentation

## Project Overview
**Continuous Behavioural Biometric Authentication (CBBA)** through keystroke and mouse movement dynamics in a DBA Console.

---

## Current Security Implementations

### 1. Password Hashing ✅

**Location:** `backend/Controllers/AuthController.cs` (Lines 101-114)

**Implementation:**
```csharp
private static string HashPassword(string password)
{
    using (var sha256 = SHA256.Create())
    {
        var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return BitConverter.ToString(hashedBytes).Replace("-", "").ToLower();
    }
}

private bool VerifyPassword(string enteredPassword, string storedHash)
{
    return HashPassword(enteredPassword) == storedHash;
}
```

**Details:**
- Uses **SHA-256** hashing algorithm
- Converts password to bytes and hashes
- Verifies by comparing hashed values
- Used in: Login, Registration, Password Reset

**Also available in:** `backend/Services/SecurityService.cs` with enhanced PBKDF2 implementation

---

### 2. AES-256 Encryption for Biometric Data ✅

**Location:** `backend/Services/BiometricEncryptionService.cs`

**Implementation:**
```csharp
public string EncryptBiometricData(string data)
{
    using var aes = Aes.Create();
    aes.Key = _key;                    // 256-bit key
    aes.IV = _iv;
    aes.Mode = CipherMode.CBC;         // Cipher Block Chaining
    aes.Padding = PaddingMode.PKCS7;

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
```

**Features:**
- **AES-256** encryption algorithm
- **CBC (Cipher Block Chaining)** mode for enhanced security
- **PKCS7** padding for data alignment
- Key and IV stored securely in configuration
- Supports both encryption and decryption of biometric data (keystroke and mouse movement)

**Configuration:** `appsettings.json`
```json
"BiometricEncryption": {
  "Key": "<Base64 encoded 256-bit key>",
  "IV": "<Base64 encoded initialization vector>"
}
```

---

### 3. Two-Factor Authentication (Google Authenticator) ✅

**Location:** `backend/Services/TwoFactorAuthService.cs` and `backend/Controllers/TwoFactorController.cs`

**Key Components:**

#### Secret Key Generation:
```csharp
public string GenerateSecretKey()
{
    var key = KeyGeneration.GenerateRandomKey(20); // 160 bits
    return Base32Encoding.ToString(key);
}
```

#### QR Code Generation:
```csharp
public byte[] GenerateQrCodeImage(string qrCodeUri)
{
    using var qrGenerator = new QRCodeGenerator();
    using var qrCodeData = qrGenerator.CreateQrCode(qrCodeUri, QRCodeGenerator.ECCLevel.Q);
    using var qrCode = new PngByteQRCode(qrCodeData);
    
    return qrCode.GetGraphic(20); // 20 pixels per module
}
```

#### TOTP Validation:
```csharp
public bool ValidateTotp(string secretKey, string userCode)
{
    var secretKeyBytes = Base32Encoding.ToBytes(secretKey);
    var totp = new Totp(secretKeyBytes);
    
    // Verify with ±1 period window (30 seconds before/after)
    var currentCode = totp.ComputeTotp();
    var previousCode = totp.ComputeTotp(DateTime.UtcNow.AddSeconds(-30));
    var nextCode = totp.ComputeTotp(DateTime.UtcNow.AddSeconds(30));

    return userCode == currentCode || userCode == previousCode || userCode == nextCode;
}
```

**Database Model:** `backend/Models/TwoFactorAuth.cs`
- Stores SecretKey (encrypted)
- IsEnabled flag
- BackupCodes (optional)

**Flow:**
1. User registers and verifies email
2. Setup endpoint generates QR code + manual entry code
3. User scans with Google Authenticator
4. User verifies code to enable 2FA
5. Login requires TOTP code after password verification

**Frontend:** `frontend/src/TwoFactorSetupPage.js` & `frontend/src/TwoFactorLoginPage.js`

---

### 4. Email Verification ✅

**Location:** `backend/Services/EmailService.cs` and `backend/Controllers/AuthController.cs`

**Database Model:** `backend/Models/EmailVerificationToken.cs`
```csharp
public class EmailVerificationToken
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Token { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }  // 24-hour expiration
    public bool IsUsed { get; set; }
}
```

**Email Sending Service:**
```csharp
public async Task<bool> SendEmailVerificationAsync(string toEmail, string verificationToken)
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

    // ... sends HTML email with verification link
}
```

**Registration Flow (Lines 249-355 in AuthController.cs):**
1. User submits registration form
2. System validates unique code
3. Creates user account (IsEmailVerified = false)
4. Generates verification token (GUID)
5. Sends verification email
6. User clicks link to verify
7. 2FA setup required before login

**Verification Endpoint:**
```csharp
[HttpPost("verify-email")]
public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailDto dto)
{
    var token = await _context.EmailVerificationTokens
        .Include(t => t.User)
        .FirstOrDefaultAsync(t => t.Token == dto.Token && !t.IsUsed && t.ExpiresAt > DateTime.UtcNow);
    
    if (token == null)
        return BadRequest(new { message = "Invalid or expired verification token." });
    
    token.User.IsEmailVerified = true;
    token.IsUsed = true;
    await _context.SaveChangesAsync();
    
    return Ok(new { message = "Email verified successfully!" });
}
```

**Frontend:** `frontend/src/pages/EmailVerificationPage.js` & `frontend/src/VerifyEmailPage.js`

---

### 5. Google reCAPTCHA ✅

**Location:** `backend/Services/RecaptchaService.cs`

**Implementation:**
```csharp
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
    
    var recaptchaResponse = JsonSerializer.Deserialize<RecaptchaResponse>(responseContent);
    
    return recaptchaResponse?.Success ?? false;
}
```

**Configuration:** `appsettings.json`
```json
"ReCaptcha": {
  "SiteKey": "<Your site key>",
  "SecretKey": "<Your secret key>"
}
```

**Used In:**
- Login (AuthController.cs Line 46)
- Registration (AuthController.cs Line 253)
- Password Reset (AuthController.cs Line 141)
- Two-Factor Verification (TwoFactorController.cs Line 95)

**Frontend Integration:**
```javascript
import ReCAPTCHA from 'react-google-recaptcha';

<ReCAPTCHA
  ref={recaptchaRef}
  sitekey={RECAPTCHA_SITE_KEY}
  onChange={handleRecaptchaVerify}
/>
```

**Frontend Locations:**
- `frontend/src/pages/LoginPage.js`
- `frontend/src/pages/RegistrationPage.js`
- `frontend/src/pages/ResetPasswordPage.js`
- `frontend/src/TwoFactorLoginPage.js`

---

### 6. Password Strength Check ✅

**Location:** `frontend/src/pages/RegistrationPage.js` (Lines 44-81)

**Implementation:**
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
      color = '#dc2626';
    } else if (metRequirements <= 2) {
      score = 1;
      label = 'Weak';
      color = '#dc2626';
    } else if (metRequirements <= 3) {
      score = 2;
      label = 'Medium';
      color = '#f59e0b';
    } else if (metRequirements >= 4) {
      score = 3;
      label = 'Strong';
      color = '#10b981';
    }

    return { score, label, color, requirements };
  };
```

**Visual Feedback:**
- Real-time strength indicator
- Color-coded (Red=Weak, Orange=Medium, Green=Strong)
- Shows which requirements are met/unmet
- Progress bar visualization

**Requirements Enforced:**
- Minimum 12 characters
- At least 3 of: uppercase, lowercase, numbers, special characters

**Backend Validation:** `backend/Services/SecurityService.cs`
```csharp
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
```

---

## New Security Features to Implement

### 7. Session Timeout (15 Minutes) ⚠️ PARTIALLY IMPLEMENTED

**Current Status:** Basic implementation exists in `frontend/src/components/security/SessionManager.js`

**Current Implementation:**
- 15-minute idle timeout configured
- Warning dialog 1 minute before timeout
- Tracks user activity (mouse, keyboard, scroll, touch)
- Auto-logout on timeout

**What's Missing:**
- Not integrated into all pages
- No backend session validation
- No server-side session tracking
- Token expiration doesn't match session timeout

**Required Improvements:**
1. Integrate SessionManager in main App component
2. Synchronize JWT token expiration with session timeout
3. Add backend middleware to track session activity
4. Implement proper logout API call
5. Clear all client-side data on timeout

---

### 8. Failed Login Attempts & Account Lockout ⚠️ PARTIALLY IMPLEMENTED

**Current Status:** Service exists but not integrated in AuthController

**Existing Service:** `backend/Services/SecurityService.cs`
```csharp
public async Task<(bool success, string message)> CheckLoginAttempt(string username)
public async Task HandleFailedLoginAttempt(string username)
public async Task ResetLoginAttempts(string username)
```

**Lockout Policy:**
- 3 failed attempts → Account locked
- Exponential backoff: 5 minutes × 2^(attempts-3)
- Example: 4th failure = 5 min, 5th = 10 min, 6th = 20 min, etc.

**What's Missing:**
- Fields not in User model (IsLocked, LockoutEnd, FailedLoginAttempts)
- Not called in AuthController login flow
- Database migration needed
- Frontend feedback for locked accounts

**Required Implementation:**
1. Add fields to User model
2. Create migration
3. Integrate into login flow
4. Add admin unlock functionality
5. Update frontend to show lockout message

---

## Security Best Practices Currently Implemented

1. **Defense in Depth:** Multiple layers (password, 2FA, CBBA, reCAPTCHA)
2. **Secure Communication:** HTTPS enforced, CORS configured
3. **Input Validation:** Both client and server-side
4. **Audit Logging:** All authentication events tracked
5. **Token-based Authentication:** JWT with proper expiration
6. **Email Security:** Verification prevents unauthorized access
7. **Biometric Privacy:** AES-256 encryption for sensitive behavioral data
8. **No PII in Logs:** Sensitive data properly masked

---

## Configuration Files

### Backend: `appsettings.json`
```json
{
  "Jwt": {
    "Key": "<secret key>",
    "Issuer": "CBBA-Backend",
    "Audience": "CBBA-Frontend"
  },
  "ReCaptcha": {
    "SiteKey": "<site key>",
    "SecretKey": "<secret key>"
  },
  "SMTP": {
    "Host": "smtp.gmail.com",
    "Port": "587",
    "FromEmail": "<email>",
    "Password": "<app password>"
  },
  "BiometricEncryption": {
    "Key": "<Base64 256-bit key>",
    "IV": "<Base64 IV>"
  },
  "AppSettings": {
    "FrontendUrl": "http://localhost:3000"
  }
}
```

### Frontend: `.env`
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_RECAPTCHA_SITE_KEY=<site key>
```

---

## Dependencies

### Backend (NuGet):
- Microsoft.AspNetCore.Authentication.JwtBearer
- Microsoft.EntityFrameworkCore
- QRCoder (for 2FA QR codes)
- OtpNet (for TOTP generation/validation)

### Frontend (npm):
- react-google-recaptcha
- @mui/material (for UI components)
- axios (for API calls)

---

## Testing Recommendations

1. **Password Hashing:** Verify same password produces different hashes (if using salt)
2. **AES Encryption:** Test encrypt/decrypt cycle
3. **2FA:** Test with actual Google Authenticator app
4. **Email Verification:** Test with real SMTP server
5. **reCAPTCHA:** Test with valid/invalid tokens
6. **Password Strength:** Test edge cases (11 chars, all lowercase, etc.)
7. **Session Timeout:** Test idle behavior and activity reset
8. **Failed Logins:** Test lockout durations and exponential backoff

---

## Next Steps

1. ✅ Complete Session Timeout integration
2. ✅ Complete Failed Login Attempts feature
3. Consider adding:
   - Rate limiting on API endpoints
   - IP-based blocking for repeated failures
   - Security headers (CSP, HSTS, etc.)
   - Password history (prevent reuse)
   - Multi-device session management
   - Biometric profile versioning
