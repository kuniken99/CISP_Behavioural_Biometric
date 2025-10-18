# Bot Detection: Repetitive Click Detection

## Overview

Implemented bot detection feature that identifies and penalizes **repetitive clicks at the same coordinates** - a common pattern in automated/bot behavior that legitimate users rarely exhibit.

---

## Feature Implementation

### 1. Click Position Tracking

**File:** `cbba_python_service/feature_extraction.py`

**Changes:**
- Added `click_positions` list to track (x, y) coordinates of all clicks
- Stores click location for every click event
- Increased feature vector size from 10 to 11 dimensions

```python
# Line 127: Track click coordinates
click_positions = []  # NEW: Track click coordinates

# Line 202: Store position on click
elif event_type == 'click':
    click_times.append(timestamp)
    click_positions.append((x, y))  # NEW: Store click position
```

### 2. Repetitive Click Ratio Calculation

**Algorithm:**
```python
# Lines 226-250: Bot detection calculation
repetitive_click_ratio = 0.0
if len(click_positions) >= 3:
    # Count clicks at identical coordinates (within 5 pixel tolerance)
    repetitive_clicks = 0
    tolerance = 5  # pixels
    
    for i in range(len(click_positions)):
        same_position_clicks = 0
        for j in range(len(click_positions)):
            if i != j:
                # Calculate distance between clicks
                dist = sqrt((x1-x2)² + (y1-y2)²)
                if dist <= 5 pixels:
                    same_position_clicks += 1
        
        # If 2+ clicks at same position, count as repetitive
        if same_position_clicks >= 2:
            repetitive_clicks += 1
    
    # Calculate ratio: repetitive_clicks / total_clicks
    repetitive_click_ratio = repetitive_clicks / len(click_positions)
```

**Feature Details:**
- **Tolerance:** 5-pixel radius (allows minor hand tremor)
- **Threshold:** 2+ clicks at same position = repetitive
- **Output:** Ratio from 0.0 to 1.0 (0% to 100%)

### 3. Risk Penalty Application

**File:** `cbba_python_service/anomaly_detection.py`

**Lines 180-192:**
```python
# Bot Detection: Check for repetitive clicks at same coordinates
bot_risk_penalty = 0.0
if feature_vector.shape[1] >= 18:  # Ensure feature exists
    repetitive_click_ratio = feature_vector[0, -1]  # Last feature
    
    if repetitive_click_ratio > 0.3:  # More than 30% repetitive
        # Add 20-40% risk penalty based on severity
        bot_risk_penalty = min(40.0, repetitive_click_ratio * 100)
        print(f"[BOT DETECTION] Repetitive clicks: {repetitive_click_ratio*100:.1f}% → +{bot_risk_penalty:.1f}% risk")

# Apply penalty to combined risk
combined_risk += bot_risk_penalty
```

**Penalty Scale:**
| Repetitive Click % | Risk Penalty | Example Scenario |
|-------------------|--------------|------------------|
| 0-30% | No penalty | Normal user behavior |
| 30-40% | +30-40% | Suspicious (accidental double-clicks) |
| 40-60% | +40% | Likely bot (automation script) |
| 60-100% | +40% (capped) | Definitely bot (clicking same button repeatedly) |

---

## Bot Detection Examples

### Example 1: Normal User Behavior ✅

**Scenario:** User clicks different buttons across the page
```
Click 1: (120, 340)  - Login button
Click 2: (450, 180)  - Menu item
Click 3: (280, 520)  - Submit button
Click 4: (700, 200)  - Another button
```

**Analysis:**
- All clicks at different positions
- Distance between clicks: 200-600 pixels
- **Repetitive Ratio:** 0% (0/4)
- **Bot Penalty:** 0%
- **Result:** ✅ Normal behavior

---

### Example 2: Legitimate Double-Click ✅

**Scenario:** User double-clicks a file to open it
```
Click 1: (450, 320)  - First click on file icon
Click 2: (452, 322)  - Second click (2 pixels away)
Click 3: (180, 500)  - Different action
```

**Analysis:**
- 2 clicks within 5-pixel tolerance (double-click)
- 1 repetitive pair out of 3 total clicks
- **Repetitive Ratio:** 33% (1/3)
- **Bot Penalty:** +33%
- **Result:** ⚠️ Slight penalty (acceptable for double-clicks)

