# CBBA Real-Time Risk Score Fix

## Issue
Risk scores were stuck at either **0% or 60%** with no gradual changes, making the system feel unrealistic and not truly "real-time".

## Root Causes

### 1. **Binary Score Normalization**
The original normalization functions were too simplistic:
```python
# Old: Simple linear mapping
normalized = (-score + 0.5) * 100  # Always gave same results
```

This caused:
- Very limited score ranges
- Binary outcomes (normal vs anomaly)
- No gradual transitions

### 2. **Long Assessment Intervals**
- Assessment every 30 seconds
- No initial assessment
- Made changes feel sluggish

### 3. **Uniform Training Data**
- All training samples had similar patterns
- ML models couldn't distinguish subtle differences
- Led to binary classifications

## Fixes Applied

### 1. **Improved Score Normalization** ✅

#### Isolation Forest Scoring:
```python
# New: Realistic gradual mapping
score >= 0.3:    →  0-20% risk   (very normal)
score 0.1-0.3:   →  20-40% risk  (normal)
score -0.1-0.1:  →  40-60% risk  (slight deviation)
score -0.3--0.1: →  60-80% risk  (moderate anomaly)
score <= -0.3:   →  80-100% risk (high anomaly)
```

#### One-Class SVM Scoring:
```python
score >= 1.0:    →  0-20% risk   (very normal)
score 0.3-1.0:   →  20-40% risk  (normal)  
score -0.3-0.3:  →  40-60% risk  (slight deviation)
score -1.0--0.3: →  60-80% risk  (moderate anomaly)
score <= -1.0:   →  80-100% risk (high anomaly)
```

### 2. **Faster Real-Time Updates** ✅

**Before**:
- Assessment every 30 seconds
- No initial assessment
- First score after 30 seconds

**After**:
- Assessment every **15 seconds** (2x faster)
- **Initial assessment after 5 seconds** (immediate feedback)
- Continuous monitoring

### 3. **Enhanced Logging** ✅

Added detailed console logging:
```
[CBBA] User tank108 - IF raw: 0.1234, IF risk: 35.2%, SVM raw: 0.5678, SVM risk: 28.4%, Combined: 32.5%
```

This helps debug and understand scoring behavior.

## Files Modified

✅ **cbba_python_service/anomaly_detection.py**
- `_normalize_if_score()` - Complete rewrite with gradual mapping
- `_normalize_svm_score()` - Complete rewrite with gradual mapping
- Added logging to `predict()` method

✅ **frontend/src/hooks/useCBBA.js**
- Changed assessment interval: 30s → 15s
- Added initial assessment after 5 seconds
- Better real-time feel

## Expected Behavior Now

### Real-Time Score Changes

**Scenario 1: Normal Typing**
```
0s:   Login → Initial: 0%
5s:   First assessment → 15-25%
20s:  Normal behavior → 10-20%
35s:  Continued normal → 8-18%
```

**Scenario 2: Faster Typing**
```
0s:   Login → Initial: 0%
5s:   First assessment → 15-25%
20s:  Typing faster → 35-45%
35s:  Much faster → 55-65% (Orange warning)
```

**Scenario 3: Erratic Behavior**
```
0s:   Login → Initial: 0%
5s:   First assessment → 15-25%
20s:  Erratic mouse → 45-55%
35s:  Random clicks → 70-80% (High risk)
50s:  Continued → 85-95% (Session lock)
```

### Color Changes

- **Green (0-49%)**: Smooth transitions from 10% → 20% → 35% → 45%
- **Orange (50-79%)**: Gradual increases from 52% → 65% → 78%
- **Red (80-100%)**: Critical levels from 82% → 90% → 98%

## Testing

### 1. Restart Python Service

The Python service needs to be restarted to load the new normalization functions:

```powershell
# Stop current service (Ctrl+C in terminal)
cd E:\CISP_Behavioural_Biometric\cbba_python_service
python app.py
```

### 2. Clear Browser Cache

Hard refresh to load updated frontend:
```
Ctrl + Shift + R  (Windows)
Cmd + Shift + R   (Mac)
```

### 3. Monitor Logs

**Python Service Terminal**:
```
[CBBA] User tank108 - IF raw: 0.2145, IF risk: 28.5%, SVM raw: 0.4321, SVM risk: 32.1%, Combined: 29.9%
```

**Browser Console (F12)**:
```
[CBBA] Assessing risk with data: {keystroke: 25, mouse: 78, user: "tank108"}
[CBBA] Risk assessment result: {riskScore: 29.9, riskLevel: "low", ...}
```

### 4. Test Different Behaviors

#### Test A: Normal Behavior
1. Login as `tank108`
2. Type normally
3. Move mouse smoothly
4. **Expected**: Scores between 10-35%

#### Test B: Moderate Changes
1. Type faster than usual
2. Move mouse quickly
3. **Expected**: Scores between 40-65%

#### Test C: Anomalous Behavior
1. Type very fast then very slow
2. Move mouse erratically
3. Click randomly
4. **Expected**: Scores between 70-95%

## Troubleshooting

### Still Seeing Binary Scores (0% or 60%)?

**Check**:
1. Python service restarted? (Must restart to load new code)
2. Browser cache cleared? (Ctrl+Shift+R)
3. User trained with diverse data? (Re-train if needed)

**Solution**: Re-train the model with more diverse behavior:
```powershell
cd cbba_python_service
python train_user.py
# Enter: tank108
```

### Scores Not Changing At All?

**Check**:
1. Browser console shows "Insufficient data" → Type more, move mouse more
2. Backend not running → Check backend terminal
3. Python service not running → Check Python terminal

### Scores Change Too Slowly?

The interval is now 15 seconds. For even faster updates during testing:

**Edit `useCBBA.js`**:
```javascript
// Change from 15000 to 10000 (10 seconds)
assessmentInterval.current = setInterval(assessRisk, 10000);
```

### Scores Too Sensitive?

Adjust the normalization weights in `anomaly_detection.py`:

```python
# Current: 60% IF, 40% SVM
combined_risk = (if_risk * 0.6 + svm_risk * 0.4)

# Make less sensitive: More weight on SVM (smoother)
combined_risk = (if_risk * 0.4 + svm_risk * 0.6)
```

## Key Improvements

### Before:
- ❌ Binary scores: 0% or 60%
- ❌ No gradual transitions
- ❌ Assessment every 30 seconds
- ❌ No immediate feedback
- ❌ Felt static and unrealistic

### After:
- ✅ Gradual scores: Full range 0-100%
- ✅ Smooth transitions between risk levels
- ✅ Assessment every 15 seconds
- ✅ Initial assessment after 5 seconds
- ✅ Feels dynamic and real-time
- ✅ Detailed logging for debugging

## Next Steps

1. **Restart Python service** (required!)
2. **Clear browser cache** (Ctrl+Shift+R)
3. **Login and test** with different behaviors
4. **Monitor console logs** to see score calculations
5. **Adjust sensitivity** if needed

---

**Status**: ✅ Ready for Testing  
**Date**: October 18, 2025

**Important**: Python service MUST be restarted for changes to take effect!
