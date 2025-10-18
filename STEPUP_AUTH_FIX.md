# StepUpAuth Google Authenticator Fix

## Issues Found and Fixed

### 1. Backend Method Name Mismatch ✅
**Problem**: Controller was calling `ValidateCode()` but service only has `ValidateTotp()`

**Fix**: Changed in `TwoFactorController.cs` line 286:
```csharp
// Before:
var isValid = _twoFactorService.ValidateCode(user.TwoFactorAuth.SecretKey, dto.Code);

// After:
var isValid = _twoFactorService.ValidateTotp(user.TwoFactorAuth.SecretKey, dto.Code);
```

### 2. Enhanced Backend Logging ✅
**Added detailed logging to help debug**:
- Log when verification attempt starts
- Log user ID and username
- Log 2FA status
- Log validation results
- Log all error cases

**Location**: `TwoFactorController.cs` - `VerifyModerateRisk()` method

### 3. Frontend Code Cleaning ✅
**Improvements**:
- Remove all whitespace from code before sending
- Add console logging to show what's being sent
- Default riskScore to 0 if undefined
- Better error response logging

**Location**: `StepUpAuth.js` - `submitCode()` method

### 4. Shield Icon Fixed ✅
**Changed from emoji to SVG**:
```javascript
// Before:
<span className="stepup-shield-icon">🛡️</span>

// After:
<img src={shieldIcon} alt="Shield" className="stepup-shield-icon" />
```

## How to Test

### 1. Start Backend Server
```powershell
cd e:\CISP_Behavioural_Biometric\backend
dotnet run
```

### 2. Start Python CBBA Service
```powershell
cd e:\CISP_Behavioural_Biometric\cbba_python_service
python app.py
```

### 3. Start Frontend
```powershell
cd e:\CISP_Behavioural_Biometric\frontend
npm start
```

### 4. Test the Google Authenticator
1. Login to your account
2. Trigger moderate risk (50-79% risk score)
3. StepUpAuth modal should appear
4. Open Google Authenticator app on your phone
5. Enter the 6-digit code
6. Click "Verify"

### 5. Check Console Logs

**Frontend Console (Browser)**:
```
[CBBA] Submitting verification code: { codeLength: 6, riskScore: 65, endpoint: "..." }
[CBBA] Moderate risk verification successful: { success: true, ... }
```

**Backend Console (Terminal)**:
```
Moderate risk verification attempt - Code length: 6, RiskScore: 65
Validating TOTP code for user 5 (Username: tank108)
Moderate risk verification successful for user 5
```

## Expected Behavior

### Success Flow:
1. User enters valid 6-digit code from Google Authenticator
2. Frontend sends cleaned code to backend
3. Backend validates using `ValidateTotp()` with ±30 second window
4. Success response returned
5. Modal closes, user continues

### Failure Flow:
1. User enters invalid code
2. Backend returns 400 Bad Request with error message
3. Frontend displays error and clears input
4. User has 3 attempts total
5. After 3 failed attempts, user is logged out

## Validation Logic

The `ValidateTotp()` method:
- Accepts codes from current time window
- Accepts codes from 30 seconds ago (previous window)
- Accepts codes from 30 seconds ahead (next window)
- This gives ~90 second validity period total
- Handles time sync issues between devices

## Troubleshooting

### Code always fails:
1. **Check time sync**: Ensure server and phone have accurate time
2. **Check secret key**: Verify user has correct 2FA setup
3. **Check logs**: Look for detailed error messages in backend console
4. **Test with current code**: Generate new code and try immediately

### 404 Error:
- Backend server not running
- Wrong API_BASE_URL (should be http://localhost:5000)
- Check CORS configuration in Startup.cs

### Network Error:
- Backend or Python service crashed
- Check terminal outputs for errors
- Restart services

## Files Modified

1. `backend/Controllers/TwoFactorController.cs` - Fixed method name, added logging
2. `frontend/src/components/security/StepUpAuth.js` - Improved code cleaning, logging
3. `frontend/src/styles/StepUpAuth.css` - Shield icon styling

## Next Steps

If codes still fail:
1. Check backend logs for "Validating TOTP code" message
2. Verify the secret key is correctly stored in database
3. Test with a newly generated QR code
4. Ensure phone time is set to "Automatic" (network time)
5. Try generating a new code after the current one expires (30 seconds)