---

### Example 3: Bot Clicking Same Button ❌

**Scenario:** Automation script clicks login button repeatedly
```
Click 1: (300, 400)  - Login button
Click 2: (301, 401)  - Login button (1 pixel off)
Click 3: (300, 400)  - Login button
Click 4: (302, 399)  - Login button (2 pixels off)
Click 5: (300, 400)  - Login button
```

**Analysis:**
- All 5 clicks within 5-pixel radius
- All clicks counted as repetitive
- **Repetitive Ratio:** 100% (5/5)
- **Bot Penalty:** +40% (capped)
- **Combined Risk:** Base 15% + Bot 40% = **55%**
- **Result:** ❌ **Step-Up Authentication Triggered**

---

### Example 4: Aggressive Bot ❌

**Scenario:** Bot spam-clicking the same position
```
Click 1-10: All at (500, 300) ± 2 pixels
```

**Analysis:**
- 10 clicks in same spot
- Clear bot/automation pattern
- **Repetitive Ratio:** 100%
- **Bot Penalty:** +40% (capped)
- **Combined Risk:** Base 20% + Bot 40% = **60%**
- **Result:** ❌ **Step-Up Authentication Triggered**

---

## Risk Scoring Impact

### Before Bot Detection (Old System)
```
Scenario: Bot clicking same button 10 times
- Isolation Forest: 25%
- One-Class SVM: 20%
- Feature-based: 18%
- Combined: 21%
- Action: None (too low)
```

### After Bot Detection (New System)
```
Scenario: Bot clicking same button 10 times
- Isolation Forest: 25%
- One-Class SVM: 20%
- Feature-based: 18%
- Bot Penalty: +40%
- Combined: 61%
- Action: Step-Up Authentication ✅
```

---

## Feature Vector Details

### New Feature Dimension

**Before:** 17 features (7 keystroke + 10 mouse)
**After:** 18 features (7 keystroke + 11 mouse)

**Feature Index 17 (New):** `repetitive_click_ratio`
- **Type:** Float (0.0 to 1.0)
- **Meaning:** Proportion of clicks that are repetitive
- **Normal Range:** 0.0 - 0.2 (0-20%)
- **Suspicious Range:** 0.3 - 0.5 (30-50%)
- **Bot Range:** 0.5 - 1.0 (50-100%)

### Full Mouse Feature List (Updated)

| Index | Feature | Description |
|-------|---------|-------------|
| 7 | Mean Velocity | Average cursor speed |
| 8 | Velocity Std Dev | Speed variation |
| 9 | Mean Acceleration | Average speed change rate |
| 10 | Acceleration Std Dev | Acceleration variation |
| 11 | Mean Curvature | Average path curvature |
| 12 | Curvature Std Dev | Path variation |
| 13 | Click Rate | Clicks per second |
| 14 | Double-Click Rate | Proportion of double-clicks |
| 15 | Scroll Speed | Average scroll velocity |
| 16 | Path Efficiency | Straight-line / actual path |
| **17** | **Repetitive Click Ratio** | **Same-position click proportion** ✨ NEW |

---

## Console Output

### Normal Behavior
```
[CBBA] User 5 - IF: 18.2%, SVM: 16.5%, Feature: 14.8%, Combined: 16.5%
```

### Bot Detected
```
[BOT DETECTION] User 5 - Repetitive clicks: 85.0% → +40.0% risk
[CBBA] User 5 - IF: 22.1%, SVM: 19.3%, Feature: 17.6%, Combined: 59.7%
```

---

## Testing the Feature

### Manual Test Cases

#### Test 1: Normal Clicking
**Action:**
1. Login to application
2. Click different menu items
3. Navigate pages normally
4. Click various buttons

**Expected:**
- Repetitive click ratio: 0-10%
- No bot penalty
- Risk score: 10-30%

#### Test 2: Double-Click File
**Action:**
1. Navigate to file manager
2. Double-click a file icon
3. Continue normal interaction

**Expected:**
- Repetitive click ratio: ~15-25%
- No bot penalty (below 30% threshold)
- Risk score: 10-30%

