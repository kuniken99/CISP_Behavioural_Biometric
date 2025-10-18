# Python Service Configuration Fix - MIN_TRAINING_SAMPLES

## Issue
Training with 11 samples was failing with error:
```
HTTP BadRequest: {"error":"Insufficient training data. Need at least 50 samples, got 11"}
```

## Root Cause
The Python service was running with an **old cached configuration** where `MIN_TRAINING_SAMPLES` was still set to 50 (the original production value).

Even though the `config.py` file showed `MIN_TRAINING_SAMPLES = 10`, Python had already loaded the old value into memory when the service started.

## Solution Applied

### 1. Updated Configuration
**File**: `cbba_python_service/config.py` (line 35)

**Before**:
```python
MIN_TRAINING_SAMPLES = 10  # Minimum samples needed for initial training (lowered for development)
```

**After**:
```python
MIN_TRAINING_SAMPLES = 5  # Minimum samples needed for initial training (lowered for development - was 10, originally 50)
```

**Reason for 5 samples**:
- Matches the frontend filter requirement (minimum 5 complete samples)
- Allows faster development testing
- User currently has 11 samples collected, which is well above 5
- Production should use 50-100 for better model quality

### 2. Restarted Python Service
The Python service needed to be restarted to pick up the new configuration value:

```powershell
# Stop old process
Get-Process python | Where-Object {$_.Path -like "*CISP*"} | Stop-Process -Force

# Start with new config
Set-Location E:\CISP_Behavioural_Biometric\cbba_python_service
python app.py
```

**Service Status**: ✅ Running on http://127.0.0.1:5001

## Verification

### Check Config Value
```powershell
Get-Content config.py | Select-String -Pattern "MIN_TRAINING_SAMPLES"
```

**Output**:
```python
MIN_TRAINING_SAMPLES = 5  # Minimum samples needed for initial training (lowered for development - was 10, originally 50)
```

### Test Training with 11 Samples
In browser console:
```javascript
window.cbba.trainWithCollectedData().then(console.log);
```

**Expected Result**:
```javascript
{
  success: true,
  message: "Profile trained successfully",
  samplesTrained: 11,
  featureDimension: 23
}
```

## Configuration History

| Setting | Value | Context |
|---------|-------|---------|
| **Original** | 50 | Production-ready, requires substantial training data |
| **Intermediate** | 10 | Lowered for development, still needed more samples |
| **Current** | **5** | Development testing, matches frontend minimum |
| **Recommended Production** | 50-100 | For reliable model performance |

## Impact

### Development (Current)
✅ **Benefits**:
- Quick testing with minimal samples
- Faster iteration on model improvements
- Easier to collect sufficient training data
- Matches frontend filter minimum (5 samples)

⚠️ **Trade-offs**:
- Lower model quality with fewer samples
- Higher risk of overfitting
- May not generalize well to all user behaviors
- More likely to trigger false positives/negatives

### Production (Future)
When deploying to production, increase to 50-100:

**File**: `cbba_python_service/config.py`
```python
MIN_TRAINING_SAMPLES = 50  # Production: Require substantial training data
```

**Also adjust frontend filter** in `useCBBA.js` (line 520):
```javascript
const minSamples = 50; // Production: Back to original requirement
```

**And re-enable AND logic** (line 512):
```javascript
return hasKeystroke && hasMouse; // Production: Require both types
```

## Testing Steps

1. **Refresh browser** (Ctrl+Shift+R) to ensure frontend is current

2. **Verify samples collected**:
   ```javascript
   console.log(window.cbba.getCollectedTrainingSamples().length);
   // Should show: 11 (or your current count)
   ```

3. **Train with collected samples**:
   ```javascript
   window.cbba.trainWithCollectedData().then(console.log);
   ```

4. **Expected console output**:
   ```
   [CBBA Training] Preparing to train with 11 samples...
   [CBBA Training] Payload preview: {
     totalSamples: 11,
     completeSamples: 11,
     filteredOut: 0,
     firstSample: { keystrokeCount: X, mouseCount: Y }
   }
   
   ✅ Training successful!
   {
     success: true,
     message: "Profile trained successfully",
     samplesTrained: 11,
     featureDimension: 23
   }
   ```

5. **Expected Python service logs**:
   ```
   Successfully trained models for user tank108 with 11 samples
   Feature matrix shape: (11, 23)
   Isolation Forest trained with contamination=0.08
   One-Class SVM trained with nu=0.08
   Models saved to: ./models/user_tank108_model.pkl
   ```

6. **Reset risk and test**:
   ```javascript
   window.cbba.resetRiskScore();
   // Interact normally for 30-60 seconds
   // Risk should stay 10-30%
   ```

## Common Issues

### Issue: Still getting "Need at least 50 samples"
**Cause**: Python service not restarted  
**Solution**: Restart the Python service terminal

### Issue: Training succeeds but risk immediately spikes to 75%
**Cause**: Model not trained on representative behavior  
**Solution**: Run `window.cbba.resetRiskScore()` and interact normally

### Issue: Risk always high after training
**Cause**: 11 samples may not be enough for quality model  
**Solution**: Collect 30-50 more samples with diverse interactions

## Summary

✅ **Fixed**: `MIN_TRAINING_SAMPLES` lowered from 50 → 5  
✅ **Applied**: Python service restarted with new config  
✅ **Ready**: Your 11 samples should now train successfully  
🎯 **Next**: Train, reset risk, and validate scores stay 10-30%

Run this in browser console to train:
```javascript
window.cbba.trainWithCollectedData().then(console.log);
```
