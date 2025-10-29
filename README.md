# CBBA System - Continuous Behavioral Biometric Authentication

**FYP CISP CU, Aug 2025 to Oct 2025**

## 🌐 Live Demo

**Production URL**: https://cbba.app

**Test Credentials** (Demo purposes only):
- Email: admin@cbba.app
- Password: Contact for demo access

---

## Overview

The CBBA (Continuous Behavioral Biometric Authentication) system is a security solution that provides real-time behavioral monitoring through advanced keystroke dynamics and mouse movement analysis. The system uses machine learning to continuously authenticate users by analyzing typing patterns and mouse movements, bot attacks, and unauthorized access attempts.

### Architecture

The system is deployed on **Microsoft Azure** with three main components:

1. **Frontend** (React 18 on Vercel) - https://cbba.app
2. **Backend** (ASP.NET Core 8 on Azure App Service) - RESTful API
3. **Python ML Service** (Flask on Azure Container Instances) - Machine learning inference
4. **Database** (Azure SQL Database) - Secure data storage

```
┌─────────────────────────────────────────────────────────────┐
│                    Production Deployment                     │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│                  │         │                  │         │                  │
│   Frontend       │────────▶│   Backend        │────────▶│  Python ML       │
│   (Vercel)       │  HTTPS  │  (Azure App      │  HTTP   │  Service         │
│   cbba.app       │         │   Service)       │         │  (Azure ACI)     │
│                  │         │                  │         │                  │
└──────────────────┘         └──────────────────┘         └──────────────────┘
                                      │
                                      ▼
                             ┌──────────────────┐
                             │   Azure SQL      │
                             │   Database       │
                             └──────────────────┘
```

### Key Features

✅ ** Keystroke Dynamics**
✅ **Machine Learning** - Ensemble approach (60% SVM + 25% IF + 15% Feature Distance)  
✅ **Real-time Monitoring** - Continuous assessment every 5 seconds  
✅ **Adaptive Security** - Graduated response based on risk levels  
✅ **Session Locking** - Automatic termination at 80%+ sustained risk  
✅ **Step-Up Authentication** - 2FA 6-digit re-verification for moderate risk (50-79%)  
✅ **End-to-End Encryption** - AES-256-GCM for biometric profiles  
✅ **Production-Ready** - Deployed on Azure with 99.9% uptime SLA  
✅ **Comprehensive Auditing** - Full activity logs with behavioral risk scores  
✅ **Email Verification** - SMTP integration with Gmail  
✅ **2FA Support** - TOTP-based two-factor authentication  
✅ **RBAC** - Role-based access control (Guest, User, Admin, Super Admin)

---

## Prerequisites

### Required Software

| Component | Version | Download Link |
|-----------|---------|---------------|
| **Node.js** | 18.x or higher | https://nodejs.org/ |
| **Python** | 3.9 or higher | https://www.python.org/ |
| **.NET SDK** | 8.0 or higher | https://dotnet.microsoft.com/download |
| **SQL Server** | 2019 or higher | https://www.microsoft.com/sql-server |

### Verify Installations

Open PowerShell and verify each component:

```powershell
# Check Node.js version
node --version
# Should output: v18.x.x or higher

# Check npm version
npm --version
# Should output: 9.x.x or higher

# Check Python version
python --version
# Should output: Python 3.9.x or higher

# Check pip version
pip --version
# Should output: pip 23.x.x or higher

# Check .NET SDK version
dotnet --version
# Should output: 8.0.x or higher
```

---

## Quick Start (Local Development)

### Prerequisites

| Component | Version | Download |
|-----------|---------|----------|
| **Node.js** | 18.x+ | https://nodejs.org/ |
| **Python** | 3.9+ | https://www.python.org/ |
| **.NET SDK** | 8.0+ | https://dotnet.microsoft.com/download |
| **SQL Server** | 2019+ | https://www.microsoft.com/sql-server |

### Installation

**1. Clone Repository**

