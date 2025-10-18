# SessionLock Refresh Bypass Fix - Testing Guide

## 🔧 What Was Fixed

### The Problem:
- User sees SessionLock modal at 80%+ risk
- User refreshes the page (F5)
- Modal disappears ❌
- User can access the system freely (SECURITY VULNERABILITY)

### The Solution:
**Backend Changes** (`BiometricController.cs`):
1. Added `IsLocked` flag in session when risk >= 80%
2. Store `LockStartTime` and `LockDuration` in session
3. Updated `/api/biometric/session-risk-state` to return lock info
4. Added `/api/biometric/clear-lock` endpoint to clear lock after timeout

**Frontend Changes** (`App.js`):
1. Check for `data.isLocked` on page load
2. Restore SessionLock modal if lock is active
3. Show appropriate modal based on session state

**SessionLock Component**:
1. Call `/api/biometric/clear-lock` when timer expires
2. Clear backend session along with localStorage

## 🧪 How to Test

### Test 1: SessionLock Appears on High Risk
1. **Login** to the application
2. **Wait 2-3 seconds** for CBBA assessment
3. **Expected**: SessionLock modal appears (85% risk override active)
4. **Verify**: Modal shows with 15:00 countdown

### Test 2: SessionLock Persists on Refresh (CRITICAL FIX)
1. **With SessionLock showing**, press **F5** or **Ctrl+R** to refresh
2. **Expected**: Modal **reappears immediately** after page loads
3. **Verify**: Countdown continues from where it was
4. **Try multiple times**: Refresh 3-4 times, modal should always return

### Test 3: SessionLock Persists on Tab Close/Reopen
1. **With SessionLock showing**, close the browser tab
2. **Reopen** the application URL in a new tab
3. **Expected**: SessionLock modal **appears immediately**
4. **Verify**: Lock is still active

### Test 4: SessionLock Persists on Browser Restart
1. **With SessionLock showing**, close entire browser
2. **Reopen browser** and navigate to the application
3. **Expected**: SessionLock modal **appears immediately**
4. **Verify**: Session persists across browser restarts

### Test 5: Lock Expires After Countdown
1. **Wait for timer** to count down to 0:00
2. **Expected**: User is logged out automatically
3. **Verify**: Redirected to login page

### Test 6: StepUpAuth Still Works (50-79%)
1. **Remove the 85% override** from `cbba_service.py`
2. **Force 60% risk** (moderate)
3. **Expected**: StepUpAuth modal appears (Google Authenticator)
4. **Refresh page**: StepUpAuth should also persist

## 🔍 Browser Console Logs

### On Page Load (Without Lock):
```
[CBBA] Session risk state on page load: {success: false, message: "No risk state found"}
```

### On Page Load (With Lock Active):
```
[CBBA] Session risk state on page load: {
  success: true,
  riskScore: 85,
  isLocked: true,
  lockStartTime: "2025-10-18T14:30:00.000Z",
  lockDuration: 15
}
[CBBA] Session is locked - showing SessionLock modal
[SessionLock] Component rendered - show: true, riskScore: 85
[SessionLock] Modal is showing - initializing lock
```

### When Lock Expires:
```
[SessionLock] Lock cleared from backend session
```

## 🎯 Success Criteria

✅ **Test PASSES if**:
1. SessionLock modal appears at 85% risk
2. Pressing F5 **DOES NOT** close the modal
3. Modal **reappears** after refresh
4. Closing/reopening tab **DOES NOT** bypass lock
5. Timer continues counting down correctly
6. After 15 minutes, user is logged out

❌ **Test FAILS if**:
1. Refresh closes the modal
2. User can access system after refresh
3. Modal doesn't reappear on new tab
4. Timer resets to 15:00 on refresh

## 🔐 Security Implications

### Before Fix (VULNERABLE):
```
User Activity → 85% Risk → SessionLock Shows
         ↓
User Presses F5
         ↓
Modal Disappears ❌
         ↓
User Has Full Access (BREACH!)
```

### After Fix (SECURE):
```
User Activity → 85% Risk → SessionLock Shows
         ↓                      ↓
Backend Stores Lock ----→ Session: isLocked=true
         ↓
User Presses F5
         ↓
Frontend Checks Session
         ↓
Modal Reappears ✅
         ↓
User Still Locked (SECURE!)
```

## 📊 Backend Session Storage

When risk >= 80%, backend stores:
```csharp
HttpContext.Session.SetString("IsLocked", "true");
HttpContext.Session.SetString("LockStartTime", "2025-10-18T14:30:00.000Z");
HttpContext.Session.SetString("LockDuration", "15");
HttpContext.Session.SetInt32("RiskScore", 85);
HttpContext.Session.SetString("Action", "lock");
```

Frontend checks on page load:
```javascript
const response = await fetch('/api/biometric/session-risk-state');
const data = await response.json();

if (data.isLocked) {
  setShowSessionLock(true); // Modal reappears!
}
```

## 🚀 Ready to Test!

1. **Backend**: Running with session lock persistence ✅
2. **Python**: Running with 85% override ✅
3. **Frontend**: Start it and test!

```powershell
cd e:\CISP_Behavioural_Biometric\frontend
npm start
```

Then login and try refreshing the page - the SessionLock modal should **persist**! 🎉

## 🔄 After Testing

To remove the test override and return to normal:
1. Open `cbba_service.py`
2. Delete lines 96-97: `risk_score = 85.0` and the comment
3. Restart Python service
4. Risk scores will be dynamic again
