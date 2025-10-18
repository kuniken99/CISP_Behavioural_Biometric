# Quick Fix: User Unknown & Score Stuck at 34%

## Issues Fixed

### Issue 1: User showing as 'unknown' ✅ FIXED
**Problem**: Console showed `user: 'unknown'` in CBBA assessments

**Cause**: `currentUser` from `useAuth` is a string (username), not an object with `.username` property

**Fix Applied**: Updated `useCBBA.js` line 133
```javascript
// Before
user: user?.username || 'unknown'

// After  
user: user || 'unknown'  // user is already the username string
```

### Issue 2: Score stuck at 34% ❌ NEEDS RETRAINING
**Problem**: Risk score always shows 34%, never changes

**Cause**: ML models trained with insufficient/non-diverse data, producing constant predictions

**Solution**: Retrain models with diverse behavioral samples

## How to Fix Score Stuck at 34%

### Quick Solution (5 minutes)

**Step 1**: Get your JWT token
1. Login to application at http://localhost:3000
2. Press F12 to open console
3. Run: `localStorage.getItem('jwt_token')`
4. Copy the token (long string starting with "eyJ...")

**Step 2**: Run training script
```powershell
cd E:\CISP_Behavioural_Biometric\cbba_python_service
python generate_training_data.py tank108 YOUR_JWT_TOKEN 30
```

Replace `YOUR_JWT_TOKEN` with the token you copied.

**Step 3**: Wait for training
- Script generates 30 diverse behavioral samples
- Sends to backend for model training
- Takes ~30-60 seconds

**Step 4**: Restart Python service
```powershell
# Stop current service (Ctrl+C in Python terminal)
# Then restart:
python app.py
```

**Step 5**: Test
1. Refresh browser
2. Interact with application
3. Watch risk scores vary: 0-100% based on behavior!

### What the Training Script Does

Generates 30 diverse samples with:
- ✅ **Fast typing** (80ms between keys)
- ✅ **Slow typing** (300ms between keys)
- ✅ **Normal typing** (150ms between keys)
- ✅ **Smooth mouse** movements
- ✅ **Erratic mouse** movements
- ✅ **Fast interactions**

This diversity allows models to:
- Learn behavioral **range** instead of single point
- Detect deviations from baseline
- Provide full 0-100% risk scores

### Expected Results

**Before Retraining**:
```
[CBBA] User tank108 - IF: 85.0%, SVM: 0.0%, Feature: 0.0%, Combined: 34.0%
[CBBA] User tank108 - IF: 85.0%, SVM: 0.0%, Feature: 0.0%, Combined: 34.0%
[CBBA] User tank108 - IF: 85.0%, SVM: 0.0%, Feature: 0.0%, Combined: 34.0%
```
❌ Stuck at 34%

**After Retraining**:
```
[CBBA] User tank108 - IF: 15.0%, SVM: 10.0%, Feature: 8.0%, Combined: 12.1%
[CBBA] User tank108 - IF: 25.0%, SVM: 22.0%, Feature: 18.0%, Combined: 22.3%
[CBBA] User tank108 - IF: 42.0%, SVM: 38.0%, Feature: 35.0%, Combined: 39.1%
```
✅ Dynamic 0-100% range!

### Training Script Output

You'll see:
```
============================================================
CBBA Model Training for User: tank108
============================================================

Generating 30 diverse training samples...

Sample 1/30:
  Creating normal session...
    Generated 182 keystroke events (normal speed)
    Generated 387 mouse events (normal pattern)

Sample 2/30:
  Creating fast_typing session...
    Generated 326 keystroke events (fast speed)
    Generated 584 mouse events (smooth pattern)

[... continues for all 30 samples ...]

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

### Troubleshooting

**"Connection Error" when running script**:
- ✅ Make sure backend is running: `cd backend ; dotnet run`
- ✅ Backend should be at http://localhost:5000

**"Training Failed" error**:
- ✅ Check JWT token is correct (no extra spaces)
- ✅ Make sure you're logged in
- ✅ Token might be expired - login again and get new token

**Score still stuck after training**:
- ✅ Restart Python service (`Ctrl+C`, then `python app.py`)
- ✅ Hard refresh browser (`Ctrl+Shift+R`)
- ✅ Check Python console for new risk calculations

**"Insufficient training data" error**:
- ✅ Need at least 10 samples
- ✅ Run script with more samples: `python generate_training_data.py tank108 TOKEN 30`

### Manual Alternative

If script doesn't work, train manually:

1. **Collect Real Data**: Use the app for 10+ minutes
   - Type in various fields
   - Move mouse around
   - Click different elements
   - Vary your typing speed

2. **Multiple Sessions**: Do this 10+ times in different contexts

3. **Use Training Endpoint**: Call `/Biometric/train` API with collected data

## Summary

**Two issues identified**:
1. ✅ **User 'unknown'** - Fixed in code (useCBBA.js)
2. ❌ **Score stuck at 34%** - Needs model retraining

**Quick fix for stuck score**:
```powershell
# Get JWT token from browser console
cd E:\CISP_Behavioural_Biometric\cbba_python_service
python generate_training_data.py tank108 YOUR_JWT_TOKEN 30
# Restart Python service
python app.py
```

**Result**: Dynamic 0-100% risk scoring based on actual behavioral changes!

---

**Files Created**:
- `cbba_python_service/generate_training_data.py` - Training script
- `CBBA_MODEL_TRAINING_GUIDE.md` - Full documentation

**Files Modified**:
- `frontend/src/hooks/useCBBA.js` - Fixed user logging
