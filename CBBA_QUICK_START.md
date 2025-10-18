# CBBA System - Quick Start Guide

## What's Been Implemented

I've created a complete **Continuous Behavioral Biometric Authentication (CBBA)** system with the following components:

### 1. Python ML Service (`cbba_python_service/`)

**Files Created:**
- `app.py` - Flask REST API server
- `cbba_service.py` - Main CBBA orchestrator
- `anomaly_detection.py` - Isolation Forest & One-Class SVM models
- `feature_extraction.py` - Keystroke & mouse dynamics feature extraction
- `encryption_service.py` - AES-256 encryption for biometric profiles
- `config.py` - Configuration management
- `requirements.txt` - Python dependencies
- `README.md` - Service documentation

**Features:**
- ✅ Keystroke dynamics (dwell time, flight time, typing speed)
- ✅ Mouse dynamics (velocity, acceleration, curvature, clicks, scrolling)
- ✅ Isolation Forest anomaly detection
- ✅ One-Class SVM anomaly detection
- ✅ Real-time risk scoring (0-100%)
- ✅ AES-256 profile encryption
- ✅ Model persistence and online learning

### 2. Backend Integration

**Files Updated:**
- `Services/PythonCBBAService.cs` - HTTP client for Python service with training, assessment, and status endpoints
- `Controllers/BiometricController.cs` - Added endpoints: `/train`, `/assess`, `/status`, `/update-profile`, `/health`
- `Models/BiometricProfiles.cs` - Added fields: `EncryptedProfile`, `IsTrained`, `TrainedAt`, `SampleCount`
- `appsettings.json` - Already configured with Python service URL

**New Endpoints:**
- `POST /api/Biometric/train` - Train user profile
- `POST /api/Biometric/assess` - Real-time risk assessment
- `GET /api/Biometric/status` - Get profile status
- `POST /api/Biometric/update-profile` - Update with legitimate data
- `GET /api/Biometric/health` - Check Python service health

### 3. Frontend Components

**Files Created:**
- `hooks/useCBBA.js` - Custom hook for behavioral data collection and risk assessment
- `components/security/StepUpAuth.js` - Step-up authentication dialog (50-95% risk)
- `components/security/SessionLock.js` - Automatic session lock (>95% risk)
- `styles/StepUpAuth.css` - Step-up authentication styles
- `styles/SessionLock.css` - Session lock styles

**Files Updated:**
- `components/CBBAMonitor.js` - Now connects to real risk scores with dynamic colors

**Features:**
- ✅ Keystroke event capture (keydown/keyup)
- ✅ Mouse event capture (move, click, scroll)
- ✅ Automatic risk assessment every 30 seconds
- ✅ Step-up authentication dialog for moderate risk
- ✅ Automatic session lock for critical risk
- ✅ Real-time risk score display

### 4. Documentation

**Files Created:**
- `CBBA_IMPLEMENTATION_GUIDE.md` - Complete implementation guide
- `cbba_python_service/README.md` - Python service documentation

## Installation & Setup

### Step 1: Python Service

```powershell
# Navigate to Python service directory
cd cbba_python_service

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Generate encryption key
python -c "import os; print('ENCRYPTION_KEY=' + os.urandom(32).hex())"

# Copy the generated key and update .env file
# Edit .env and replace the ENCRYPTION_KEY value

# Create models directory
New-Item -ItemType Directory -Force -Path models

# Start Python service
python app.py
```

Service will run on `http://127.0.0.1:5000`

### Step 2: Backend Migration

```powershell
# Navigate to backend directory
cd ..\backend

# Add migration for new BiometricProfile fields
dotnet ef migrations add AddCBBAFields

# Update database
dotnet ef database update

# Run backend
dotnet run
```

Backend will run on `https://localhost:7240`

### Step 3: Frontend

```powershell
# Navigate to frontend directory
cd ..\frontend

# Install dependencies (if needed)
npm install uuid  # For session ID generation

# Start frontend
npm start
```

Frontend will run on `http://localhost:3000`

## Testing the System

### 1. Check Python Service Health

Open browser: `http://localhost:5000/health`

Should return: `{"status": "healthy", "service": "CBBA Python Service", "version": "1.0.0"}`

### 2. Check Backend Health

Open browser (with auth): `https://localhost:7240/api/Biometric/health`

### 3. Training Phase

**Requirements:**
- User needs minimum 50 behavioral samples
- Approximately 5-10 minutes of normal usage
- Both keystroke and mouse data

**How it works:**
1. User logs in and uses the application normally
2. Frontend collects keystroke and mouse events
3. Data is periodically sent to backend
4. After sufficient data, training is triggered
5. Profile is encrypted and stored in database

### 4. Testing Anomaly Detection

**Normal Behavior (Low Risk 0-30%):**
- Use your normal typing speed
- Move mouse naturally
- Risk score should stay low, green indicator

**Simulate Anomalies (High Risk 70-95%):**
- Type much faster or slower than normal
- Make erratic mouse movements
- Use different clicking patterns
- System should show Step-Up Authentication dialog

**Simulate Critical Anomalies (>95%):**
- Extreme deviations from normal behavior
- Very fast random typing
- Chaotic mouse movements
- System should automatically lock session

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend (React)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   useCBBA    │  │  StepUpAuth  │  │ SessionLock  │  │
│  │  (Hook)      │  │  (Dialog)    │  │  (Screen)    │  │
│  └──────┬───────┘  └──────────────┘  └──────────────┘  │
│         │                                                │
│         │ Keystroke & Mouse Events                      │
│         ▼                                                │
│  ┌──────────────────────────────────────────────┐      │
│  │        CBBAMonitor (Risk Display)            │      │
│  └──────────────────────────────────────────────┘      │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTP/REST
                      ▼
