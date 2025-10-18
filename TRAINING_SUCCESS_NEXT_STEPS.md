# Training Success - Next Steps

## ✅ Training Completed Successfully!

Your training was successful:
- **18 samples** trained
- **23 feature dimensions** (consistent)
- Model saved for user `tank108`

---

## 🔴 Current Issue: Post-Training False Positive

After training, the system immediately assessed your behavior and scored **75% risk**, triggering step-up authentication. This created a deadlock:

1. Step-up modal blocks interaction
2. No interaction = no new behavioral data
3. Assessment times out repeatedly
4. Risk score stays at 75%

**Why this happens**:
- The trained model might not have enough samples to accurately represent your normal behavior
- The ultra-lenient scoring might still be too strict
- Immediate assessment after training can catch transient behavior patterns

---

## 🛠️ Immediate Solutions

### Solution 1: Reset Risk Score and Re-establish Baseline

1. **Refresh your browser** (Ctrl+Shift+R) to load updated code

2. **Close the step-up modal** (click X or outside modal)

3. **Reset the risk score**:
   ```javascript
   window.cbba.resetRiskScore();
   ```
   
   Console output:
   ```
   [CBBA] Risk score manually reset to 0. Interact to re-establish baseline.
   ```

4. **Interact normally** for 30-60 seconds:
   - Click around the UI
   - Type in search boxes
   - Scroll pages
   - Navigate between pages

5. **Monitor console** for risk score updates (every 3 seconds):
   ```
   [CBBA] Risk score updated: 0 → 15
   [CBBA] Risk score updated: 15 → 12
   [CBBA] Risk score updated: 12 → 18
   ```

6. **Expected behavior**:
   - Risk should stay **10-30%** for normal interactions
   - If it spikes to **50-79%**, you'll see step-up auth
   - If it hits **80%+**, session will lock

### Solution 2: Collect More Training Data

If risk scores are still too high after reset:

1. **Enable training mode** (suppresses step-up auth):
   ```javascript
   window.cbba.enableTrainingMode();
   ```

2. **Start capturing more samples**:
   ```javascript
   window.cbba.startTrainingCapture(5000);
   ```

3. **Interact naturally for 10-15 minutes**:
   - Mix keyboard and mouse activities
   - Use different pages
   - Perform real tasks (not rapid clicking)

4. **Stop capture**:
   ```javascript
   window.cbba.stopTrainingCapture();
   ```

5. **Train with new data**:
   ```javascript
   window.cbba.trainWithCollectedData().then(console.log);
   ```

6. **Disable training mode**:
   ```javascript
   window.cbba.disableTrainingMode();
   ```

7. **Reset risk and test**:
   ```javascript
   window.cbba.resetRiskScore();
   ```

---

## 🔍 What Changed (Automatic Post-Training Fixes)

### 1. Assessment Buffers Cleared After Training

**File**: `frontend/src/hooks/useCBBA.js` (lines 547-554)

**Before**:
```javascript
if (response.ok) {
  const result = await response.json();
  console.log('[CBBA Training] Training successful:', result);
  trainingSamplesRef.current = [];
  setIsTrained(true);
  return result;
}
```

**After**:
```javascript
if (response.ok) {
  const result = await response.json();
  console.log('[CBBA Training] Training successful:', result);
  
  // Clear local training buffer on success
  trainingSamplesRef.current = [];
  setIsTrained(true);
  
  // ✅ NEW: Clear assessment buffers to prevent immediate false positives
  keystrokeBufferRef.current = [];
  mouseBufferRef.current = [];
  console.log('[CBBA Training] ⚠️ Assessment buffers cleared. Interact normally to establish baseline.');
  
  return result;
}
```

**What this does**:
- Clears any behavioral data collected BEFORE training
- Prevents stale pre-training data from being assessed against the new model
- Forces fresh data collection after training

### 2. Added Manual Risk Reset Function

**New function added** (lines 575-582):
```javascript
const resetRiskScore = useCallback(() => {
  setRiskScore(0);
  setRiskLevel('low');
  setCbbaStatus('active');
  keystrokeBufferRef.current = [];
  mouseBufferRef.current = [];
  console.log('[CBBA] Risk score manually reset to 0. Interact to re-establish baseline.');
}, []);
```

**Exposed on window.cbba** (line 368):
```javascript
window.cbba.resetRiskScore = resetRiskScore;
```

**What this does**:
- Manually resets risk score to 0%
- Clears all behavioral data buffers
- Allows you to start fresh after training or step-up auth

---

## 📊 Diagnosing Model Quality

### Check Current Risk Scores

After resetting and interacting normally, check console logs:

**Good model** (trained on representative data):
```
[CBBA] Risk score updated: 0 → 12
[CBBA] Risk score updated: 12 → 15
[CBBA] Risk score updated: 15 → 18
[CBBA] Risk score updated: 18 → 14
```
✅ Scores stay in **10-30% range** consistently

**Underfitted model** (not enough training data):
```
[CBBA] Risk score updated: 0 → 45
[CBBA] Risk score updated: 45 → 52
[CBBA] Triggering step-up authentication challenge
```
❌ Scores immediately jump to **50%+**
**Solution**: Collect 30-50 more training samples

**Overfitted model** (trained on very specific behavior):
```
[CBBA] Risk score updated: 0 → 5   ← Typing same as training
[CBBA] Risk score updated: 5 → 68  ← Different activity
```
❌ Scores are **too sensitive** to behavior changes
**Solution**: Collect more diverse training samples (different tasks)

### Check Python Service Logs

Look for these indicators in Python service terminal:

**Healthy model**:
```
Risk assessment for user tank108:
- IsolationForest score: 0.35
- OneClassSVM score: 0.28
- Feature-based risk: 0.18
- Combined risk: 15%
→ Risk Level: LOW
```

