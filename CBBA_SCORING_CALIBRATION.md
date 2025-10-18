# CBBA Scoring Calibration Guide

## Issue Fixed: 400 Bad Request → JsonElement Solution ✅

### Problem
Frontend was getting `400 Bad Request` when sending biometric data to `/api/Biometric/assess`.

### Root Cause
C# backend model used `JArray` (Newtonsoft.Json), but ASP.NET Core uses `System.Text.Json` by default. The model binder couldn't deserialize JavaScript arrays into `JArray` directly.

### Solution
Changed `CBBARiskRequest` model to use `System.Text.Json.JsonElement`:

```csharp
public class CBBARiskRequest
{
    [JsonPropertyName("keystrokeData")]
    public JsonElement? KeystrokeData { get; set; }
    
    [JsonPropertyName("mouseData")]
    public JsonElement? MouseData { get; set; }
}
```

Then convert to `JArray` in the controller:

```csharp
JArray keystrokeData = new JArray();
JArray mouseData = new JArray();

if (request.KeystrokeData.HasValue && request.KeystrokeData.Value.ValueKind == JsonValueKind.Array)
{
    var jsonString = request.KeystrokeData.Value.GetRawText();
    keystrokeData = JArray.Parse(jsonString);
}

if (request.MouseData.HasValue && request.MouseData.Value.ValueKind == JsonValueKind.Array)
{
    var jsonString = request.MouseData.Value.GetRawText();
    mouseData = JArray.Parse(jsonString);
}
```

**Result:** ✅ Python now receives complete event data with all properties (`x`, `y`, `event`, `timestamp`, `button`)

---

## Issue Fixed: Risk Scores Stuck at 73-76% ✅

### Problem
After fixing the 400 error, risk scores were constantly 73-76% even with normal behavior:
```
[CBBA] User tank108 - IF: 98-100%, SVM: 16-19%, Feature: 98-100%, Combined: 73-76%
```

### Root Cause
**OVER-AMPLIFICATION**: The scoring system had amplification multipliers that made normal behavior look anomalous:
- Isolation Forest: ×2.8 amplification
- SVM: ×2.5 amplification  
- Feature distance: ×2.0 amplification

Even though training data included realistic human imperfections (typos, pauses, overshoots), the amplification was causing normal variations to score 98-100% risk.

### Solution: REMOVE ALL AMPLIFICATION

#### Before (Over-Sensitive):
```python
# _normalize_if_score
score = score * 2.8  # ❌ Too aggressive
if score >= 0.4:     # ❌ Narrow normal range
    risk = 5-15%     # ❌ Hard to stay "normal"
```

#### After (Conservative):
```python
# _normalize_if_score  
# NO amplification - use raw IF score
if score >= 0.3:     # ✅ Wider normal range
    risk = 5-15%     # ✅ Easy to maintain low risk
elif score >= 0.1:
    risk = 15-30%    # ✅ Still considered normal
```

---

## New Scoring Thresholds (Conservative)

### Isolation Forest Scoring
- **Raw score used** (no amplification)
- Ranges:
  - `0.3 to 0.5`: 5-15% risk (very normal)
  - `0.1 to 0.3`: 15-30% risk (normal)
  - `-0.1 to 0.1`: 30-50% risk (slight deviation)
  - `-0.3 to -0.1`: 50-70% risk (moderate anomaly)
  - `-0.5 to -0.3`: 70-85% risk (high anomaly)
  - `< -0.5`: 85-100% risk (extreme anomaly)

### One-Class SVM Scoring
- **Raw score used** (no amplification)
- Ranges:
  - `1.0 to 2.0`: 5-15% risk (very normal)
  - `0.3 to 1.0`: 15-30% risk (normal)
  - `-0.3 to 0.3`: 30-50% risk (slight deviation)
  - `-1.0 to -0.3`: 50-70% risk (moderate anomaly)
  - `-1.5 to -1.0`: 70-85% risk (high anomaly)
  - `< -1.5`: 85-100% risk (extreme anomaly)

### Feature Distance Scoring
- **Raw distance used** (no amplification)
- Standard deviation thresholds:
  - `0-2 std`: 5-20% risk (normal variation)
  - `2-4 std`: 20-35% risk (acceptable)
  - `4-6 std`: 35-55% risk (watch)
  - `6-8 std`: 55-70% risk (moderate)
  - `8-10 std`: 70-85% risk (challenge auth)
  - `10+ std`: 85-100% risk (session lock)

### Bot Detection
- **Unchanged** - already conservative
- Triggers at **50% repetitive clicks** at same coordinates (±5 pixels)
- Penalty: +25% to +50% risk

---

## Expected Behavior Now

### Normal Usage (Goal: 5-35% risk)
- Regular mouse movements
- Normal typing speed/rhythm
- Occasional clicks
- Varied click positions
- **Expected:** Green status, no alerts