```powershell
git clone https://github.com/kuniken99/CISP_Behavioural_Biometric.git
cd CISP_Behavioural_Biometric
```

**2. Database Setup**

```powershell
# Open SSMS and create database
CREATE DATABASE db_biometrics_mvp;

# Run migrations
cd backend
dotnet ef database update
```

**3. Backend Setup**

```powershell
cd backend
dotnet restore
dotnet build

# Update appsettings.json with your SQL Server connection string in:
**File:** `backend/appsettings.json`

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR_SERVER;Database=db_biometrics_mvp;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

# Run backend
dotnet run
# Backend runs at http://localhost:5000
```

**4. Python ML Service**

```powershell
cd cbba_python_service
pip install -r requirements.txt

# Run Python service
python app.py
# Service runs at http://localhost:5001
```

**5. Frontend Setup**

```powershell
cd frontend
npm install
npm start
# Frontend runs at http://localhost:3000
```

**6. Access Application**

Open browser: http://localhost:3000
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# If you get an execution policy error, run:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### Install Python Dependencies

```powershell
pip install -r requirements.txt
```

Dependencies installed:
- `scikit-learn` (Machine Learning models)
- `pandas` (Data manipulation)
- `numpy` (Numerical operations)
- `cryptography` (AES-256 encryption)
- `flask` (Web framework)
- `flask-cors` (Cross-origin resource sharing)
- `joblib` (Model persistence)
- `scipy` (Scientific computing)
- `python-dotenv` (Environment variables)

#### Verify Environment Configuration

Check that `.env` file exists with correct settings:

**File:** `cbba_python_service/.env`

```properties
FLASK_PORT=5001
ENCRYPTION_KEY=cc1b1069d03e7dfccf80c6991b50900290fb4d39f1d00f25409895f05190675c
MODEL_STORAGE_PATH=./models
RISK_THRESHOLD_MODERATE=50
RISK_THRESHOLD_HIGH=80
```

#### Create Models Directory

```powershell
# Create directory for storing trained ML models
New-Item -ItemType Directory -Force -Path models
```

### 5. Frontend Setup (React)

#### Navigate to Frontend Directory

```powershell
cd ../frontend
```

#### Install Node Dependencies

```powershell
npm install
```

This installs all required packages:
- `react` & `react-dom` (UI framework)
- `react-router-dom` (Routing)
- `react-google-recaptcha` (Bot protection)
- `uuid` (Unique identifiers)

#### Verify Environment Configuration

Check that `.env` file exists:

**File:** `frontend/.env`

```properties
REACT_APP_RECAPTCHA_SITE_KEY=6LfogeErAAAAAPl-jd4Opxslssej0QCL87ZWtYov
```

---


## Production Deployment (Azure)

The system is deployed on **Microsoft Azure** with the following architecture:

### Infrastructure

| Component | Service | URL/Details |
|-----------|---------|-------------|
| **Frontend** | Vercel | https://cbba.app |
| **Backend** | Azure App Service | cbba-backend-tank108.azurewebsites.net |
| **Python ML** | Azure Container Instances | 20.247.240.136:5001 (Docker) |
| **Database** | Azure SQL Database | cbba-sql-server-tank108.database.windows.net |
| **Storage** | Azure App Service (Encrypted ML models) | AES-256-GCM |

### Deployment Commands

**Backend Deployment:**
```powershell
cd backend
dotnet publish -c Release -o ./publish
az webapp deploy --resource-group cbba-production --name cbba-backend-tank108 --src-path ./publish.zip --type zip
az webapp restart --resource-group cbba-production --name cbba-backend-tank108
```

**Python ML Service (Docker):**
```powershell
cd cbba_python_service
docker build -t kuni888/cbba-ml-service:latest .
docker push kuni888/cbba-ml-service:latest
az container create --resource-group cbba-production --name cbba-ml-service-tank108 --image kuni888/cbba-ml-service:latest --cpu 1 --memory 1.5 --ports 5001 --ip-address Public --os-type Linux
```

