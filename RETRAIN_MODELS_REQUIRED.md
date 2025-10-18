# ⚠️ MODEL RETRAINING REQUIRED

## Why Retraining is Needed

The CBBA system feature vectors have been updated:
- **OLD**: 17 features (7 keystroke + 10 mouse)
- **NEW**: 23 features (10 keystroke + 13 mouse)

Old models trained with 17 features are **incompatible** and will cause errors.

## What Was Done

✅ Old models backed up to `cbba_python_service/old_models_backup/`
✅ Models directory cleared for fresh training
✅ System now running in "untrained" mode

## Current Behavior (Untrained Mode)

Without trained models, the system will:
- Return **moderate baseline risk scores** (around 40-50%)
- Still detect anomalies using default thresholds
- **NOT** trigger SessionLock at 75% anymore (all demo artifacts removed)

## How to Retrain Models

### Option 1: Train Specific User
```bash
cd cbba_python_service
python train_user.py --user-id <USER_ID>
```

Example:
```bash
python train_user.py --user-id tank108
```

### Option 2: Use Frontend Training (Recommended)

1. **Login** to your account
2. Navigate to **Settings** or **Security** page
3. Find **"Train Behavioral Model"** button
4. Click and wait for training to complete (collects 50+ samples)
5. Model will be saved automatically

### Option 3: Generate Training Data Script
```bash
cd cbba_python_service
python generate_training_data.py --user-id <USER_ID> --samples 100
```

## Training Requirements

- **Minimum Samples**: 50 behavioral samples
- **Recommended**: 100-200 samples for better accuracy
- **Optimal**: 500+ samples for production-grade accuracy

## Verify Training Success

After training, check:
```bash
ls cbba_python_service/models/
```

You should see:
```
user_<USER_ID>_model.pkl
```

## Expected Risk Scores After Training

### Normal Users
- **Baseline**: 5-25% risk score
- **Variation**: ±10% based on behavior consistency
- **Threshold**: Should stay well below 50%

### Fast but Legitimate Users
- **Baseline**: 25-40% risk score
- **Fast movements**: May spike to 45-48%
- **Threshold**: Should NOT trigger 50% StepUpAuth unless truly anomalous

### Attackers/Automated Behavior
- **Baseline**: 60-90% risk score
- **Fast movements (>1000 px/s)**: 70-95%
- **Rapid typing (>10 chars/sec)**: 65-85%
- **Threshold**: WILL trigger StepUpAuth (50%+) and potentially SessionLock (80%+)

## Troubleshooting

### Issue: Still Getting 75% Risk Score
**Cause**: Old browser session cache or stuck in error state
**Solution**:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Restart backend: `dotnet run` in backend folder
3. Restart Python service: `python app.py` in cbba_python_service folder
4. Hard refresh frontend: Ctrl+Shift+R

### Issue: Risk Score Stuck at 50%
**Cause**: Model not trained, using untrained fallback
**Solution**: Train your user model using one of the methods above

### Issue: Training Fails
**Cause**: Insufficient behavioral data
**Solution**: 
1. Use the application normally for 5-10 minutes
2. Type text, move mouse, click buttons
3. Try training again after collecting more data

### Issue: Risk Score Too High After Training
**Cause**: Training data doesn't match current behavior
**Solution**: Retrain with fresh behavioral samples that match your typical usage

## Files Changed

All demo/testing artifacts removed:
- ✅ Random variance removed (±20% swings)
- ✅ Score amplification removed (3x multiplier)
- ✅ Feature amplification removed (5x sensitivity)
- ✅ Normalization thresholds adjusted for natural scoring
- ✅ Model parameters tightened (contamination 0.1→0.02, nu 0.1→0.02)

## Production Status

System is now in **PRODUCTION MODE**:
- No artificial score inflation
- No random variance
- Strict outlier detection
- Velocity-based fast movement detection active
- Ready for real-world deployment after model training

## Next Steps

1. ⏳ **Retrain all user models** (REQUIRED)
2. ⏳ **Test with normal behavior** (should score <30%)
3. ⏳ **Test with fast movements** (should detect anomalies properly)
4. ⏳ **Monitor false positive rate** (target: <5%)
5. ⏳ **Fine-tune thresholds** if needed

---

**Last Updated**: October 18, 2025
**Models Backed Up**: `cbba_python_service/old_models_backup/`
**Service Status**: Running in untrained mode until retraining complete
