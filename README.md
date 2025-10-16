# CISP_Behavioural_Biometric
FYP CISP CU, Aug 2025 to Oct 2025 


# Security Configuration Setup

## Backend Configuration (ASP.NET Core)

### Option 1: User Secrets (Recommended for Development)

```bash
# Navigate to backend directory
cd backend

# Initialize user secrets
dotnet user-secrets init

# Set your reCAPTCHA secret key
dotnet user-secrets set "ReCaptcha:SecretKey" "YOUR_ACTUAL_SECRET_KEY"

# Set your JWT key
dotnet user-secrets set "Jwt:Key" "YourVerySecretKeyForJWTAuth"
```

### Option 2: Environment Variables

Set the following environment variables:
- `ReCaptcha__SecretKey`: Your Google reCAPTCHA secret key
- `Jwt__Key`: Your JWT signing key

### Option 3: Production Configuration

For production, use:
- Azure Key Vault
- AWS Secrets Manager
- Environment variables in your hosting platform

## Frontend Configuration (React)

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and replace `YOUR_RECAPTCHA_SITE_KEY_HERE` with your actual site key

## Getting reCAPTCHA Keys

1. Go to [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Create a new site
3. Choose reCAPTCHA v2 "I'm not a robot" checkbox
4. Add your domain (localhost for development)
5. Copy the Site Key and Secret Key

## Test Keys for Development

Google provides test keys that always pass:
- **Site Key**: `6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI`
- **Secret Key**: `6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe`

## Important Security Notes

- ✅ **DO**: Use user secrets for development
- ✅ **DO**: Use environment variables for production
- ✅ **DO**: Add sensitive files to .gitignore
- ❌ **DON'T**: Commit secrets to version control
- ❌ **DON'T**: Use test keys in production
- ❌ **DON'T**: Share secret keys in chat/email