**Frontend Deployment:**
```powershell
cd frontend
npm run build
vercel --prod
vercel alias set <deployment-url> cbba.app
```

### Environment Variables (Production)

**Backend (Azure App Service):**
- `ConnectionStrings__DefaultConnection`: Azure SQL connection string
- `PythonCBBAService__Url`: http://20.247.240.136:5001
- `AppSettings__FrontendUrl`: https://cbba.app
- `SMTP__*`: Gmail SMTP configuration
- `Jwt__*`: JWT signing configuration
- `ReCaptcha__*`: Google reCAPTCHA keys

**Frontend (Vercel):**
- `REACT_APP_API_BASE_URL`: https://cbba-backend-tank108-cqaqdefdf8ffehfx.southeastasia-01.azurewebsites.net/api
- `REACT_APP_RECAPTCHA_SITE_KEY`: 6LfogeErAAAAAPl-jd4Opxslssej0QCL87ZWtYov

---

## Training Behavioral Profiles

After registration, users must train their behavioral profile (minimum 300 samples recommended):

```powershell
cd cbba_python_service
python generate_training_data.py <username> <JWT_TOKEN> 300 <BACKEND_URL>
```

**Example (Production):**
```powershell
python generate_training_data.py tank108 eyJhbGci... 300 https://cbba-backend-tank108-cqaqdefdf8ffehfx.southeastasia-01.azurewebsites.net
```

**Training establishes:**
- Average typing speed (WPM)
- Dwell time patterns (key hold duration)
- Flight time patterns (time between keys)
- Backspace ratio baseline
- Pause frequency baseline

**Training Output:**
```
✓ Training Successful!
Results:
  • Samples trained: 300
  • Keystroke baseline: Established
  • Model Type: Isolation Forest + One-Class SVM + 5 Keystroke Patterns
  • Encryption: AES-256-GCM
  • Profile Status: Ready for real-time assessment
```

---

## Quick Reference Card

### Start All Services (Copy-Paste Ready)

Open three separate PowerShell terminals and run:

**Terminal 1 (Python):**
```powershell
cd e:\CISP_Behavioural_Biometric\cbba_python_service
.\venv\Scripts\Activate.ps1
python app.py
```

**Terminal 2 (Backend):**
```powershell
cd e:\CISP_Behavioural_Biometric\backend
dotnet run
```

**Terminal 3 (Frontend):**
```powershell
cd e:\CISP_Behavioural_Biometric\frontend
npm start
```

---

## Technical Documentation

### Security Features

**Encryption:**
- Algorithm: AES-256-GCM
- Key Derivation: PBKDF2 with 600,000 iterations
- Implementation: `cbba_python_service/encryption_service.py`

**Authentication:**
- JWT tokens with 12-hour expiration
- Secure password hashing (ASP.NET Core Identity)
- Email verification required
- Optional 2FA (TOTP)

**Session Management:**
- 30-minute inactivity timeout
- Real-time risk monitoring (5-second intervals)
- Automatic lock at 80%+ sustained risk
- Step-up auth for moderate risk (40-79%)

### Configuration Files

| File | Purpose |
|------|---------|
| `backend/appsettings.json` | Database, SMTP, JWT, ReCaptcha settings |
| `frontend/.env.production` | Production API URL, ReCaptcha key |
| `cbba_python_service/.env` | Python service configuration |
| `cbba_python_service/config.py` | ML model parameters |

### Database Schema

**Key Tables:**
- `Users` - User accounts and roles
- `BiometricProfiles` - Encrypted ML models
- `EmailVerificationTokens` - Email verification
- `PasswordResetTokens` - Password reset flow
- `AuditLogs` - Activity logging
- `SecurityLogs` - Security events
- `KeyStrokes` - Raw keystroke data
- `MouseMovements` - Raw mouse data
- `RiskScores` - Historical risk assessments

