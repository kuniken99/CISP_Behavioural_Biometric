# Production Scoring Restored

## Changes Made

Reverted anomaly detection scoring from "ultra-lenient" back to **PRODUCTION BALANCED** settings.

### File: `cbba_python_service/anomaly_detection.py`

---

## 1. Isolation Forest Contamination

**Reverted**: Lines 30-36

**Before** (Ultra-lenient):
```python
self.isolation_forest = IsolationForest(
    contamination=0.08,  # 8% outlier tolerance
    n_estimators=100,
    random_state=42,
    max_samples='auto'
)
```

**Now** (Production):
```python
self.isolation_forest = IsolationForest(
    contamination=0.1,  # 10% outlier tolerance - standard
    n_estimators=100,
    random_state=42,
    max_samples='auto'
)
```

---

## 2. One-Class SVM Nu Parameter

**Reverted**: Lines 38-43

**Before** (Ultra-lenient):
```python
self.one_class_svm = OneClassSVM(
    nu=0.08,  # Very relaxed boundary
    gamma='auto',
    kernel='rbf'
)
```

**Now** (Production):
```python
self.one_class_svm = OneClassSVM(
    nu=0.1,  # Standard boundary
    gamma='auto',
    kernel='rbf'
)
```

---

## 3. Isolation Forest Score Normalization

**Reverted**: Lines 230-250

**Before** (Ultra-lenient - too forgiving):
```python
if score >= 0.0:
    risk = max(0, 15 - score * 30)  # 0-15%
elif score >= -0.3:
    risk = 15 + (0.0 - score) * 66.7  # 15-35%
elif score >= -0.5:
    risk = 35 + (-0.3 - score) * 100  # 35-55%
elif score >= -0.7:
    risk = 55 + (-0.5 - score) * 100  # 55-75%
else:
    risk = 75 + max((-0.7 - score) * 125, 0)  # 75-100%
```

**Now** (Production - balanced):
```python
if score >= 0.3:
    risk = max(0, 20 - score * 40)  # 0-20% - Very normal
elif score >= 0.0:
    risk = 20 + (0.3 - score) * 66.7  # 20-40% - Normal
elif score >= -0.2:
    risk = 40 + (0.0 - score) * 100  # 40-60% - Slightly anomalous
elif score >= -0.4:
    risk = 60 + (-0.2 - score) * 100  # 60-80% - Moderately anomalous
else:
    risk = 80 + max((-0.4 - score) * 100, 0)  # 80-100% - Highly anomalous
```

---

## 4. SVM Score Normalization

**Reverted**: Lines 257-280

**Before** (Ultra-lenient - too forgiving):
```python
if score >= 0.5:
    risk = max(0, 12 - score * 8)  # 0-12%
elif score >= 0.0:
    risk = 12 + (0.5 - score) * 26  # 12-25%
elif score >= -0.5:
    risk = 25 + (0.0 - score) * 30  # 25-40%
elif score >= -1.0:
    risk = 40 + (-0.5 - score) * 40  # 40-60%
else:
    risk = 60 + max((-1.0 - score) * 40, 0)  # 60-100%
```

**Now** (Production - balanced):
```python
if score >= 1.0:
    risk = max(0, 15 - score * 10)  # 0-15% - Very normal
elif score >= 0.3:
    risk = 15 + (1.0 - score) * 28.6  # 15-35% - Normal
elif score >= 0.0:
    risk = 35 + (0.3 - score) * 50  # 35-50% - Slightly anomalous
elif score >= -0.5:
    risk = 50 + (0.0 - score) * 40  # 50-70% - Moderately anomalous
else:
    risk = 70 + max((-0.5 - score) * 20, 0)  # 70-100% - Highly anomalous
```

---

## 5. Feature-Based Risk Calculation

**Reverted**: Lines 315-325

**Before** (Ultra-lenient - too forgiving):
```python
# 0.0 - 3.0 std: Very similar (0-15% risk)
# 3.0 - 4.0 std: Similar (15-25% risk)
# 4.0 - 5.0 std: Moderate difference (25-40% risk)
# 5.0 - 7.0 std: Significant difference (40-60% risk)
# 7.0+ std: Very different (60-100% risk)

if std_distance < 3.0:
    risk = std_distance * 5.0  # 0-15%
elif std_distance < 4.0:
    risk = 15 + (std_distance - 3.0) * 10  # 15-25%
elif std_distance < 5.0:
    risk = 25 + (std_distance - 4.0) * 15  # 25-40%
elif std_distance < 7.0:
    risk = 40 + (std_distance - 5.0) * 10  # 40-60%
else:
    risk = 60 + min((std_distance - 7.0) * 20, 40)  # 60-100%
```