┌─────────────────────────────────────────────────────────┐
│              Backend (ASP.NET Core)                      │
│  ┌──────────────────┐  ┌─────────────────────────────┐ │
│  │ BiometricController│◄─┤ PythonCBBAService        │ │
│  └──────────────────┘  └────────┬────────────────────┘ │
│                                  │                       │
│  ┌──────────────────────────────┼──────────────────┐   │
│  │     AppDbContext              │                  │   │
│  │  ┌─────────────────────┐     │                  │   │
│  │  │ BiometricProfiles   │     │                  │   │
│  │  │ (Encrypted Storage) │     │                  │   │
│  │  └─────────────────────┘     │                  │   │
│  └──────────────────────────────┼──────────────────┘   │
└───────────────────────────────────┼──────────────────────┘
                                    │ HTTP/REST
                                    ▼
┌─────────────────────────────────────────────────────────┐
│           Python ML Service (Flask)                      │
│  ┌──────────────────┐  ┌─────────────────────────────┐ │
│  │  CBBAService     │  │  FeatureExtractor          │ │
│  │  (Orchestrator)  │◄─┤  - Keystroke Features      │ │
│  └────────┬─────────┘  │  - Mouse Features          │ │
│           │             └─────────────────────────────┘ │
│           ▼                                              │
│  ┌──────────────────────────────────────────────┐      │
│  │     AnomalyDetector                          │      │
│  │  ┌──────────────┐  ┌──────────────────────┐ │      │
│  │  │ Isolation    │  │  One-Class SVM       │ │      │
│  │  │ Forest       │  │                      │ │      │
│  │  └──────────────┘  └──────────────────────┘ │      │
│  └──────────────────────────────────────────────┘      │
│                                                          │
│  ┌──────────────────────────────────────────────┐      │
│  │     BiometricEncryptionService               │      │
│  │     (AES-256 Encryption)                     │      │
│  └──────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────┘
```

## Risk Score Flow

```
User Behavior
    │
    ├─► Keystroke Events → Feature Extraction (7 features)
    │                           │
    └─► Mouse Events    → Feature Extraction (10 features)
                               │
                               ▼
                      Combined Feature Vector (17 features)
                               │
                               ▼
                      ┌────────────────────┐
                      │  Isolation Forest  │
                      │  Anomaly Score     │
                      └─────────┬──────────┘
                               │
                      ┌────────────────────┐
                      │  One-Class SVM     │
                      │  Anomaly Score     │
                      └─────────┬──────────┘
                               │
                               ▼
                      Weighted Combination
                               │
                               ▼
                      Risk Score (0-100%)
                               │
            ┌──────────────────┼──────────────────┐
            │                  │                  │
         0-30%              50-70%             >95%
        (Normal)          (Moderate)         (Critical)
            │                  │                  │
      No Action      Step-Up Auth Required  Auto Lock Session
```

## Next Steps

1. **Start All Services**: Follow installation steps above
2. **Test Health Checks**: Verify all services are running
3. **Create Test User**: Register and login
4. **Training Phase**: Use application normally for 5-10 minutes
5. **Test Anomalies**: Try different behavior patterns
6. **Monitor Risk Scores**: Watch CBBAMonitor component
7. **Test Step-Up Auth**: Trigger moderate risk (50-70%)
8. **Test Session Lock**: Trigger critical risk (>95%)

## Configuration

### Adjust Risk Thresholds

Edit `cbba_python_service/config.py`:

```python
RISK_THRESHOLD_MODERATE = 50  # Step-up authentication trigger
RISK_THRESHOLD_HIGH = 95      # Session lock trigger
```

### Adjust Model Parameters

Edit `cbba_python_service/config.py`:

```python
ISOLATION_FOREST_CONTAMINATION = 0.1  # Expected anomaly rate
MIN_TRAINING_SAMPLES = 50              # Minimum for training
```

### Adjust Assessment Frequency

Edit `frontend/src/hooks/useCBBA.js`:

```javascript
assessmentInterval.current = setInterval(assessRisk, 30000); // 30 seconds
```

## Troubleshooting

### Python Service Errors

**Import Errors:**
```powershell
# Make sure virtual environment is activated
.\venv\Scripts\Activate.ps1

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

**Port Already in Use:**
Edit `cbba_python_service/.env` and change `FLASK_PORT=5000` to another port

### Backend Errors

**Python Service Connection Failed:**
- Verify Python service is running
- Check `appsettings.json` has correct URL
- Test health endpoint: `http://localhost:5000/health`

**Database Errors:**
```powershell
# Reset migrations if needed
dotnet ef database drop
dotnet ef database update
```

### Frontend Errors

**Missing Dependencies:**
```powershell
npm install uuid
npm install
```

**CORS Errors:**
- Python service already has CORS enabled
- Backend should allow frontend origin

## Support Files

- `CBBA_IMPLEMENTATION_GUIDE.md` - Detailed implementation guide
- `cbba_python_service/README.md` - Python service documentation
- Python service logs - Check console output
- Backend logs - Check Visual Studio output
- Browser console - Check for JavaScript errors

## Security Notes

1. **Encryption Keys**: Generate unique keys for production
2. **HTTPS**: Use HTTPS in production for all services
3. **Data Privacy**: Behavioral data should be anonymized
4. **Consent**: Inform users about biometric monitoring
5. **Audit Trail**: All high-risk events are logged

## Performance

- **Data Collection**: Throttled to prevent performance impact
- **Assessment**: Every 30 seconds (configurable)
- **Training**: Performed once, then incremental updates
- **Model Size**: ~1-2 KB per user (encrypted)
- **Memory**: Models cached in memory for active users

Your CBBA system is now ready to use! 🎉
