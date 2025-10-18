# CBBA Sensitivity Reduction & Retraining Guide

## Changes Applied ✅

### 1. Scoring Algorithm Adjustments (Ultra-Conservative)

#### New Risk Weighting (Heavily Favor SVM)
```python
# BEFORE (Balanced)
combined_risk = (IF × 0.40) + (SVM × 0.30) + (Feature × 0.30)

# AFTER (SVM-Heavy - Most Stable)
combined_risk = (IF × 0.25) + (SVM × 0.60) + (Feature × 0.15)
```

**Why?** SVM is the most stable and tolerant scorer. Feature distance was too sensitive (98-100%), so we reduced its weight from 30% to 15%.

---

#### Isolation Forest Scoring (Ultra-Lenient)
**Before:**
- Normal: score ≥ 0.3 → 5-15% risk
- Slight deviation: 0.1 to -0.1 → 30-50% risk

**After:**
- Normal: score ≥ 0.2 → 5-10% risk
- Still acceptable: 0.0 to -0.15 → 10-25% risk
- Slight deviation: -0.15 to -0.3 → 25-40% risk

---

#### SVM Scoring (Ultra-Lenient)
**Before:**
- Normal: score ≥ 1.0 → 5-15% risk
- Slight deviation: -0.3 to 0.3 → 30-50% risk

**After:**
- Very normal: score ≥ 0.5 → 5-10% risk
- Normal: 0.0 to 0.5 → 10-15% risk
- Still acceptable: -0.5 to 0.0 → 15-25% risk
- Slight deviation: -1.0 to -0.5 → 25-40% risk

---

### 2. Training Data Generation (More Diverse & Realistic)

#### Keystroke Changes
```python
# BEFORE
avg_key_interval = 200ms
std_dev = 80ms
pause_probability = 5%
burst_typing = 10%
typo_probability = 3%

# AFTER (Much More Variation)
avg_key_interval = 250ms
std_dev = 120ms (HUGE variation)
pause_probability = 8%
burst_typing = 15%
typo_probability = 5%
pauses = 500-3000ms (longer thinking pauses)
```

#### Mouse Movement Changes
```python
# BEFORE
normal dx/dy = ±25 pixels
overshoot = 8%
micro_corrections = 15%
pause_probability = 10%
click_probability = 5%

# AFTER (Much More Variation)
normal dx/dy = ±35 pixels
overshoot = 12%
micro_corrections = 20%
pause_probability = 15%
click_probability = 8%
pauses = 200-1500ms (longer pauses)
```

---

## Expected Behavior Now

With the new ultra-conservative scoring:

| Behavior | Old Risk | New Risk | Status |
|----------|----------|----------|--------|
| **Normal usage** | 73-76% | **10-25%** | 🟢 Green |
| **Slightly faster** | 75-80% | **25-35%** | 🟢 Green |
| **Rapid activity** | 80-85% | **40-60%** | 🟠 Orange |
| **Very unusual** | 85-95% | **60-80%** | 🟠 Orange |
| **Bot behavior** | 95-100% | **80-100%** | 🔴 Red |

---

## Do You Need to Retrain? YES! 

### Why Retrain?
Your current model was trained with the OLD training data generator which had:
- Less variation in timing
- Fewer pauses
- Less diverse click patterns
- Narrower movement ranges

The NEW training data is **MUCH MORE VARIED** and will create a baseline that better matches real human behavior with all its imperfections.

---

## Retraining Instructions

### Step 1: Delete Old Model
```powershell
del "E:\CISP_Behavioural_Biometric\cbba_python_service\models\user_tank108_model.pkl"
```

### Step 2: Get Fresh JWT Token
1. Login to the application
2. Open browser console (F12)
3. Run: `localStorage.getItem('jwt_token')`
4. Copy the token (without quotes)

### Step 3: Run Training Script
```powershell
cd "E:\CISP_Behavioural_Biometric\cbba_python_service"
python generate_training_data.py tank108 YOUR_JWT_TOKEN_HERE 500
```

**Recommended:** Use 500 samples (takes ~2 minutes)

### Step 4: Verify Training
Look for:
```
✓ Training Successful!
Results:
  • Samples trained: 500
  • Profile status: trained
  • Model ready: Yes
```

### Step 5: Test
1. Refresh browser
2. Use app normally for 30 seconds
3. Check console: `[CBBA] Combined: 10-25%` ← Should be LOW now!

---

## What If Risk Is STILL Too High?

If after retraining with the new generator, risk is still 40%+ with normal usage:

### Option 1: Further Reduce Sensitivity
I can reduce the weighting even more:
- IF: 25% → 15%
- SVM: 60% → 75%
- Feature: 15% → 10%

### Option 2: Train with YOUR Actual Data
The synthetic generator might still not match your exact behavior.

**Solution:** Collect YOUR real behavioral data:
1. Use the app normally for 3-5 minutes
2. The frontend collects data automatically
3. Export that data and train the model with it
4. This makes YOUR behavior the baseline

---

## Quick Reference: What Changed

### Files Modified
1. **`anomaly_detection.py`**
   - Changed risk weighting to favor SVM (60%)
   - Made IF scoring ultra-lenient (wider ranges)
   - Made SVM scoring ultra-lenient (wider ranges)
   - Reduced Feature weight to 15%

2. **`generate_training_data.py`**
   - Increased typing variation (std_dev: 80→120ms)
   - Increased mouse variation (±25→±35 pixels)
   - More pauses (8% vs 5%, longer duration)
   - More clicks (8% vs 5%)
   - More micro-corrections (20% vs 15%)
   - Longer thinking pauses (up to 3000ms)

---

## Testing Checklist

After retraining:

- [ ] Normal usage → 10-30% risk (green) ✅ Expected
- [ ] Fast typing → 25-40% risk (green/orange) ✅ Expected
- [ ] Rapid clicking → 50-65% risk (orange) ✅ Expected
- [ ] Bot behavior (50+ same clicks) → 80-100% (red) ✅ Expected

---

## Next Steps

1. ✅ **Python service restarted** with new scoring
2. ⏳ **Delete old model** (run command above)
3. ⏳ **Retrain with 500 samples** (run training script)
4. ⏳ **Test normal usage** (should be 10-30% risk now)
5. ⏳ **Report results** (share logs showing new risk scores)

---

## Summary

**What We Did:**
- ✅ Reduced sensitivity dramatically by favoring SVM (60% weight)
- ✅ Made all scoring thresholds ultra-lenient
- ✅ Created more diverse training data with huge variations
- ✅ Restarted Python service with new scoring

**What You Need to Do:**
- ⏳ Delete old model
- ⏳ Retrain with 500 samples using updated generator
- ⏳ Test and report if risk is now 10-30% with normal usage

**Expected Outcome:**
Normal usage should now score **10-30% risk** instead of 73-76%! 🎉

If it's STILL too high after retraining, let me know and I'll reduce sensitivity even further.
