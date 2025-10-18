# CBBA Implementation Guide

## Overview

Continuous Behavioral Biometric Authentication (CBBA) provides real-time user authentication based on typing and mouse behavior patterns. This implementation uses machine learning to detect anomalies and calculate risk scores.

## Architecture

### Components

1. **Python Service** (`cbba_python_service/`)
   - Flask REST API for ML operations
   - Scikit-learn models (Isolation Forest, One-Class SVM)
   - Feature extraction from behavioral data
   - AES-256 encryption for biometric profiles

2. **Backend Integration** (ASP.NET Core)
   - `PythonCBBAService.cs`: HTTP client for Python service
   - `BiometricController.cs`: REST endpoints for frontend
   - `BiometricProfile` model: Encrypted profile storage

3. **Frontend Tracking** (React)
   - `useCBBA.js`: Custom hook for behavioral data collection
   - `StepUpAuth.js`: Step-up authentication dialog
   - `SessionLock.js`: Automatic session lock screen
   - `CBBAMonitor.js`: Real-time risk score display

## Setup Instructions

### 1. Python Service Setup

```bash
cd cbba_python_service

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Generate encryption key
python -c "import os; print(os.urandom(32).hex())"

# Update .env with generated key
# ENCRYPTION_KEY=your-32-byte-hex-key-here

# Run service
python app.py
```

Python service runs on `http://127.0.0.1:5000`

### 2. Backend Configuration

The backend is already configured in `appsettings.json`:

```json
{
  "PythonCBBAService": {
    "Url": "http://localhost:5000"
  }
}
```

### 3. Database Migration

Add migration for new BiometricProfile fields:

```bash
cd backend
dotnet ef migrations add AddCBBAProfileFields
dotnet ef database update
```

### 4. Frontend Integration

Update your main `App.js` to use CBBA:

```javascript
import useCBBA from './hooks/useCBBA';
import StepUpAuth from './components/security/StepUpAuth';
import SessionLock from './components/security/SessionLock';
import CBBAMonitor from './components/CBBAMonitor';

function App() {
  const { isAuthenticated, user, logout } = useAuth();
  const [showStepUp, setShowStepUp] = useState(false);
  const [showSessionLock, setShowSessionLock] = useState(false);

  const handleRiskDetected = (action, riskScore) => {
    if (action === 'challenge') {
      setShowStepUp(true);
    } else if (action === 'lock') {
      setShowSessionLock(true);
    }
  };

  const {
    riskScore,
    riskLevel,
    cbbaStatus,
    isTrained,
  } = useCBBA(isAuthenticated, user, handleRiskDetected);

  return (
    <div>
      {/* Your app content */}
      
      {/* CBBA Monitor */}
      {isAuthenticated && (
        <CBBAMonitor
          riskScore={riskScore}
          riskLevel={riskLevel}
          status={cbbaStatus}
          isAuthenticated={isAuthenticated}
        />
      )}

      {/* Step-Up Authentication */}
      <StepUpAuth
        show={showStepUp}
        riskScore={riskScore}
        onVerify={() => setShowStepUp(false)}
        onCancel={() => { setShowStepUp(false); logout(); }}
      />

      {/* Session Lock */}
      <SessionLock
        show={showSessionLock}
        riskScore={riskScore}
        onReAuthenticate={() => { setShowSessionLock(false); logout(); }}
      />
    </div>
  );
}
```

## Training Phase

### Initial Training

Users need baseline behavioral data before CBBA can detect anomalies:

1. **Minimum Requirements**: 50 behavioral samples
2. **Collection Period**: 5-10 minutes of normal usage
3. **Data Types**: Keystroke dynamics + Mouse dynamics

### Training Implementation

```javascript
// Collect training data
const trainingData = [];

// Collect 50-100 samples during normal usage
for (let i = 0; i < 50; i++) {
  const sample = collectTrainingData();
  trainingData.push(sample);
}

// Train profile
const result = await trainProfile(trainingData);

if (result.success) {
  console.log('Profile trained successfully!');
  console.log('Samples trained:', result.samplesTrained);
}
```

## Risk Score Thresholds