**Problematic model**:
```
Risk assessment for user tank108:
- IsolationForest score: 0.82
- OneClassSVM score: 0.91
- Feature-based risk: 0.73
- Combined risk: 75%
→ Risk Level: HIGH
```
This indicates current behavior is very different from training data.

---

## 🎯 Recommended Next Steps

### Step 1: Test Current Model (5 minutes)

1. Refresh browser
2. Close step-up modal
3. Run: `window.cbba.resetRiskScore()`
4. Interact normally for 2-3 minutes
5. Observe risk scores in console

**Decision point**:
- If scores stay **10-30%**: ✅ Model is good, proceed to testing
- If scores spike to **50%+**: ❌ Need more training data (go to Step 2)

### Step 2: Collect More Training Data (15 minutes)

1. Run: `window.cbba.enableTrainingMode()`
2. Run: `window.cbba.startTrainingCapture(5000)`
3. Interact naturally for 10-15 minutes:
   - Type in forms (search, filters, text areas)
   - Click buttons, links, navigation
   - Scroll through pages
   - Use different features of the app
4. Run: `window.cbba.stopTrainingCapture()`
5. Run: `window.cbba.trainWithCollectedData().then(console.log)`
6. Run: `window.cbba.disableTrainingMode()`
7. Return to Step 1 to test

**Target**: Collect **30-50 total samples** for production-quality model

### Step 3: Validate Risk Responsiveness (10 minutes)

Once risk scores are stable at 10-30%:

1. **Test normal behavior**:
   - Interact naturally
   - Verify scores stay 10-30%

2. **Test fast typing** (should raise risk):
   - Type very fast in search box
   - Spam keystrokes rapidly
   - Expected: Risk increases to 35-45%

3. **Test fast mouse movement** (should raise risk):
   - Move mouse very quickly
   - Make erratic movements
   - Expected: Risk increases to 35-45%

4. **Test idle behavior** (should maintain low risk):
   - Stop interacting for 30 seconds
   - Expected: Risk stays low (no assessment without data)

### Step 4: Test Step-Up Authentication Flow

1. **Manually set high risk** (simulate attack):
   ```javascript
   // This is just for testing - in production, only model can set risk
   // You'll need to actually behave differently to trigger it
   ```

2. **Trigger step-up auth**:
   - Perform very fast/erratic mouse movements
   - Type extremely fast
   - Wait for risk to reach 50%+

3. **Verify step-up modal appears**:
   - Modal should block interaction
   - Email verification code sent
   - User must enter code

4. **Complete step-up**:
   - Enter verification code
   - Risk should reset to 0%
   - Normal interaction resumes

---

## 📝 Development Helper Commands

### Training Commands
```javascript
// Start capturing training samples (5-second intervals)
window.cbba.startTrainingCapture(5000);

// Stop capturing
window.cbba.stopTrainingCapture();

// Check collected samples
window.cbba.getCollectedTrainingSamples();

// Train with collected data
window.cbba.trainWithCollectedData().then(console.log);
```

### Training Mode (Suppress Step-Up Auth)
```javascript
// Enable training mode
window.cbba.enableTrainingMode();

// Check current mode
window.cbba.getTrainingMode();

// Disable training mode
window.cbba.disableTrainingMode();
```

### Risk Management
```javascript
// Reset risk score to 0
window.cbba.resetRiskScore();
```

---

## 🚨 Common Issues and Solutions

### Issue 1: Risk Immediately Spikes After Training
**Symptom**: Risk goes to 50-75% right after training success
**Cause**: Assessment runs before you can interact naturally
**Solution**: Run `window.cbba.resetRiskScore()` and interact normally

### Issue 2: Risk Always High (50-75%)
**Symptom**: Every interaction shows 50%+ risk
**Cause**: Model not trained on representative behavior
**Solution**: Collect 30-50 more training samples with diverse interactions

### Issue 3: Step-Up Modal Keeps Appearing
**Symptom**: Can't interact without triggering step-up auth
**Cause**: Model thinks your behavior is anomalous
**Solutions**:
- Short-term: `window.cbba.enableTrainingMode()` to suppress auth
- Long-term: Retrain with more samples

### Issue 4: Assessment Times Out (No Data)
**Symptom**: Console shows "Insufficient data" repeatedly
**Cause**: Not enough interaction to meet minimum thresholds
**Solution**: Interact more (type, click, scroll) to generate behavioral data

### Issue 5: Training Fails (Dimension Error)
**Symptom**: "inhomogeneous shape" error
**Cause**: Fixed in latest update - shouldn't occur
**Solution**: Refresh browser to load updated code

---

## 📈 Success Criteria

Your CBBA system is working correctly when:

✅ **Training**: 30-50 samples collected and trained successfully
✅ **Risk Scores**: Stay 10-30% for normal behavior  
✅ **Responsiveness**: Updates every 3 seconds with sufficient interaction
✅ **Sensitivity**: Increases to 35-50% for fast/erratic behavior
✅ **Step-Up Auth**: Triggers at 50%+, clears after verification
✅ **Session Lock**: Triggers at 80%+ for severe anomalies
✅ **No False Positives**: Normal work doesn't trigger step-up

---

## 🔄 Current Status

- ✅ Training completed: **18 samples, 23 features**
- ⚠️ Post-training assessment: **75% risk (false positive)**
- 🔧 Fixes deployed: Assessment buffers cleared, reset function added
- 📋 Next action: **Refresh browser, reset risk, test behavior**

**Immediate action required**:
1. Refresh browser (Ctrl+Shift+R)
2. Run: `window.cbba.resetRiskScore()`
3. Interact normally for 2-3 minutes
4. Check if risk stays 10-30%
5. If not, collect 30-50 more training samples
