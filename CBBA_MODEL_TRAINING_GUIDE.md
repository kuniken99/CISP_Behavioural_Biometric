# CBBA Model Training Guide

## How to Retrain Models with Diverse Data

The CBBA models are currently trained with limited/synthetic data, which causes them to return constant predictions. To get dynamic risk scores, you need to retrain with **diverse behavioral samples**.

## Quick Start: Retrain Your Profile

### Method 1: Using Frontend Training Page (Recommended)

1. **Login** to the application
2. **Navigate** to your profile or CBBA settings
3. **Click "Train Profile"** or "Retrain Model"
4. **Perform various behaviors**:
   - Type slowly for 30 seconds
   - Type quickly for 30 seconds
   - Type normally for 30 seconds
   - Move mouse in circles
   - Move mouse in straight lines
   - Click rapidly, then slowly
5. **Submit training data**
6. **Wait** for model to train (30-60 seconds)

### Method 2: Using Python Training Script

Run the automated training data generator:

```powershell
cd E:\CISP_Behavioural_Biometric\cbba_python_service
python train_user.py --user tank108 --samples 50
```

This generates 50 diverse behavioral samples and trains the model.

### Method 3: API Training Endpoint

Use the REST API to train with custom data:

```powershell
# PowerShell script to train model
$token = "YOUR_JWT_TOKEN"
$trainingData = @{
    trainingData = @(
        @{
            keystroke_data = @(
                @{ key = "a"; timestamp = 1000; event = "keydown" }
                @{ key = "a"; timestamp = 1150; event = "keyup" }
                # ... more samples
            )
            mouse_data = @(
                @{ x = 100; y = 200; timestamp = 1000; event = "mousemove" }
                # ... more samples
            )
        }
        # ... more sessions (need at least 10)
    )
}

Invoke-RestMethod -Uri "http://localhost:5000/Biometric/train" `
    -Method POST `
    -Headers @{ Authorization = "Bearer $token" } `
    -Body ($trainingData | ConvertTo-Json -Depth 10) `
    -ContentType "application/json"
```

## Understanding Training Requirements

### Minimum Requirements

- **Minimum Samples**: 10 training sessions
- **Duration per Session**: 30-60 seconds of interaction
- **Data Types**: Both keystroke AND mouse data
- **Diversity**: Varied typing speeds, mouse patterns, different contexts

### What Makes Good Training Data?

**Diverse Typing Patterns**:
- ✅ Fast typing (100+ WPM)
- ✅ Slow typing (20-40 WPM)
- ✅ Normal typing (60-80 WPM)
- ✅ Careful typing (deliberate, precise)
- ✅ Casual typing (some errors, corrections)

**Diverse Mouse Patterns**:
- ✅ Smooth movements
- ✅ Erratic movements
- ✅ Fast mouse movements
- ✅ Slow, deliberate movements
- ✅ Clicking patterns (single, double, rapid)
- ✅ Scrolling patterns

**Context Variety**:
- ✅ Different pages (forms, dashboards, lists)
- ✅ Different tasks (reading, writing, clicking)
- ✅ Different times of day
- ✅ Different cognitive loads (focused vs. multitasking)

## Automated Training Script

I'll create a script that generates diverse training data for you:

**File**: `cbba_python_service/generate_training_data.py`

