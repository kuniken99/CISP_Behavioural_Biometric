# CBBA Python Service

Continuous Behavioral Biometric Authentication (CBBA) service using machine learning for anomaly detection.

## Features

- **Keystroke Dynamics**: Analyzes typing patterns (dwell time, flight time, typing speed)
- **Mouse Dynamics**: Monitors cursor movement (velocity, acceleration, curvature, clicks, scrolling)
- **Anomaly Detection**: Uses Isolation Forest and One-Class SVM for behavioral analysis
- **Risk Scoring**: Real-time risk score (0-100%) indicating likelihood of impostor
- **Encryption**: AES-256 encryption for biometric profiles
- **Online Learning**: Updates user profiles with new legitimate behavioral data

## Installation

1. Create a virtual environment (recommended):
```bash
python -m venv venv
venv\Scripts\activate  # Windows
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment:
- Copy `.env` and update `ENCRYPTION_KEY` with a secure 32-byte hex key
- Generate key: `python -c "import os; print(os.urandom(32).hex())"`

## Running the Service

```bash
python app.py
```

Service runs on `http://127.0.0.1:5001`

## API Endpoints

### Health Check
```
GET /health
```

### Train User Profile
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

### Assess Risk
```
POST /api/cbba/assess
Body: {
  "user_id": 123,
  "keystroke_data": [...],
  "mouse_data": [...]
}
```

### Update Profile
```
POST /api/cbba/update
Body: {
  "user_id": 123,
  "keystroke_data": [...],
  "mouse_data": [...]
}
```

### Get Status
```
GET /api/cbba/status/<user_id>
```

## Training Phase

Users need at least **50 samples** for initial training. The system:
1. Collects baseline behavioral data
2. Extracts features from keystroke and mouse dynamics
3. Trains Isolation Forest and One-Class SVM models
4. Encrypts and stores the biometric profile

## Risk Assessment

Risk scores indicate:
- **0-30%**: Normal behavior (low risk)
- **30-50%**: Minor deviation (low risk, monitor)
- **50-70%**: Moderate deviation (moderate risk, challenge)
- **70-95%**: High deviation (high risk, step-up auth)
- **95-100%**: Critical (immediate session lock)

## Integration with Backend

The C# backend calls this Python service via HTTP for:
- Training new user profiles
- Real-time risk assessment during sessions
- Profile updates with legitimate data
- Encrypted profile storage/retrieval