**Now** (Production - balanced):
```python
# 0.0 - 2.0 std: Very similar (0-20% risk)
# 2.0 - 3.0 std: Similar (20-35% risk)
# 3.0 - 4.0 std: Moderate difference (35-50% risk)
# 4.0 - 5.0 std: Significant difference (50-70% risk)
# 5.0+ std: Very different (70-100% risk)

if std_distance < 2.0:
    risk = std_distance * 10.0  # 0-20%
elif std_distance < 3.0:
    risk = 20 + (std_distance - 2.0) * 15  # 20-35%
elif std_distance < 4.0:
    risk = 35 + (std_distance - 3.0) * 15  # 35-50%
elif std_distance < 5.0:
    risk = 50 + (std_distance - 4.0) * 20  # 50-70%
else:
    risk = 70 + min((std_distance - 5.0) * 15, 30)  # 70-100%
```

---

## Impact on Risk Scoring

### Before (Ultra-Lenient)
- **Too forgiving**: Most behavior scored 0-15%
- **Too insensitive**: Real anomalies not detected
- **Issue**: System wouldn't catch suspicious behavior

### Now (Production Balanced)
- **Realistic range**: Normal behavior 15-35%
- **Sensitive to anomalies**: Suspicious behavior 50-70%
- **Balanced**: Works like `train_user.py` expects

---

## Expected Behavior After Changes

### Normal User Behavior
- **Risk Range**: 15-35% (was 0-15%)
- **Updates**: Every 3 seconds
- **Step-up Auth**: Only at 50%+ (moderate threshold)
- **Session Lock**: Only at 80%+ (high threshold)

### Suspicious Behavior
- **Fast typing** (10+ chars/sec): 40-60% risk
- **Erratic mouse** (2000+ px/sec): 50-70% risk
- **Automated patterns**: 70-90% risk

### Highly Anomalous (Attacks)
- **Bot-like typing** (20+ chars/sec): 80-95% risk
- **Cursor teleportation**: 85-100% risk
- **Consistent with attacker**: 90-100% risk

---

## Training Recommendations

### Use train_user.py for Production Training

The `train_user.py` script generates **realistic behavioral patterns** that match these production scoring thresholds:

```bash
cd E:\CISP_Behavioural_Biometric\cbba_python_service
python train_user.py
```

When prompted, enter username: `tank108`

**This will**:
- Generate 60 training sessions
- Each session has realistic keystroke (80-150ms dwell) and mouse (10-20px movements) patterns
- Train with PRODUCTION scoring (not ultra-lenient)
- Test normal behavior (should score 15-35%)
- Test anomalous behavior (should score 70-90%)

---

## Next Steps

1. **Restart Python service** to apply changes:
   ```bash
   # Stop old process
   Ctrl+C in Python service terminal
   
   # Start fresh
   cd E:\CISP_Behavioural_Biometric\cbba_python_service
   python app.py
   ```

2. **Retrain with production data**:
   ```bash
   python train_user.py
   # Enter: tank108
   ```

3. **Test in browser**:
   - Refresh browser (Ctrl+Shift+R)
   - Login as tank108
   - Normal behavior should show 15-35% risk
   - Fast/erratic behavior should show 50-70% risk

4. **Validate**:
   - Step-up auth should trigger at 50%+
   - Session lock should trigger at 80%+
   - Normal work should NOT trigger step-up

---

## Configuration Summary

| Parameter | Ultra-Lenient (Old) | Production (Now) |
|-----------|---------------------|------------------|
| **IF Contamination** | 0.08 | 0.1 |
| **SVM Nu** | 0.08 | 0.1 |
| **Normal Risk Range** | 0-15% | 15-35% |
| **Anomaly Detection** | 60%+ | 50%+ |
| **High Anomaly** | 75%+ | 70%+ |
| **Critical Anomaly** | 90%+ | 80%+ |

---

## Why This Is Better

1. **Matches train_user.py expectations**: The training script was designed for production scoring
2. **Realistic risk ranges**: 15-35% is normal, not 0-15%
3. **Better anomaly detection**: Can actually detect suspicious behavior
4. **Standard thresholds**: 50% step-up, 80% lock (industry standard)
5. **Balanced sensitivity**: Not too lenient, not too strict

---

**Status**: ✅ Production scoring restored  
**Next Action**: Restart Python service and retrain with `train_user.py`
