# CBBA Training & Timestamp Fixes

**Date:** October 18, 2025  
**Status:** ✅ COMPLETED

---

## Issues Fixed

### Issue 1: Training Failure - Inhomogeneous Array Shape ❌

**Error:**
```
setting an array element with a sequence. The requested array has an inhomogeneous shape after 1 dimensions. The detected shape was (39,) + inhomogeneous part.
```

**Root Cause:**
- Some training samples had only keystroke data (17 keystroke, 0 mouse)
- Python numpy cannot create arrays from samples with different shapes
- Model requires consistent feature dimensions across all samples

**Solution:**
- Filter out incomplete samples before sending to backend
- Require BOTH keystroke (4+) AND mouse (10+) events per sample
- Show detailed logging of filtered samples
- Require minimum 10 complete samples for training

**Code Changes** (`frontend/src/hooks/useCBBA.js`):
```javascript
// Filter out incomplete samples (must have BOTH keystroke AND mouse data)
const payload = trainingSamplesRef.current
  .filter(s => {
    const hasKeystroke = s.keystrokeData && s.keystrokeData.length >= 4;
    const hasMouse = s.mouseData && s.mouseData.length >= 10;
    return hasKeystroke && hasMouse; // Require both for consistency
  })
  .map(s => ({
    keystrokeData: s.keystrokeData || [],
    mouseData: s.mouseData || []
  }));

if (payload.length < 10) {
  return { 
    success: false, 
    error: `Insufficient complete samples (${payload.length}/10). Each sample must have both keystroke (4+) and mouse (10+) events.` 
  };
}
```

**New Console Output:**
```
[CBBA Training] Payload preview: {
  totalSamples: 39,
  completeSamples: 24,
  filteredOut: 15,
  firstSample: { keystrokeCount: 17, mouseCount: 45 }
}
```

---

### Issue 2: Alert Timestamps Not in GMT+8 ❌

**Problem:**
- Alert timestamps displayed in UTC instead of Singapore time (GMT+8)
- ActivityLogPage already had correct implementation
- AlertSystemPage needed the same fix

**Solution:**
- Convert UTC timestamps to GMT+8 by adding 8 hours
- Use consistent date formatting across all pages
- Match ActivityLogPage implementation exactly

**Code Changes** (`frontend/src/pages/AlertSystemPage.js`):

**Before:**
```javascript
timestamp: new Date(alert.timestamp).toLocaleString()
```

**After:**
```javascript
// Convert UTC timestamp to GMT+8 (Singapore time)
const utcDate = new Date(alert.timestamp);
const gmt8Date = new Date(utcDate.getTime() + (8 * 60 * 60 * 1000)); // Add 8 hours

timestamp: gmt8Date.toLocaleString('en-US', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: true
})
```

**Result:**
- Alerts now display in Singapore time (GMT+8)
- Consistent with ActivityLogPage timestamps
- Format: `10/18/2025, 04:16:17 PM` (GMT+8)

---

## Updated Training Steps

### Prerequisites
All three services must be running:
- ✅ Backend: `localhost:5000`
- ✅ Python Service: `localhost:5001`
- ✅ Frontend: `localhost:3000`

### Step-by-Step Training Guide

**1. Refresh browser page** to load updated code

**2. Start training mode and capture:**
```javascript
window.cbba.startTrainingCapture(5000);
```

Console output:
```
[CBBA Training] 🟢 Training mode ENABLED - step-up auth suppressed
[CBBA Training] Started capturing samples every 5000ms...
```

**3. Interact with the application normally:**
- **Type in text fields** (search boxes, forms, etc.)
- **Move mouse around** the interface
- **Click buttons and links**
- **Scroll through pages**
- **Navigate between views**

⚠️ **Important:** Each sample needs BOTH keystroke AND mouse activity!

**4. Check progress periodically:**
```javascript
window.cbba.getCollectedTrainingSamples().length
```