```javascript
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
```

Change to desired timeout duration.

---

## Security Configuration

### Backend Configuration (ASP.NET Core)

#### Option 1: User Secrets (Recommended for Development)

```bash
# Navigate to backend directory
cd backend

# Initialize user secrets
dotnet user-secrets init

# Set your reCAPTCHA secret key
dotnet user-secrets set "ReCaptcha:SecretKey" "YOUR_ACTUAL_SECRET_KEY"

# Set your JWT key
dotnet user-secrets set "Jwt:Key" "YourVerySecretKeyForJWTAuth"

# Set SMTP password
dotnet user-secrets set "SMTP:Password" "YOUR_GMAIL_APP_PASSWORD"
```

#### Option 2: Environment Variables

Set the following environment variables:
- `ReCaptcha__SecretKey`: Your Google reCAPTCHA secret key
- `Jwt__Key`: Your JWT signing key (32+ characters)
- `SMTP__Password`: Your email service app password

#### Option 3: Production Configuration

For production, use:
- Azure Key Vault
- AWS Secrets Manager
- Environment variables in your hosting platform

### Frontend Configuration (React)

The `.env` file contains the reCAPTCHA site key:

```properties
REACT_APP_RECAPTCHA_SITE_KEY=6LfogeErAAAAAPl-jd4Opxslssej0QCL87ZWtYov
```

### Getting reCAPTCHA Keys