### Suspicious Activity (Goal: 50-79% risk)
- Rapid mouse movements
- Faster typing than trained
- Many clicks in short time
- Some repetitive patterns
- **Expected:** Orange status, step-up auth challenge

### Malicious Activity (Goal: 80-100% risk)
- Bot-like repetitive clicks (50%+ same coordinates)
- Extremely rapid/erratic movements
- Typing patterns drastically different from baseline
- Clear deviation from all training data
- **Expected:** Red status, session lock (15 min)

---

## Testing Recommendations

### 1. Normal Behavior Test
**Action:** Use the application normally for 30 seconds
- Move mouse naturally
- Click different buttons
- Type at your normal speed

**Expected Result:** Risk stays 5-35% (green)

### 2. Rapid Activity Test
**Action:** Move mouse quickly and click multiple times rapidly
- Move mouse in circles fast
- Click different spots quickly (not same spot)
- Type faster than normal

**Expected Result:** Risk 50-79% (orange) → Step-up auth modal appears

### 3. Bot Detection Test
**Action:** Click same button 20+ times at exact same spot
- Use a macro or click same coordinates repeatedly
- Do this within 5-10 seconds

**Expected Result:** Risk 80-100% (red) → Session lock modal appears

---

## Training Data Quality

Your current model (`user_tank108_model.pkl`) was trained with **500 samples** including:
- ✅ Realistic typing: typos (3%), pauses (5%), burst typing (10%)
- ✅ Realistic mouse: overshoots (8%), micro-corrections (15%), pauses (10%)
- ✅ Varied speeds: fast, normal, slow typing
- ✅ 18 features: 7 keystroke + 11 mouse (including bot detection)

If risk scores are still too high after this fix:
1. **Collect YOUR actual behavior:** Use the app normally for 2-3 minutes
2. **Retrain with real data:** This will make YOUR usage the baseline
3. **Test again:** Risk should stay low for normal usage

---

## Files Modified

### Backend (C#)
- `backend/Controllers/BiometricController.cs`:
  - Added `using System.Text.Json;`
  - Changed `CBBARiskRequest` to use `JsonElement`
  - Added conversion logic to `JArray` in `AssessRisk()` and `UpdateProfile()`

### Python Service
- `cbba_python_service/anomaly_detection.py`:
  - Removed amplification from `_normalize_if_score()` (was ×2.8, now ×1.0)
  - Removed amplification from `_normalize_svm_score()` (was ×2.5, now ×1.0)
  - Removed amplification from `_calculate_feature_risk()` (was ×2.0, now ×1.0)
  - Widened "normal" score ranges for all methods
  - Bot detection threshold unchanged (50%)

---

## Verification Checklist

✅ Backend builds successfully (`dotnet build`)  
✅ Backend runs without errors (`dotnet run` on port 5000)  
✅ Python service runs without errors (`python app.py` on port 5001)  
✅ Frontend sends data successfully (no 400 errors)  
✅ Python receives complete JSON (not `{'ValueKind': 1}`)  
⏳ **TEST NEEDED:** Risk stays 5-35% with normal usage  
⏳ **TEST NEEDED:** Risk reaches 50-79% with rapid activity  
⏳ **TEST NEEDED:** Risk reaches 80%+ with bot behavior  

---

## Next Steps

1. **Refresh your browser** (clear console)
2. **Use the app normally** for 30 seconds
3. **Check the logs:**
   - Frontend: Should see `[CBBA] Risk assessment result: {riskScore: 5-35...}`
   - Python: Should see `[CBBA] User tank108 - IF: 15-30%, SVM: 10-20%, Feature: 10-25%, Combined: 10-25%`

4. **If still too high:**
   - The training data doesn't match your actual behavior
   - Solution: Delete model and retrain with YOUR real behavioral data
   - Command: `python generate_training_data.py` (after logging in and using app normally)

---

## Summary

### What Was Fixed
1. ✅ **400 Bad Request** → Changed to `JsonElement` for proper JSON deserialization
2. ✅ **Risk stuck at 75%** → Removed all amplification for conservative scoring
3. ✅ **False positives** → Widened "normal" thresholds significantly

### What Works Now
- ✅ Frontend → Backend → Python data flow is complete
- ✅ All event properties preserved (`x`, `y`, `event`, `timestamp`, `button`)
- ✅ Scoring is much more tolerant of normal variations
- ✅ Bot detection still triggers at 50% repetitive clicks

### Expected Outcome
- Normal usage: **5-35% risk** (green) ← **THIS IS THE GOAL**
- Suspicious activity: **50-79% risk** (orange, step-up auth)
- Bot behavior: **80-100% risk** (red, session lock)

**The system should now work as intended!** 🎉
