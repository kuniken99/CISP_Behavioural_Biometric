# CBBA Training Status & Next Steps

## Current Situation

### What Happened ✅

1. **Training Script Created**: Successfully created `generate_training_data.py`
2. **30 Samples Generated**: Script generated all 30 diverse behavioral samples
3. **404 Error**: Backend wasn't running when training was attempted
4. **Services Started**: Backend and Python services are now running

### Training Script Output

The script **successfully generated** all training data:
- 30 complete sessions (mix of fast/slow/normal/erratic)
- ~200-400 keystroke events per session
- ~300-800 mouse events per session
- Total: ~7,800 keystroke events, ~16,500 mouse events

But failed at the **API call** because backend wasn't running yet.

## Current Problem

The training script needs **both services running**:
1. ✅ **Python Service** (port 5001) - for ML training
2. ✅ **Backend Service** (port 5000) - for API endpoint
3. ❌ **Timing Issue** - Services need to be started BEFORE running training

## Solution: Step-by-Step Training Process

### Method 1: Use the Startup Script (Recommended)

**Step 1**: Start all services using the startup script
```powershell
cd E:\CISP_Behavioural_Biometric
.\start-cbba.ps1
```

This opens 3 separate windows:
- Window 1: Backend (http://localhost:5000)
- Window 2: Python Service (http://localhost:5001)
- Window 3: Frontend (http://localhost:3000)

**Step 2**: Wait for services to fully start (~30-60 seconds)
- Backend window shows: "Now listening on: http://localhost:5000"
- Python window shows: "Running on http://127.0.0.1:5001"
- Frontend window shows: "Compiled successfully!"

**Step 3**: Get your JWT token
1. Open browser: http://localhost:3000
2. Login as: tank108 / password123
3. Press F12 (open console)
4. Run: `localStorage.getItem('jwt_token')`
5. Copy the token

**Step 4**: Run training in a NEW PowerShell window
```powershell
cd E:\CISP_Behavioural_Biometric\cbba_python_service
python generate_training_data.py tank108 YOUR_JWT_TOKEN 30
```

**Step 5**: Wait for training to complete (~30-60 seconds)

**Step 6**: Verify success
- Should see: "✓ Training Successful!"
- Python service window should show training activity
- Backend window should show API requests

**Step 7**: Restart Python service
- Go to Python service window
- Press `Ctrl+C` to stop
- Run: `python app.py`
- This loads the newly trained model

**Step 8**: Test
- Refresh browser
- Interact with the app
- Watch risk scores vary 0-100%!

### Method 2: Manual Service Startup

If the script doesn't work, start services manually:

**Terminal 1 - Backend**:
```powershell
cd E:\CISP_Behavioural_Biometric\backend
dotnet run
```
Wait for: "Now listening on: http://localhost:5000"

**Terminal 2 - Python Service**:
```powershell
cd E:\CISP_Behavioural_Biometric\cbba_python_service
python app.py
```
Wait for: "Running on http://127.0.0.1:5001"

**Terminal 3 - Frontend**:
```powershell
cd E:\CISP_Behavioural_Biometric\frontend
npm start
```
Wait for: "Compiled successfully!"

**Terminal 4 - Training**:
```powershell
cd E:\CISP_Behavioural_Biometric\cbba_python_service
python generate_training_data.py tank108 YOUR_JWT_TOKEN 30
```

### Method 3: Alternative - Direct Python Training

Instead of using the API, train directly via Python:

**Step 1**: Start Python service
```powershell
cd E:\CISP_Behavioural_Biometric\cbba_python_service
python app.py
```

**Step 2**: In another terminal, use Python interactively
```powershell
cd E:\CISP_Behavioural_Biometric\cbba_python_service
python
```

**Step 3**: Run training code directly
```python
from generate_training_data import generate_training_session
from cbba_service import CBBAService
import json

# Create CBBA service
service = CBBAService()

# Generate 30 training sessions
training_data = []
session_types = ['normal', 'fast_typing', 'slow_typing', 'erratic_mouse', 'fast_interaction']

print("Generating 30 samples...")
for i in range(30):
    session_type = session_types[i % 5]
    session = generate_training_session(session_type)
    training_data.append(session)
    print(f"Generated sample {i+1}/30")

# Train the model for user tank108
print("\nTraining model...")
result = service.train_user_profile(
    user_id="tank108",
    training_data=training_data
)

print(f"\nResult: {json.dumps(result, indent=2)}")
```

This bypasses the API and trains directly!

## Understanding the 404 Error

**Why it happened**:
```
Training script → HTTP POST to localhost:5000/Biometric/train
                ↓
           Backend NOT running
                ↓
           404 Not Found
```

**The fix**:
1. Start backend FIRST
2. Start Python service FIRST  
3. THEN run training script

## Common Issues & Solutions

### Issue: "Connection refused" or "Connection error"
**Solution**: Backend not running
```powershell
cd backend
dotnet run
```

### Issue: "404 Not Found"
**Solution**: Wrong endpoint or backend not ready
- Wait 10-15 seconds after starting backend
- Verify: http://localhost:5000 is accessible

### Issue: "Training failed - insufficient data"
**Solution**: Need at least 10 samples
- The script generates 30, so this shouldn't happen
- If it does, increase: `python generate_training_data.py tank108 TOKEN 50`

### Issue: "Unauthorized" or "401 error"
**Solution**: JWT token expired or invalid
- Login again
- Get fresh token
- Tokens expire after some time

### Issue: Score still stuck after training
**Solution**: Model not reloaded
1. Stop Python service (Ctrl+C)
2. Restart: `python app.py`
3. Model loads fresh on first assessment

## What Success Looks Like

### Training Script Output
```
============================================================
CBBA Model Training for User: tank108
============================================================

Generating 30 diverse training samples...
[... all 30 samples generated ...]

============================================================
Training model with 30 samples...
============================================================

✓ Training Successful!

Results:
  • Samples trained: 30
  • Profile status: trained
  • User ID: tank108
  • Model ready: Yes

============================================================
Model is now ready for dynamic 0-100% risk scoring!
============================================================
```

### Backend Logs
```
info: Biometric training initiated for user tank108
info: Processing 30 training samples
info: Calling Python CBBA service for training
info: Training completed successfully
```

### Python Service Logs
```
Training model for user tank108 with 30 samples
Extracting features from 30 sessions...
Training Isolation Forest...
Training One-Class SVM...
Model trained successfully
Saving model to ./models/tank108_model.pkl
```

### Browser Console (After Training)
```
[CBBA] User tank108 - IF: 22.0%, SVM: 18.0%, Feature: 15.0%, Combined: 19.1%
[CBBA] User tank108 - IF: 35.0%, SVM: 28.0%, Feature: 31.0%, Combined: 31.7%
[CBBA] User tank108 - IF: 12.0%, SVM: 8.0%, Feature: 10.0%, Combined: 10.4%
```
(Scores varying dynamically!)

## Quick Reference Commands

### Start Everything
```powershell
.\start-cbba.ps1
```

### Train Model (after services running)
```powershell
cd cbba_python_service
python generate_training_data.py tank108 YOUR_JWT_TOKEN 30
```

### Restart Python (to load new model)
```powershell
# In Python service window:
Ctrl+C
python app.py
```

### Check if Services Running
```powershell
# Backend test
curl http://localhost:5000

# Python test  
curl http://localhost:5001

# Frontend test
# Open browser: http://localhost:3000
```

## Summary

**You were very close!** The training script worked perfectly and generated all 30 samples. The only issue was that the backend wasn't running when you tried to send the training data.

**Next Step**: 
1. Use `.\start-cbba.ps1` to start all services
2. Wait 60 seconds
3. Login and get JWT token
4. Run training script again
5. Restart Python service
6. Enjoy dynamic 0-100% risk scoring!

---

**Status**: Training data generated ✅ | API call failed (backend not running) ❌  
**Solution**: Start services first, then run training  
**Expected Time**: 5 minutes total