1. Go to [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Create a new site
3. Choose reCAPTCHA v2 "I'm not a robot" checkbox
---


## Troubleshooting

### Common Issues

**1. Email Verification Not Received**
- Check spam/junk folder
- Verify SMTP settings in `backend/appsettings.json`
- Gmail may block Azure IPs - use Gmail App Password
- Manually verify: Run SQL query `UPDATE Users SET IsEmailVerified = 1 WHERE Username = 'youruser'`

**2. CORS Errors in Production**
- Verify `AppSettings__FrontendUrl` in Azure App Service settings
- Check CORS origins in Azure: `az webapp cors show`
- Ensure `supportCredentials: true` is set

**3. Keystroke Anomalies Not Detecting**
- User must be trained first (300+ samples)
- Verify Python ML service is running: `curl http://localhost:5001/health`
- Check browser console for CBBA logs
- Type 2x faster than normal with many backspaces to trigger

**4. Session Lock Not Triggering**
- Risk must be sustained at 80%+ for 3+ consecutive assessments
- Check CBBA widget for current risk level
- View console logs for detailed risk breakdown

**5. Database Migration Errors**
- Delete database and recreate: `az sql db delete` → `az sql db create`
- Run migrations: `dotnet ef database update`
- Verify connection string matches Azure SQL database

**6. Python Service Connection Failed**
- Check backend `appsettings.json` has correct Python URL
- For Azure: `http://20.247.240.136:5001`
- For local: `http://localhost:5001`
- Verify container is running: `az container show --name cbba-ml-service-tank108`

---

## Project Structure

```
CISP_Behavioural_Biometric/
│
├── backend/                          # ASP.NET Core 8 Backend
│   ├── Controllers/                  # API endpoints
│   │   ├── AuthController.cs        # Login, register, email verification
│   │   └── BiometricController.cs   # CBBA training & assessment
│   ├── Models/                       # Data models
│   ├── Services/                     # Business logic
│   │   ├── EmailService.cs          # SMTP email sending
│   │   └── PythonCBBAService.cs     # Python ML service client
│   ├── Migrations/                   # EF Core database migrations
│   ├── appsettings.json             # Configuration
│   └── Startup.cs                    # App configuration, CORS
│
├── frontend/                         # React 18 Frontend
│   ├── src/
│   │   ├── pages/                    # Page components
│   │   │   ├── LoginPage.js
│   │   │   ├── RegistrationPage.js
│   │   │   └── DashboardPage.js
│   │   ├── components/
│   │   │   ├── CBBAMonitor.js       # Real-time risk widget
│   │   │   └── security/
│   │   │       ├── SessionLock.js   # Session lock modal
│   │   │       └── StepUpAuth.js    # Password re-verification
│   │   ├── hooks/
│   │   │   └── useCBBA.js           # CBBA integration hook
│   │   └── utils/
│   │       └── config.js             # API configuration
│   ├── .env.production              # Production environment vars
│   └── package.json
│
├── cbba_python_service/             # Python ML Service
│   ├── app.py                        # Flask application
│   ├── cbba_service.py              # Training & assessment logic
│   ├── anomaly_detection.py         # ML models (IF, SVM)
│   ├── keystroke_anomaly_detector.py # 5 pattern detectors
│   ├── feature_extraction.py        # Feature engineering
│   ├── encryption_service.py        # AES-256-GCM encryption
│   ├── generate_training_data.py    # Training data generator
│   ├── requirements.txt             # Python dependencies
│   ├── Dockerfile                    # Docker configuration
│   └── models/                       # Encrypted ML models
│
├── Documentation/                    # Technical documentation
│   ├── DEPLOYMENT_UPDATE_GUIDE.md
│   ├── KEYSTROKE_ANOMALY_SUMMARY.md
│   ├── CBBA_TRAINING_QUICK_START.md
│   └── AZURE_DEPLOYMENT.md
│
└── README.md                         # This file
```

# Install dependencies one by one to identify problematic package
pip install scikit-learn
pip install pandas
pip install numpy
# ... continue for each package
```

### CORS Errors in Browser Console

**Error:** `Access to fetch at 'http://localhost:5000' has been blocked by CORS policy`

**Solution:**

1. Ensure backend is running on port 5000
2. Check `backend/Startup.cs` has CORS configuration
3. Restart backend server

### Training Fails with "Insufficient Data"

**Error:** Backend logs show "Need at least 20 samples, got 4"

**Solution:**

Verify configuration alignment:

1. **Backend:** `BiometricController.cs` creates 4 sessions
2. **Python:** `config.py` has `MIN_TRAINING_SAMPLES = 4`
3. **Python:** `anomaly_detection.py` uses `Config.MIN_TRAINING_SAMPLES`

All values should be consistent (4 for testing, 10-20 for production).

### Email Not Sending (TOTP/Verification)

**Error:** Backend logs show SMTP connection failed

**Solutions:**

1. For Gmail: Use [App Password](https://support.google.com/accounts/answer/185833)
2. Enable "Less secure app access" (not recommended) or use OAuth2
3. Check firewall isn't blocking port 587
4. Verify SMTP settings in `appsettings.json`


## License & Credits

**Project:** Final Year Project - CISP, Coventry University  
**Period:** August 2025 - October 2025  
**Author:** kuniken99  
**Repository:** https://github.com/kuniken99/CISP_Behavioural_Biometric

---

## Support

For issues or questions:
1. Review troubleshooting section above
2. Contact: tank108@uni.coventry.ac.uk

---

**End of README**

## Security Best Practices

- ✅ **DO**: Use user secrets for development
- ✅ **DO**: Use environment variables or key vaults for production
- ✅ **DO**: Add sensitive files to .gitignore
- ✅ **DO**: Use strong, randomly generated keys for JWT signing
- ✅ **DO**: Rotate encryption keys regularly
- ❌ **DON'T**: Commit secrets to version control
- ❌ **DON'T**: Use test keys in production
- ❌ **DON'T**: Share secret keys in chat/email
- ❌ **DON'T**: Store passwords in plain text

---

## License

This project is part of the CISP (Certified Information Security Professional) coursework and is intended for educational purposes.

---

## Contributors

- **Project Developer:** Kennedy Tan (kuniken99)
- **Project Name:** CISP Continuous Behavioral Biometric Authentication (CBBA) Project
- **Date:** October 2025

---

**For questions or issues, refer to the technical documentation or create an issue in the repository.**