| Risk Score | Level | Action | Description |
|------------|-------|--------|-------------|
| 0-30% | Low | None | Normal behavior |
| 30-50% | Low-Moderate | Monitor | Minor deviation, monitor closely |
| 50-70% | Moderate | Challenge | Step-up authentication required |
| 70-95% | High | Challenge | Strong step-up authentication |
| 95-100% | Critical | Lock | Immediate session lock |

## API Endpoints

### Python Service

#### Train Profile
```
POST /api/cbba/train
Body: {
  "user_id": 123,
  "training_data": [
    {
      "keystroke_data": [...],
      "mouse_data": [...]
    }
  ]
}
```

#### Assess Risk
```
POST /api/cbba/assess
Body: {
  "user_id": 123,
  "keystroke_data": [...],
  "mouse_data": [...]
}
Response: {
  "success": true,
  "risk_score": 15.5,
  "risk_level": "low",
  "action": "none"
}
```

### Backend (.NET)

#### Train Profile
```
POST /api/Biometric/train
Headers: Authorization: Bearer {token}
Body: {
  "trainingData": [...]
}
```

#### Assess Risk
```
POST /api/Biometric/assess
Headers: Authorization: Bearer {token}
Body: {
  "keystrokeData": [...],
  "mouseData": [...]
}
```

#### Get Status
```
GET /api/Biometric/status
Headers: Authorization: Bearer {token}
```

## Behavioral Data Format

### Keystroke Data
```javascript
{
  "key": "a",
  "timestamp": 1705568400000,
  "event": "keydown" | "keyup"
}
```

### Mouse Data
```javascript
{
  "x": 100,
  "y": 200,
  "timestamp": 1705568400000,
  "event": "mousemove" | "click" | "scroll",
  "deltaY": 100,  // for scroll events
  "button": 0     // for click events
}
```

## Features Extracted

### Keystroke Dynamics (7 features)
1. Average dwell time
2. Standard deviation of dwell time
3. Average flight time
4. Standard deviation of flight time
5. Average typing speed
6. Standard deviation of typing speed
7. Key press variance

### Mouse Dynamics (10 features)
1. Average velocity
2. Standard deviation of velocity
3. Average acceleration
4. Standard deviation of acceleration
5. Average curvature
6. Standard deviation of curvature
7. Click rate
8. Double-click rate
9. Scroll speed
10. Path efficiency

## Security Considerations

1. **Encryption**: All biometric profiles are encrypted with AES-256 before storage
2. **Privacy**: Raw behavioral data is not stored, only feature vectors
3. **Consent**: Users should be informed about CBBA monitoring
4. **False Positives**: System allows step-up authentication before locking
5. **Audit Trail**: All high-risk events are logged

## Testing

### 1. Start Python Service
```bash
cd cbba_python_service
python app.py
```

### 2. Start Backend
```bash
cd backend
dotnet run
```

### 3. Start Frontend
```bash
cd frontend
npm start
```

### 4. Test Training
- Log in and use the application normally
- Type and move mouse naturally for 5-10 minutes
- System collects baseline data
- Profile is trained automatically

### 5. Test Anomaly Detection
- Change typing patterns significantly
- Use different mouse behavior
- System should detect anomalies and show warnings

## Troubleshooting

### Python Service Not Connecting
- Check if service is running on port 5000
- Verify `appsettings.json` has correct URL
- Check firewall settings

### Training Fails
- Ensure minimum 50 samples collected
- Check behavioral data format
- Verify Python dependencies installed

### High False Positives
- Adjust contamination parameter in `config.py`
- Collect more training data
- Consider environmental factors (device, stress level)

### Low Detection Accuracy
- Increase training samples
- Verify feature extraction quality
- Check model parameters

## Performance Optimization

1. **Data Collection**: Throttle mouse events (50ms)
2. **Assessment Frequency**: Every 30 seconds
3. **Training Window**: Keep last 200 samples
4. **Model Caching**: User models cached in memory

## Future Enhancements

1. **WebSocket Integration**: Real-time risk score updates
2. **Multi-Device Profiles**: Separate profiles per device
3. **Adaptive Thresholds**: Dynamic risk thresholds per user
4. **Deep Learning**: LSTM models for temporal patterns
5. **Federated Learning**: Privacy-preserving model updates

## Support

For issues or questions:
1. Check logs in Python service console
2. Review backend logs in Visual Studio
3. Check browser console for frontend errors
4. Verify database BiometricProfiles table
