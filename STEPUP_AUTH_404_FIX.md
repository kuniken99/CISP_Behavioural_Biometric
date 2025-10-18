# StepUpAuth 404 Error Fix - Complete Solution

## Problem Analysis

### Error Message:
```
POST http://localhost:5000/api/TwoFactor/verify-moderate-risk 404 (Not Found)
```

### Root Causes:
1. ✅ **Case sensitivity issue** - Fixed: Changed `TwoFactor` to `twofactor` (lowercase)
2. ⚠️ **Backend server not running** - Exit Code: 1 (crashed)
3. ✅ **Endpoint exists** - Confirmed at line 257 in TwoFactorController.cs

## Fixes Applied

### 1. Frontend Endpoint URL ✅
**File**: `StepUpAuth.js`

Changed from:
```javascript
fetch(`${API_BASE_URL}/api/TwoFactor/verify-moderate-risk`, {
```

To:
```javascript
fetch(`${API_BASE_URL}/api/twofactor/verify-moderate-risk`, {
```

**Reason**: Match the working pattern in `TwoFactorLoginPage.js` which uses lowercase `twofactor`

## How to Fix and Test

### Step 1: Start Backend Server (IMPORTANT!)
```powershell
cd e:\CISP_Behavioural_Biometric\backend
dotnet run
```

**Expected Output:**
```
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: http://localhost:5000
info: Microsoft.Hosting.Lifetime[0]
      Application started. Press Ctrl+C to shut down.
```

If you get errors:
```powershell
# Clean and rebuild
dotnet clean
dotnet build
dotnet run
```

### Step 2: Verify Backend is Running
Open browser and go to:
```
http://localhost:5000/api/twofactor
```

You should see a response (even if it's an error, that confirms the server is running)

### Step 3: Check Database Connection
The backend might crash if database connection fails. Check `appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=db_biometrics_mvp;..."
  }
}
```

### Step 4: Test the Flow

1. **Login** with your credentials
2. **Trigger moderate risk** (50-79% risk score)
3. **StepUpAuth modal appears**
4. **Open Google Authenticator** on your phone
5. **Enter the 6-digit code**
6. **Click Verify**

### Step 5: Check Console Logs

**Browser Console (should show)**:
```javascript
[CBBA] Submitting verification code: {
  codeLength: 6,
  riskScore: 65,
  endpoint: "http://localhost:5000/api/twofactor/verify-moderate-risk"
}
[CBBA] Moderate risk verification successful: { success: true, ... }
```

**Backend Console (should show)**:
```
info: Moderate risk verification attempt - Code length: 6, RiskScore: 65
info: Validating TOTP code for user 5 (Username: tank108)
info: Moderate risk verification successful for user 5
```

## Common Issues and Solutions

### Issue 1: Still Getting 404
**Solution**: 
- Backend server crashed or not started
- Check terminal for error messages
- Run `dotnet run` again

### Issue 2: Backend Won't Start
**Possible causes**:
1. **Port 5000 already in use**
   ```powershell
   netstat -ano | findstr :5000
   taskkill /PID <process_id> /F
   ```

2. **Database connection failed**
   - Check SQL Server is running
   - Verify connection string in appsettings.json
   - Run migrations: `dotnet ef database update`

3. **Compilation errors**
   ```powershell
   dotnet clean
   dotnet restore
   dotnet build
   ```

### Issue 3: Unauthorized (401) Error
**Solution**: 
- JWT token expired or invalid
- Logout and login again
- Check token in localStorage:
  ```javascript
  console.log(localStorage.getItem('jwt_token'));
  ```

### Issue 4: Code Validation Fails
**Solution**:
- Check time synchronization (phone and server)
- Try a fresh code (wait 30 seconds for new code)
- Verify 2FA is properly set up
- Check backend logs for detailed error

## Testing Checklist

- [ ] Backend server running (check http://localhost:5000)
- [ ] Python CBBA service running (check http://localhost:5001)
- [ ] Frontend running (npm start)
- [ ] Logged in successfully
- [ ] JWT token in localStorage
- [ ] Google Authenticator app set up
- [ ] Risk score triggers modal (50-79%)
- [ ] Can enter 6-digit code
- [ ] Verification succeeds
- [ ] Modal closes after success

## Full Restart Commands

### Terminal 1 - Backend
```powershell
cd e:\CISP_Behavioural_Biometric\backend
dotnet clean
dotnet run
```

### Terminal 2 - Python CBBA Service
```powershell
cd e:\CISP_Behavioural_Biometric\cbba_python_service
python app.py
```

### Terminal 3 - Frontend
```powershell
cd e:\CISP_Behavioural_Biometric\frontend
npm start
```

## Files Modified

1. ✅ `frontend/src/components/security/StepUpAuth.js` - Fixed endpoint URL to lowercase
2. ✅ `backend/Controllers/TwoFactorController.cs` - Fixed ValidateCode → ValidateTotp
3. ✅ Added detailed logging to both frontend and backend

## Expected Behavior After Fix

### Success Flow:
1. User triggers moderate risk (50-79%)
2. StepUpAuth modal appears with warning icon
3. User opens Google Authenticator
4. User enters valid 6-digit code
5. Click "Verify" button
6. Frontend sends POST to `/api/twofactor/verify-moderate-risk`
7. Backend validates code using `ValidateTotp()`
8. Backend returns 200 OK with success message
9. Modal closes, user continues working
10. Audit log created in database

### Failure Flow:
1. Invalid code entered
2. Backend returns 400 Bad Request
3. Error message shown: "Invalid verification code. Please try again."
4. Input cleared, auto-focused
5. User can try again (3 attempts total)
6. After 3 failures, user logged out

## Next Steps if Still Not Working

1. **Capture full error logs**:
   - Backend terminal output
   - Browser console output
   - Network tab (check request/response)

2. **Check endpoint directly**:
   ```powershell
   # Test if backend is running
   curl http://localhost:5000/api/twofactor
   ```

3. **Verify JWT token**:
   ```javascript
   // In browser console
   const token = localStorage.getItem('jwt_token');
   console.log('Token exists:', !!token);
   console.log('Token length:', token?.length);
   ```

4. **Test with Postman**:
   - POST to `http://localhost:5000/api/twofactor/verify-moderate-risk`
   - Headers: `Authorization: Bearer YOUR_JWT_TOKEN`
   - Body: `{ "code": "123456", "riskScore": 65 }`

The main issue is the backend server not running (Exit Code: 1). Once you restart it with `dotnet run`, the StepUpAuth should work correctly! 🎯
