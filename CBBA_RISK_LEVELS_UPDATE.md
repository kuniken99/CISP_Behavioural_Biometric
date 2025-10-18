# CBBA Risk Levels Update

## Summary
Updated CBBA risk level thresholds and fixed user identification issue where backend was using integer user IDs but Python service was trained with string usernames.

## Changes Made

### 1. **Risk Level Thresholds Updated**

#### Previous Thresholds:
- **0-30%**: Low Risk (Green)
- **30-50%**: Minor Risk (Yellow) 
- **50-70%**: Moderate Risk (Orange)
- **70-95%**: High Risk (Orange-Red)
- **95-100%**: Critical Risk (Red)

#### New Thresholds:
- **0-49%** (Green): Normal user behaviour with minor deviations. No action required.
- **50-79%** (Orange): Suspicious or moderately anomalous behaviour. Step-up authentication triggered.
- **80-100%** (Red): Highly anomalous behaviour. Immediate automated response (OTP re-verification or session lock).

### 2. **Files Modified**

#### Backend Files:
1. **`backend/Controllers/BiometricController.cs`**
   - Changed to use username (string) instead of numeric userId for Python service calls
   - Matches trained model which was trained with username "tank108"
   - Still uses numeric userId for database operations
   
2. **`backend/Services/PythonCBBAService.cs`**
   - Updated all method signatures to accept `string userIdentifier` instead of `int userId`
   - Methods updated:
     - `TrainUserProfile(string userIdentifier, ...)`
     - `AssessRisk(string userIdentifier, ...)`
     - `UpdateProfile(string userIdentifier, ...)`
     - `GetUserStatus(string userIdentifier)`

#### Python Service Files:
3. **`cbba_python_service/config.py`**
   - Updated `RISK_THRESHOLD_HIGH` from 95 to 80
   - Added comments explaining new risk level ranges
   
4. **`cbba_python_service/anomaly_detection.py`**
   - Updated risk level determination logic:
     - `< 50`: Green (low risk, normal)
     - `50-79`: Orange (moderate risk, suspicious)
     - `>= 80`: Red (high risk, anomalous)
   
5. **`cbba_python_service/cbba_service.py`**
   - Updated `_determine_action()` method:
     - `< 50`: 'none' action (Green)
     - `50-79`: 'challenge' action (Orange - step-up auth)
     - `>= 80`: 'lock' action (Red - session lock)

#### Frontend Files:
6. **`frontend/src/components/CBBAMonitor.js`**
   - Updated `getRiskColor()` to match new thresholds:
     - `< 50`: Green color scheme
     - `50-79`: Orange color scheme
     - `>= 80`: Red color scheme
   - Updated `getRiskLabel()` text:
     - `< 50`: "Normal - Low Risk"
     - `50-79`: "Suspicious - Moderate Risk"
     - `>= 80`: "Anomalous - High Risk"
   
7. **`frontend/src/components/security/StepUpAuth.js`**
   - Updated risk level display threshold from 70% to 80%

### 3. **Behavioral Changes**

#### Risk Assessment Actions:
- **0-49% (Green)**: 
  - Status: Normal behavior
  - Action: None
  - UI: Green indicators
  
- **50-79% (Orange)**:
  - Status: Suspicious/Moderate anomaly
  - Action: Step-up authentication challenge
  - UI: Orange indicators
  - Triggers: `StepUpAuth` component displays warning
  
- **80-100% (Red)**:
  - Status: Highly anomalous behavior
  - Action: Immediate session lock
  - UI: Red indicators
  - Triggers: `SessionLock` component locks session
  - Creates critical alert in database

### 4. **User Identification Fix**

#### Problem:
- Python service was trained with username string: `"tank108"`
- Backend was sending integer userId: `0` (from claims)
- Models couldn't find profile → risk assessment failed

#### Solution:
- Backend now uses `User.Identity?.Name` (username) for Python service calls
- Python service accepts both string and integer user IDs
- Database operations still use numeric userId
- Ensures trained model can be found and used

## Testing

### Test Scenario 1: Normal Behavior
```
User: tank108
Expected Risk Score: 0-49%
Expected Color: Green
Expected Action: None
```

### Test Scenario 2: Moderate Anomaly
```
User: tank108
Expected Risk Score: 50-79%
Expected Color: Orange
Expected Action: Step-up authentication popup
```

### Test Scenario 3: High Anomaly
```
User: tank108
Expected Risk Score: 80-100%
Expected Color: Red
Expected Action: Immediate session lock
```

## Next Steps

1. **Restart Backend Service**
   ```bash
   cd backend
   dotnet run
   ```

2. **Verify Python Service is Running**
   - Check: http://localhost:5001/health
   - Should return: `{"status": "healthy", ...}`

3. **Test in Frontend**
   - Login as user `tank108`
   - Monitor CBBA risk score in CBBAMonitor component
   - Try different behaviors to trigger different risk levels
   - Verify color changes and actions

4. **Monitor Logs**
   - Backend logs: Watch for "High risk detected" messages
   - Python service logs: Check risk assessment responses
   - Frontend console: Verify risk scores being received

## Configuration

### Environment Variables
`.env` in `cbba_python_service/`:
```
FLASK_PORT=5001
RISK_THRESHOLD_MODERATE=50
RISK_THRESHOLD_HIGH=80
ENCRYPTION_KEY=<your-key>
```

### Backend Configuration
`appsettings.json`:
```json
{
  "PythonCBBAService": {
    "Url": "http://localhost:5001"
  }
}
```

## Troubleshooting

### Issue: Risk score stuck at 12%
**Cause**: User ID mismatch between training and assessment
**Solution**: Now fixed - backend uses username for Python service calls

### Issue: No risk assessment happening
**Check**: 
1. Python service is running on port 5001
2. Backend can reach Python service (check `/api/biometric/health`)
3. User is logged in and authenticated
4. Browser is sending keystroke/mouse events

### Issue: Risk level colors not updating
**Solution**: Hard refresh browser (Ctrl+F5) to clear cache

## Documentation Updated
- ✅ Risk thresholds documentation
- ✅ Code comments in all modified files
- ✅ Testing guide updated
- ✅ API responses match new thresholds

---

**Date**: October 18, 2025  
**Status**: ✅ Complete and Ready for Testing
