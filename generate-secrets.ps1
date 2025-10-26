# CBBA Production Secrets Generator
# Run this script to generate all required secrets for production deployment
# Save the output securely - you'll need these values!

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "CBBA Production Secrets Generator" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Generate JWT Secret Key (32+ characters, alphanumeric)
Write-Host "[1/3] Generating JWT Secret Key..." -ForegroundColor Yellow
$jwtKey = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 48 | ForEach-Object {[char]$_})
Write-Host "JWT_SECRET_KEY (Use in backend Jwt__Key):" -ForegroundColor Green
Write-Host $jwtKey -ForegroundColor White
Write-Host ""

# Generate Encryption Key for Python Service (64 hex characters)
Write-Host "[2/3] Generating Encryption Key for Python ML Service..." -ForegroundColor Yellow
$encKey = -join ((0..63) | ForEach-Object { '{0:x}' -f (Get-Random -Maximum 16) })
Write-Host "ENCRYPTION_KEY (Use in Python service):" -ForegroundColor Green
Write-Host $encKey -ForegroundColor White
Write-Host ""

# Generate Database Password
Write-Host "[3/3] Generating SQL Server Admin Password..." -ForegroundColor Yellow
$upperChars = 65..90 | Get-Random -Count 4 | ForEach-Object {[char]$_}
$lowerChars = 97..122 | Get-Random -Count 4 | ForEach-Object {[char]$_}
$numbers = 48..57 | Get-Random -Count 4 | ForEach-Object {[char]$_}
$specialChars = '!@#$%^&*'.ToCharArray() | Get-Random -Count 2
$dbPassword = -join (($upperChars + $lowerChars + $numbers + $specialChars) | Get-Random -Count 14)
Write-Host "SQL_ADMIN_PASSWORD (Use for Azure SQL Server):" -ForegroundColor Green
Write-Host $dbPassword -ForegroundColor White
Write-Host ""

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Additional Secrets You Need to Obtain:" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "✓ Gmail App Password:" -ForegroundColor Yellow
Write-Host "  1. Go to: https://myaccount.google.com/apppasswords" -ForegroundColor Gray
Write-Host "  2. Generate new app password for 'Mail'" -ForegroundColor Gray
Write-Host "  3. Use this in SMTP__Password" -ForegroundColor Gray
Write-Host ""

Write-Host "✓ reCAPTCHA Keys (Production):" -ForegroundColor Yellow
Write-Host "  1. Go to: https://www.google.com/recaptcha/admin" -ForegroundColor Gray
Write-Host "  2. Create new site with your production domain" -ForegroundColor Gray
Write-Host "  3. Choose reCAPTCHA v2 'I'm not a robot'" -ForegroundColor Gray
Write-Host "  4. Get Site Key (for frontend) and Secret Key (for backend)" -ForegroundColor Gray
Write-Host ""

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Environment Variables Summary" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "BACKEND (Azure App Service):" -ForegroundColor Magenta
Write-Host "----------------------------" -ForegroundColor Gray
Write-Host "Jwt__Key = $jwtKey"
Write-Host "Jwt__Issuer = DbaConsole"
Write-Host "Jwt__Audience = DbaConsoleUsers"
Write-Host "SMTP__Host = smtp.gmail.com"
Write-Host "SMTP__Port = 587"
Write-Host "SMTP__FromEmail = your-email@gmail.com"
Write-Host "SMTP__Password = [GET FROM GMAIL APP PASSWORDS]"
Write-Host "ReCaptcha__SiteKey = [GET FROM RECAPTCHA ADMIN]"
Write-Host "ReCaptcha__SecretKey = [GET FROM RECAPTCHA ADMIN]"
Write-Host "PythonCBBAService__Url = [SET AFTER PYTHON DEPLOYMENT]"
Write-Host "AppSettings__FrontendUrl = [SET AFTER FRONTEND DEPLOYMENT]"
Write-Host "ConnectionStrings__DefaultConnection = [SET WITH YOUR SQL CONNECTION STRING]"
Write-Host ""

Write-Host "PYTHON SERVICE (Azure Container):" -ForegroundColor Magenta
Write-Host "-----------------------------------" -ForegroundColor Gray
Write-Host "FLASK_PORT = 5001"
Write-Host "ENCRYPTION_KEY = $encKey"
Write-Host "MODEL_STORAGE_PATH = /app/models"
Write-Host "RISK_THRESHOLD_MODERATE = 50"
Write-Host "RISK_THRESHOLD_HIGH = 80"
Write-Host ""

