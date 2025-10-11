using System.Security.Cryptography;
using System.Text;
using System.Text.Encodings.Web;
using QRCoder;
using OtpNet;

namespace db_biometrics_mvp.Backend.Services
{
    public interface ITwoFactorAuthService
    {
        string GenerateSecretKey();
        string GenerateQrCodeUri(string email, string secretKey, string issuer = "CBBA Security System");
        byte[] GenerateQrCodeImage(string qrCodeUri);
        bool ValidateTotp(string secretKey, string userCode);
        string GetManualEntryCode(string secretKey);
    }

    public class TwoFactorAuthService : ITwoFactorAuthService
    {
        private readonly ILogger<TwoFactorAuthService> _logger;

        public TwoFactorAuthService(ILogger<TwoFactorAuthService> logger)
        {
            _logger = logger;
        }

        public string GenerateSecretKey()
        {
            // Generate a random 32-byte secret key
            var key = KeyGeneration.GenerateRandomKey(20); // 160 bits
            return Base32Encoding.ToString(key);
        }

        public string GenerateQrCodeUri(string email, string secretKey, string issuer = "CBBA Security System")
        {
            // Create the QR code URI in the format expected by Google Authenticator
            var encodedIssuer = UrlEncoder.Default.Encode(issuer);
            var encodedEmail = UrlEncoder.Default.Encode(email);
            
            return $"otpauth://totp/{encodedEmail}?secret={secretKey}&issuer={encodedIssuer}";
        }

        public byte[] GenerateQrCodeImage(string qrCodeUri)
        {
            try
            {
                using var qrGenerator = new QRCodeGenerator();
                using var qrCodeData = qrGenerator.CreateQrCode(qrCodeUri, QRCodeGenerator.ECCLevel.Q);
                using var qrCode = new PngByteQRCode(qrCodeData);
                
                return qrCode.GetGraphic(20); // 20 pixels per module
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate QR code for URI: {QrCodeUri}", qrCodeUri);
                throw new InvalidOperationException("Failed to generate QR code", ex);
            }
        }

        public bool ValidateTotp(string secretKey, string userCode)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(secretKey) || string.IsNullOrWhiteSpace(userCode))
                {
                    return false;
                }

                // Clean the user code (remove spaces, etc.)
                userCode = userCode.Replace(" ", "").Replace("-", "");
                
                if (userCode.Length != 6 || !userCode.All(char.IsDigit))
                {
                    return false;
                }

                var secretKeyBytes = Base32Encoding.ToBytes(secretKey);
                var totp = new Totp(secretKeyBytes);
                
                // Verify the code with a window of ±1 period (30 seconds before/after)
                var currentCode = totp.ComputeTotp();
                var previousCode = totp.ComputeTotp(DateTime.UtcNow.AddSeconds(-30));
                var nextCode = totp.ComputeTotp(DateTime.UtcNow.AddSeconds(30));

                return userCode == currentCode || userCode == previousCode || userCode == nextCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to validate TOTP code");
                return false;
            }
        }

        public string GetManualEntryCode(string secretKey)
        {
            // Format the secret key for manual entry (groups of 4 characters)
            var formatted = new StringBuilder();
            for (int i = 0; i < secretKey.Length; i += 4)
            {
                if (formatted.Length > 0)
                    formatted.Append(" ");
                
                var length = Math.Min(4, secretKey.Length - i);
                formatted.Append(secretKey.Substring(i, length));
            }
            return formatted.ToString();
        }
    }
}