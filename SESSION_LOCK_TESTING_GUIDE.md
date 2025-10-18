# SessionLock Modal Testing Guide

## 🎯 Current Status
- ✅ Backend: Running with session middleware configured
- ✅ Python Service: Running with **85% risk score override** active
- ✅ Frontend: Must be started to test

## 🚀 Steps to Test SessionLock Modal

### Step 1: Start the Frontend
```powershell
cd e:\CISP_Behavioural_Biometric\frontend
npm start
```
Wait for it to open `http://localhost:3000`

### Step 2: Login
- Navigate to `http://localhost:3000/login`
- Login with your credentials (e.g., username: tank108)
- You should be redirected to the dashboard

### Step 3: Trigger CBBA Assessment
The CBBA monitor runs automatically, but to force an immediate check:
- Move your mouse around
- Click on any menu item
- Type in any input field
- Wait 2-3 seconds

### Step 4: SessionLock Should Appear! 🛡️

You should see a full-screen modal with:

#### Visual Elements:
- ❌ **Red shield icon** with X and pulsing animation
- 🔴 **Red/pink theme** throughout
- 📱 **Full-screen overlay** with blurred background
- ⏱️ **Countdown timer** starting at 15:00

#### Content:
```
Account Temporarily Locked

Your account has been locked due to suspicious activity detected.
This is a security measure to protect your account.

⏱️ Lockout Duration
   15:00
   minutes remaining

Threat Details:
• Multiple failed login attempts
• Login from unusual location
• Suspicious device fingerprint

[📞 Contact Support]

If you believe this is an error, please contact our security team.
Session ID: XXX • Username: tank108

🔒 Protected by CBBA Security
```

### Step 5: Test Modal Behavior

#### ✅ What SHOULD Work:
1. **Modal persists on refresh** - Press F5 or Ctrl+R, modal should reappear
2. **Cannot close modal** - No X button, ESC key disabled
3. **Countdown timer** - Should count down from 15:00
4. **Contact Support button** - Click to see support info
5. **Full screen blocking** - Cannot interact with anything behind modal

#### ❌ What SHOULD NOT Work:
1. **Clicking outside** - Should NOT close the modal
2. **ESC key** - Should NOT close the modal
3. **Browser back button** - Should NOT bypass the lock
4. **Refresh page** - Should NOT bypass the lock (FIXED!)

### Step 6: Check Browser Console

Open DevTools (F12) and look for these logs:
```
[CBBA] Session risk state: {success: true, riskScore: 85, ...}
[CBBA] Triggering session lock
```

### Step 7: Check Backend Logs

In the backend terminal, you should see:
```
warn: High risk detected for user tank108: 85% - Action: lock
```

### Step 8: Check Python Service Logs

In the Python terminal, you should see:
```
[CBBA] User tank108 - IF: 85.0%, SVM: 85.0%, Feature: 85.0%, Combined: 85.0%
```
(All values should be 85.0 due to the override)

## 🐛 Troubleshooting

### Modal Doesn't Show?
1. **Check Python service is running**: Should see "Running on http://127.0.0.1:5001"
2. **Check backend is running**: Should see "Now listening on: http://localhost:5000"
3. **Check frontend is running**: Should see "webpack compiled successfully"
4. **Check browser console**: Look for errors or CBBA logs
5. **Check risk score**: Open DevTools → Network → Look for `/api/biometric/assess` response

### Modal Shows But Disappears on Refresh?
- This was the bug we just fixed!
- Make sure backend has session middleware configured
- Check browser console for session check logs

### Wrong Risk Score Showing?
- The override is set to **85%** in `cbba_service.py` line 96-97
- If you see different scores, the Python service needs restarting

## 🧪 Testing Checklist

- [ ] Frontend started successfully
- [ ] Logged in to application
- [ ] SessionLock modal appeared automatically
- [ ] Modal shows red theme with shield icon
- [ ] Countdown timer counts down from 15:00
- [ ] Contact Support button shows alert
- [ ] Cannot close modal with ESC
- [ ] Cannot close modal by clicking outside
- [ ] **CRITICAL**: Modal persists when page is refreshed (F5)
- [ ] **CRITICAL**: Modal persists when tab is closed/reopened
- [ ] Backend logs show "High risk detected: 85%"
- [ ] Python logs show 85% risk score

## 📝 Expected vs Actual Results

### Expected Behavior (After Our Fix):
```
User Activity → 85% Risk → Modal Shows → User Refreshes → Modal PERSISTS ✅
```

### Old Behavior (Before Fix):
```
User Activity → 85% Risk → Modal Shows → User Refreshes → Modal GONE ❌
```

## 🎬 After Testing

### To Return to Normal Operation:
1. **Remove the test override**:
   - Open `cbba_service.py`
   - Delete lines 96-97: `# ⚠️ TESTING OVERRIDE...` and `risk_score = 85.0`
   - Save the file

2. **Restart Python service**:
   ```powershell
   # Stop current service (Ctrl+C)
   cd e:\CISP_Behavioural_Biometric\cbba_python_service
   python app.py
   ```

3. **Test normal risk detection**:
   - Risk scores should now be dynamic (0-100%)
   - StepUpAuth shows at 50-79%
   - SessionLock shows at 80%+

## 📊 What We Fixed

### Issue 1: Session Configuration Error ✅
**Problem**: Backend threw "Session has not been configured" error
**Solution**: Added `services.AddDistributedMemoryCache()` and `services.AddSession()` in Startup.cs

### Issue 2: Modal Bypass Vulnerability ✅
**Problem**: Users could bypass authentication by refreshing the page
**Solution**: 
- Store risk state in ASP.NET session (backend)
- Check session state on page load (frontend)
- Restore modal state after refresh

### Implementation:
1. **Backend** (`BiometricController.cs`):
   - Stores risk score, level, and auth requirement in `HttpContext.Session`
   - New endpoint: `/api/biometric/session-risk-state` to retrieve state
   - New endpoint: `/api/biometric/clear-auth-requirement` to clear after verification

2. **Frontend** (`App.js`):
   - `useEffect` hook checks session risk state on mount
   - Restores `showStepUpAuth` or `showSessionLock` based on session data
   - Prevents bypass vulnerability

## 🎉 Success Criteria

✅ **Test is successful if**:
1. SessionLock modal appears with 85% risk
2. Modal has correct red theme and content
3. Countdown timer works
4. **Modal persists after page refresh (CRITICAL FIX)**
5. Modal cannot be closed or bypassed
6. After 15 minutes (or manual logout), user is logged out

---

**Ready to test! Start the frontend and follow the steps above.** 🚀