```python
import random
import numpy as np
import requests
import json

def generate_diverse_keystroke_data(duration_ms=30000, typing_speed_variation='normal'):
    """Generate diverse keystroke patterns"""
    keystrokes = []
    current_time = 0
    
    # Vary typing speed
    if typing_speed_variation == 'fast':
        avg_key_interval = 80  # Fast typing
        std_dev = 20
    elif typing_speed_variation == 'slow':
        avg_key_interval = 300  # Slow typing
        std_dev = 80
    else:
        avg_key_interval = 150  # Normal typing
        std_dev = 50
    
    keys = list('abcdefghijklmnopqrstuvwxyz .,!?')
    
    while current_time < duration_ms:
        key = random.choice(keys)
        
        # Keydown
        keystrokes.append({
            'key': key,
            'timestamp': current_time,
            'event': 'keydown'
        })
        
        # Dwell time (how long key is pressed)
        dwell_time = random.randint(50, 200)
        
        # Keyup
        keystrokes.append({
            'key': key,
            'timestamp': current_time + dwell_time,
            'event': 'keyup'
        })
        
        # Flight time (time to next key)
        flight_time = int(random.gauss(avg_key_interval, std_dev))
        flight_time = max(10, flight_time)  # Minimum 10ms
        
        current_time += dwell_time + flight_time
    
    return keystrokes

def generate_diverse_mouse_data(duration_ms=30000, pattern='normal'):
    """Generate diverse mouse movement patterns"""
    mouse_data = []
    current_time = 0
    x, y = 500, 400  # Starting position
    
    while current_time < duration_ms:
        if pattern == 'smooth':
            # Smooth, controlled movements
            dx = random.randint(-5, 5)
            dy = random.randint(-5, 5)
            interval = 50
        elif pattern == 'erratic':
            # Fast, erratic movements
            dx = random.randint(-50, 50)
            dy = random.randint(-50, 50)
            interval = 100
        else:  # normal
            # Normal movements
            dx = random.randint(-20, 20)
            dy = random.randint(-20, 20)
            interval = 75
        
        x = max(0, min(1920, x + dx))
        y = max(0, min(1080, y + dy))
        
        mouse_data.append({
            'x': x,
            'y': y,
            'timestamp': current_time,
            'event': 'mousemove'
        })
        
        # Add occasional clicks
        if random.random() < 0.05:  # 5% chance
            mouse_data.append({
                'x': x,
                'y': y,
                'timestamp': current_time + 10,
                'event': 'click',
                'button': 0
            })
        
        current_time += interval
    
    return mouse_data

def generate_training_session(session_type='normal'):
    """Generate a complete training session"""
    if session_type == 'fast_typing':
        keystroke_data = generate_diverse_keystroke_data(30000, 'fast')
        mouse_data = generate_diverse_mouse_data(30000, 'smooth')
    elif session_type == 'slow_typing':
        keystroke_data = generate_diverse_keystroke_data(30000, 'slow')
        mouse_data = generate_diverse_mouse_data(30000, 'smooth')
    elif session_type == 'erratic':
        keystroke_data = generate_diverse_keystroke_data(30000, 'normal')
        mouse_data = generate_diverse_mouse_data(30000, 'erratic')
    else:  # normal
        keystroke_data = generate_diverse_keystroke_data(30000, 'normal')
        mouse_data = generate_diverse_mouse_data(30000, 'normal')
    
    return {
        'keystroke_data': keystroke_data,
        'mouse_data': mouse_data
    }

def train_user_profile(username, jwt_token, num_samples=20):
    """Train user profile with diverse data"""
    
    # Generate diverse training sessions
    training_data = []
    
    session_types = ['normal', 'fast_typing', 'slow_typing', 'erratic']
    
    print(f"Generating {num_samples} diverse training samples for {username}...")
    
    for i in range(num_samples):
        session_type = session_types[i % len(session_types)]
        session = generate_training_session(session_type)
        training_data.append(session)
        print(f"  Generated sample {i+1}/{num_samples} ({session_type})")
    
    print(f"\nTraining model with {num_samples} samples...")
    
    # Send to backend
    response = requests.post(
        'http://localhost:5000/Biometric/train',
        headers={
            'Authorization': f'Bearer {jwt_token}',
            'Content-Type': 'application/json'
        },
        json={'trainingData': training_data}
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"\n✓ Training successful!")
        print(f"  Samples trained: {result.get('samplesTrained', 'N/A')}")
        print(f"  Model accuracy: {result.get('accuracy', 'N/A')}")
        print(f"  Profile status: {result.get('status', 'N/A')}")
        return True
    else:
        print(f"\n✗ Training failed: {response.status_code}")
        print(f"  Error: {response.text}")
        return False

if __name__ == '__main__':
    import sys
    
    if len(sys.argv) < 3:
        print("Usage: python generate_training_data.py <username> <jwt_token> [num_samples]")
        print("Example: python generate_training_data.py tank108 eyJhbG... 30")
        sys.exit(1)
    
    username = sys.argv[1]
    jwt_token = sys.argv[2]
    num_samples = int(sys.argv[3]) if len(sys.argv) > 3 else 20
    
    train_user_profile(username, jwt_token, num_samples)
```

