using System.Net;
using System.Net.Mail;

namespace db_biometrics_mvp.Backend.Services
{
    public interface IEmailService
    {
        Task<bool> SendPasswordResetEmailAsync(string toEmail, string resetToken);
    }

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<bool> SendPasswordResetEmailAsync(string toEmail, string resetToken)
        {
            try
            {
                var resetLink = $"{_configuration["AppSettings:FrontendUrl"]}/reset-password/{resetToken}";
                
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
                    Subject = "Password Reset Request",
                    Body = GenerateEmailBody(resetLink),
                    IsBodyHtml = true
                };

                mailMessage.To.Add(toEmail);

                await client.SendMailAsync(mailMessage);
                _logger.LogInformation("Password reset email sent successfully to {Email}", toEmail);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send password reset email to {Email}", toEmail);
                return false;
            }
        }

        private string GenerateEmailBody(string resetLink)
        {
            return $@"
                <html>
                <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
                    <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                        <h2 style='color: #2c3e50;'>Password Reset Request</h2>
                        
                        <p>You have requested a password reset for your CBBA Security System account.</p>
                        
                        <p>Click the button below to reset your password:</p>
                        
                        <div style='text-align: center; margin: 30px 0;'>
                            <a href='{resetLink}' 
                               style='background-color: #1f2937; color: white; padding: 12px 24px; 
                                      text-decoration: none; border-radius: 8px; display: inline-block;
                                      font-weight: bold;'>
                                Reset Password
                            </a>
                        </div>
                        
                        <p>Or copy and paste this link into your browser:</p>
                        <p style='word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;'>
                            {resetLink}
                        </p>
                        
                        <p><strong>Important:</strong></p>
                        <ul>
                            <li>This link will expire in 1 hour for security reasons</li>
                            <li>If you didn't request this password reset, please ignore this email</li>
                            <li>Never share this link with anyone</li>
                        </ul>
                        
                        <hr style='margin: 30px 0; border: 1px solid #eee;'>
                        <p style='font-size: 12px; color: #666;'>
                            This is an automated email from CBBA Security System. Please do not reply to this email.
                        </p>
                    </div>
                </body>
                </html>";
        }
    }
}