Write-Host "FRONTEND (Vercel):" -ForegroundColor Magenta
Write-Host "------------------" -ForegroundColor Gray
Write-Host "REACT_APP_API_URL = [SET AFTER BACKEND DEPLOYMENT]"
Write-Host "REACT_APP_RECAPTCHA_SITE_KEY = [GET FROM RECAPTCHA ADMIN]"
Write-Host ""

Write-Host "DATABASE (Azure SQL):" -ForegroundColor Magenta
Write-Host "---------------------" -ForegroundColor Gray
Write-Host "Admin Username = cbbaadmin"
Write-Host "Admin Password = $dbPassword"
Write-Host ""

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "IMPORTANT: Save These Secrets Securely!" -ForegroundColor Red
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Copy all values above to a secure password manager" -ForegroundColor Yellow
Write-Host "2. NEVER commit these values to Git" -ForegroundColor Yellow
Write-Host "3. Use environment variables in production" -ForegroundColor Yellow
Write-Host "4. Rotate keys regularly (every 90 days)" -ForegroundColor Yellow
Write-Host ""

# Option to save to file
$save = Read-Host "Do you want to save these secrets to a file? (y/N)"
if ($save -eq 'y' -or $save -eq 'Y') {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $filename = "CBBA_Secrets_$timestamp.txt"
    
    @"
CBBA Production Secrets - Generated $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
===========================================================================

⚠️  KEEP THIS FILE SECURE - DO NOT COMMIT TO GIT ⚠️

GENERATED SECRETS:
==================

JWT Secret Key (Backend Jwt__Key):
$jwtKey

Encryption Key (Python ENCRYPTION_KEY):
$encKey

SQL Admin Password:
$dbPassword

SECRETS TO OBTAIN MANUALLY:
===========================

Gmail App Password (SMTP__Password):
[Get from: https://myaccount.google.com/apppasswords]

reCAPTCHA Site Key (Frontend):
[Get from: https://www.google.com/recaptcha/admin]

reCAPTCHA Secret Key (Backend):
[Get from: https://www.google.com/recaptcha/admin]

BACKEND ENVIRONMENT VARIABLES:
==============================
Jwt__Key = $jwtKey
Jwt__Issuer = DbaConsole
Jwt__Audience = DbaConsoleUsers
SMTP__Host = smtp.gmail.com
SMTP__Port = 587
SMTP__FromEmail = your-email@gmail.com
SMTP__Password = [YOUR_GMAIL_APP_PASSWORD]
ReCaptcha__SiteKey = [YOUR_RECAPTCHA_SITE_KEY]
ReCaptcha__SecretKey = [YOUR_RECAPTCHA_SECRET_KEY]
PythonCBBAService__Url = [PYTHON_SERVICE_URL]
AppSettings__FrontendUrl = [FRONTEND_URL]
ConnectionStrings__DefaultConnection = Server=tcp:cbba-sql-server-unique.database.windows.net,1433;Database=db_biometrics_mvp;User ID=cbbaadmin;Password=$dbPassword;Encrypt=True;

PYTHON SERVICE ENVIRONMENT VARIABLES:
====================================
FLASK_PORT = 5001
ENCRYPTION_KEY = $encKey
MODEL_STORAGE_PATH = /app/models
RISK_THRESHOLD_MODERATE = 50
RISK_THRESHOLD_HIGH = 80

FRONTEND ENVIRONMENT VARIABLES:
==============================
REACT_APP_API_URL = [BACKEND_URL]
REACT_APP_RECAPTCHA_SITE_KEY = [YOUR_RECAPTCHA_SITE_KEY]

DATABASE CREDENTIALS:
====================
Admin Username: cbbaadmin
Admin Password: $dbPassword

SECURITY NOTES:
==============
1. Store this file in a secure location (password manager, encrypted drive)
2. Delete this file after copying values to production
3. Never commit to version control
4. Rotate keys every 90 days
5. Use different keys for staging and production
6. Enable 2FA on all admin accounts

"@ | Out-File -FilePath $filename -Encoding UTF8
    
    Write-Host ""
    Write-Host "✓ Secrets saved to: $filename" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: This file contains sensitive secrets!" -ForegroundColor Red
    Write-Host "   - Store it securely" -ForegroundColor Yellow
    Write-Host "   - Delete after use" -ForegroundColor Yellow
    Write-Host "   - Never commit to Git" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Generation complete! Good luck with deployment! 🚀" -ForegroundColor Green
Write-Host ""