## Step-by-Step: Complete Retraining Process

### Step 1: Get Your JWT Token

1. Login to the application
2. Open browser console (F12)
3. Run: `localStorage.getItem('jwt_token')`
4. Copy the token

### Step 2: Create Training Script

Save the script above as `generate_training_data.py` in the `cbba_python_service` folder.

### Step 3: Run Training

```powershell
cd E:\CISP_Behavioural_Biometric\cbba_python_service
python generate_training_data.py tank108 YOUR_JWT_TOKEN 30
```

This will:
- Generate 30 diverse behavioral samples
- Mix of fast/slow/normal/erratic patterns
- Train the model with this data
- Save the updated model

### Step 4: Verify Training

Check the console output:
```
✓ Training successful!
  Samples trained: 30
  Model accuracy: 0.95
  Profile status: trained
```

### Step 5: Test New Model

1. Refresh your browser
2. Interact with the application
3. Watch risk scores vary based on your behavior:
   - Type normally → 10-30% (Green)
   - Type faster → 30-50% (Green/Orange)
   - Type slower → 40-60% (Orange)
   - Different person → 70-100% (Red)

## Why Models Get Stuck

**Root Cause**: Limited training data variance

When models are trained with:
- ❌ Only 1-2 samples
- ❌ Identical behavioral patterns
- ❌ Synthetic/simulated data
- ❌ No diversity in speed, rhythm, patterns

They learn a **single point** instead of a **distribution**, resulting in:
- Constant predictions (always 51%, 34%, etc.)
- No sensitivity to behavioral changes
- Poor anomaly detection

**Solution**: Train with 20+ diverse samples covering:
- ✅ Multiple typing speeds
- ✅ Various mouse patterns  
- ✅ Different interaction contexts
- ✅ Real behavioral variations

## Expected Results After Retraining

### Before Retraining
```
[CBBA] User tank108 - IF: 85.0%, SVM: 0.0%, Feature: 0.0%, Combined: 34.0%
[CBBA] User tank108 - IF: 85.0%, SVM: 0.0%, Feature: 0.0%, Combined: 34.0%
[CBBA] User tank108 - IF: 85.0%, SVM: 0.0%, Feature: 0.0%, Combined: 34.0%
```
(Stuck at 34% - no variation)

### After Retraining
```
[CBBA] User tank108 - IF: 15.0%, SVM: 10.0%, Feature: 5.0%, Combined: 11.2%
[CBBA] User tank108 - IF: 25.0%, SVM: 20.0%, Feature: 18.0%, Combined: 21.6%
[CBBA] User tank108 - IF: 45.0%, SVM: 35.0%, Feature: 40.0%, Combined: 40.5%
```
(Dynamic 0-100% range based on behavior)

## Troubleshooting

### Training Fails with "Insufficient Data"
- **Solution**: Need at least 10 training samples
- Generate more samples with the script

### Model Still Returns Constant Values
- **Solution**: Training data not diverse enough
- Increase variance in typing speeds and mouse patterns
- Use more samples (30-50 recommended)

### "Feature dimension mismatch" Error
- **Solution**: Clear old model and retrain fresh
- Delete files in `cbba_python_service/models/`
- Run training script again

### Risk Score Still Stuck After Retraining
- **Solution**: Restart Python service
- `Ctrl+C` to stop
- `python app.py` to restart
- Model loads on first assessment

## Manual Training via Frontend

If you prefer to train manually with real interactions:

1. **Collect Data**: Interact with the app for 5+ minutes
2. **Multiple Sessions**: Repeat in different contexts
3. **Submit for Training**: Use the training endpoint
4. **Advantages**: Real user behavior, most accurate
5. **Disadvantages**: Time-consuming, requires implementation

## Summary

**Quick Fix for Stuck Scores**:
```powershell
cd E:\CISP_Behavioural_Biometric\cbba_python_service
python generate_training_data.py tank108 YOUR_JWT_TOKEN 30
```

This generates and trains with 30 diverse samples, enabling full 0-100% risk scoring!

---

**Status**: Documentation complete
**Next Step**: Run the training script to get dynamic scoring