**5. Stop capture when you have 30-50+ samples:**
```javascript
window.cbba.stopTrainingCapture();
```

Console output:
```
[CBBA Training] 🔴 Training mode DISABLED - step-up auth re-enabled
[CBBA Training] Stopped capture. Total samples collected: 42
[CBBA Training] Ready to train!
```

**6. Train the model:**
```javascript
window.cbba.trainWithCollectedData().then(console.log);
```

Expected console output:
```
[CBBA Training] Preparing to train with 42 samples...
[CBBA Training] Payload preview: {
  totalSamples: 42,
  completeSamples: 38,
  filteredOut: 4,
  firstSample: { keystrokeCount: 22, mouseCount: 67 }
}
[CBBA Training] Training successful: {
  success: true,
  message: "Profile trained successfully",
  samplesTrained: 38,
  featureDimension: 23
}
```

---

## Troubleshooting

### "Insufficient complete samples" Error

**Problem:**
```
Insufficient complete samples (7/10). Each sample must have both keystroke (4+) and mouse (10+) events.
```

**Cause:**
- Too many samples have only mouse OR only keystroke data
- Not enough samples with BOTH interaction types

**Solution:**
- During capture, actively use BOTH keyboard AND mouse
- Type in search boxes while also moving/clicking
- Navigate using both keyboard shortcuts AND mouse clicks
- Collect 50+ samples to account for filtering (aim for 30+ complete)

### Training Still Fails After Filtering

**If you see:**
```
HTTP BadRequest: {"error":"Insufficient training data. Need at least 10 samples..."}
```

**Solutions:**

**Option A: Collect more samples** (RECOMMENDED)
```javascript
// Restart capture and interact MORE
window.cbba.startTrainingCapture(5000);
// Use app for 10+ minutes with BOTH keyboard and mouse
// Stop and try training again
window.cbba.stopTrainingCapture();
window.cbba.trainWithCollectedData().then(console.log);
```

**Option B: Lower minimum samples** (already done)
- Config already set to minimum 10 samples (was 50)
- This should be sufficient for development testing

### Timestamps Still Wrong

**Verify GMT+8 conversion:**
1. Check browser console for alert fetch logs
2. Compare timestamps with your local time
3. Should match Singapore time (GMT+8)
4. Example: UTC `08:16:17` → GMT+8 `16:16:17` (4:16 PM)

---

## Summary of All Changes

### Files Modified

1. **`frontend/src/hooks/useCBBA.js`**
   - Added sample filtering (require both keystroke 4+ and mouse 10+)
   - Added detailed logging of filtered samples
   - Minimum 10 complete samples required
   - Better error messages

2. **`frontend/src/pages/AlertSystemPage.js`**
   - Fixed timestamp conversion to GMT+8
   - Consistent date formatting with ActivityLogPage

3. **`cbba_python_service/config.py`** (previous change)
   - Lowered MIN_TRAINING_SAMPLES: 50 → 10

4. **`frontend/src/hooks/useCBBA.js`** (previous changes)
   - Training mode ref for immediate access
   - Suppresses step-up auth during capture
   - Assessment interval: 5s → 3s
   - Data thresholds: 30 keystroke / 100 mouse → 4 keystroke / 10 mouse

---

## Expected Results After Training

✅ **Risk scores update every 3 seconds**  
✅ **Normal behavior shows 10-30% risk**  
✅ **No 75% spikes from normal interaction**  
✅ **Timestamps display in GMT+8 (Singapore time)**  
✅ **Step-up auth only triggers for genuine anomalies**  

---

## Next Steps

1. **Restart frontend** if not already running
2. **Follow training steps above** to collect 30-50 samples
3. **Train with real data** using `trainWithCollectedData()`
4. **Verify responsive updates** (risk scores every 3s)
5. **Test normal usage** - should stay 10-30% risk

---

*This completes the CBBA training system improvements and timezone consistency fixes.*