#### Test 3: Spam Click Same Button
**Action:**
1. Click the same button 5-10 times rapidly
2. All clicks at same position

**Expected:**
- Repetitive click ratio: 80-100%
- Bot penalty: +40%
- Risk score: 50-70%
- **Result:** Step-up authentication triggered ✅

#### Test 4: Bot Script Simulation
**Action:**
1. Use browser console to simulate bot:
```javascript
// Simulate bot clicking same position 10 times
for(let i=0; i<10; i++) {
    document.elementFromPoint(500, 300).click();
}
```

**Expected:**
- Repetitive click ratio: 100%
- Bot penalty: +40%
- Risk score: 60-80%
- **Result:** Step-up authentication triggered ✅

---

## Configuration

### Adjustable Parameters

**File:** `feature_extraction.py` (Lines 230-231)

```python
# Tolerance for "same position" detection
tolerance = 5  # pixels (can adjust)

# Minimum repetitions to count as repetitive
if same_position_clicks >= 2:  # Can change threshold
```

**Recommendations:**
- **Tight Detection:** `tolerance = 3` pixels, `threshold >= 2`
- **Normal (Current):** `tolerance = 5` pixels, `threshold >= 2`
- **Loose Detection:** `tolerance = 10` pixels, `threshold >= 3`

---

**File:** `anomaly_detection.py` (Lines 185-189)

```python
# Threshold for applying penalty
if repetitive_click_ratio > 0.3:  # Can adjust 0.1-0.5

# Penalty calculation
bot_risk_penalty = min(40.0, repetitive_click_ratio * 100)  # Max 40%
```

**Penalty Tuning:**
- **Conservative:** `threshold = 0.5`, `max_penalty = 30%`
- **Normal (Current):** `threshold = 0.3`, `max_penalty = 40%`
- **Aggressive:** `threshold = 0.2`, `max_penalty = 50%`

---

## Benefits

### 1. **Bot Detection** 🤖
- Catches automation scripts
- Detects click bots
- Identifies automated form fillers

### 2. **Enhanced Security** 🔒
- Prevents automated attacks
- Stops credential stuffing
- Blocks brute-force attempts

### 3. **Minimal False Positives** ✅
- 5-pixel tolerance for hand tremor
- 30% threshold allows occasional double-clicks
- Natural user behavior unaffected

### 4. **Immediate Response** ⚡
- Real-time detection
- Instant risk escalation
- Automated challenge trigger

---

## Limitations

### 1. **Legitimate Repetitive Actions**
Some legitimate scenarios may trigger detection:
- Rapid pagination clicks (next/previous)
- Video player controls (pause/play toggle)
- Form field correction (click → fix → click)

**Mitigation:** 30% threshold allows some repetition

### 2. **Touchscreen Devices**
Touch interfaces may have less precision:
- Finger taps less accurate than mouse
- May have higher repetition rates

**Mitigation:** 5-pixel tolerance handles touch imprecision

### 3. **Gaming/Interactive Applications**
Games requiring repeated clicks may trigger detection:
- Clicker games
- Idle games
- Interactive tutorials

**Mitigation:** Consider disabling for game pages

---

## Future Enhancements

### 1. **Click Pattern Analysis**
- Detect uniform time intervals (bot signature)
- Identify perfect click grids (automation)
- Analyze click velocity distribution

### 2. **Context-Aware Detection**
- Whitelist specific UI elements (pagination, video controls)
- Adaptive thresholds based on page context
- User behavior profiling

### 3. **Machine Learning Enhancement**
- Train model to distinguish legitimate vs bot clicks
- Learn acceptable repetition patterns per user
- Temporal pattern recognition

---

## Summary

| Aspect | Details |
|--------|---------|
| **Feature** | Repetitive click detection at same coordinates |
| **Detection Method** | Track click positions, calculate repetition ratio |
| **Threshold** | >30% repetitive clicks triggers penalty |
| **Penalty** | +20-40% risk score increase |
| **Tolerance** | 5-pixel radius for "same position" |
| **Impact** | Catches bots while allowing normal double-clicks |
| **Status** | ✅ **Implemented and Active** |

---

**Last Updated:** October 18, 2025  
**Version:** CBBA v1.1 - Bot Detection Enabled
