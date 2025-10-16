# Session Timeout Testing Guide - 1 Minute Configuration

## ⏱️ Current Test Configuration

All session timeout settings have been temporarily changed to **1 minute** for easy testing:

### Frontend Settings (`SessionManager.js`)
```javascript
const SESSION_TIMEOUT = 1 * 60 * 1000;      // 1 minute (normally 15 minutes)
const WARNING_TIME = 15 * 1000;             // 15 seconds (normally 60 seconds)
const ACTIVITY_CHECK_INTERVAL = 1000;       // 1 second (normally 5000ms)
const ACTIVITY_THROTTLE = 1000;             // 1 second (normally 2000ms)
```

### Backend Settings
- **SessionTrackingMiddleware.cs**: `TimeSpan.FromMinutes(1)` (normally 15)
- **AuthController.cs**: JWT token expires in `1 minute` (normally 15)

---

## 🧪 Testing Instructions

### Test 1: Warning Dialog Appears at 45 Seconds
1. Open http://localhost:3000 in your browser
2. Login with your credentials
3. **Stay idle** (don't move mouse or type)
4. **At 45 seconds**: Warning dialog should appear
5. ✅ **Expected**: Dialog shows countdown from 15 seconds
6. ✅ **Expected**: Progress bar animates smoothly (no blinking)

### Test 2: Extend Session
1. Follow Test 1 to trigger the warning
2. **Click "Extend Session"** before timeout
3. ✅ **Expected**: Dialog closes immediately
4. ✅ **Expected**: Timer resets to 1 minute
5. ✅ **Expected**: You can continue working

### Test 3: Auto-Logout on Timeout
1. Login and stay idle
2. When warning appears at 45 seconds, **don't click anything**
3. Wait for countdown to reach 0
4. ✅ **Expected**: Automatic logout at 1 minute
5. ✅ **Expected**: Redirected to login page
6. ✅ **Expected**: Message: "Your session has expired due to inactivity"
7. ✅ **Expected**: localStorage cleared (token removed)

### Test 4: Activity Keeps Session Alive
1. Login to the application
2. **Every 30 seconds, perform an action**:
   - Click somewhere on the page
   - Type in an input field
   - Click a menu item
3. ✅ **Expected**: No warning appears as long as you're active
4. ✅ **Expected**: Session stays active indefinitely with activity

### Test 5: Manual Logout Clears Session
1. Login to the application
2. Click the "Logout" button (don't wait for timeout)
3. ✅ **Expected**: Immediately redirected to login
4. ✅ **Expected**: Message: "You have been logged out successfully"
5. ✅ **Expected**: Server-side session removed
6. ✅ **Expected**: localStorage and sessionStorage cleared

### Test 6: Token Expiration Validation
1. Login to the application
2. Open Browser DevTools (F12) → Console
3. Wait for 1 minute (stay idle)
4. Try to make an API call or navigate
5. ✅ **Expected**: Frontend detects expired JWT token
6. ✅ **Expected**: Automatic logout before making invalid API call

### Test 7: Server-Side Session Enforcement
1. Login to the application
2. Copy the JWT token from localStorage (DevTools → Application → Local Storage)
3. Wait for 1 minute idle
4. Try to make a manual API request with the old token (using Postman or curl)
5. ✅ **Expected**: Server returns 401 Unauthorized
6. ✅ **Expected**: Response includes `sessionExpired: true`

---

## 📊 Expected Timeline

| Time | Event | What You Should See |
|------|-------|---------------------|
| 0:00 | Login | Dashboard loads, session starts |
| 0:30 | (Activity) | Click/type keeps session alive |
| 0:45 | Warning | Dialog appears with 15-second countdown |
| 0:50 | (Optional) | Click "Extend Session" to reset |
| 1:00 | Timeout | Auto-logout, redirect to login |

---

## 🔍 What to Look For

### ✅ Good Behaviors
- [ ] No page refreshes or blinking text
- [ ] Smooth countdown animation
- [ ] Progress bar transitions smoothly
- [ ] Dialog appears exactly at 45 seconds
- [ ] Logout happens exactly at 60 seconds
- [ ] All storage cleared on logout
- [ ] Server rejects expired sessions

### ❌ Issues to Watch For
- Page refreshing automatically
- Text or UI elements flickering
- Warning appearing at wrong time
- Countdown jumping or freezing
- Session not extending when clicked
- Storage not cleared after logout
- Server accepting expired tokens

---

## 🎯 Key Features Being Tested

1. **Client-Side Timer**: SessionManager tracks inactivity
2. **Server-Side Validation**: Middleware enforces timeout
3. **JWT Synchronization**: Token expires with session
4. **Warning System**: Advance notice before logout
5. **Activity Detection**: Mouse/keyboard resets timer
6. **Clean Logout**: All data cleared properly
7. **User Experience**: No blinking, smooth animations

---

## 🔄 Restore Production Settings

**IMPORTANT**: After testing, change back to production values:

### Frontend (`SessionManager.js`)
```javascript
const SESSION_TIMEOUT = 15 * 60 * 1000;     // 15 minutes
const WARNING_TIME = 60 * 1000;             // 60 seconds
const ACTIVITY_CHECK_INTERVAL = 5000;       // 5 seconds
const ACTIVITY_THROTTLE = 2000;             // 2 seconds
```

### Backend
- **SessionTrackingMiddleware.cs**: `TimeSpan.FromMinutes(15)`
- **AuthController.cs**: `DateTime.Now.AddMinutes(15)`

---

## 🚀 Current Status

✅ **Frontend**: Running on http://localhost:3000
✅ **Backend**: Running on http://localhost:5000
✅ **Configuration**: 1-minute timeout active
✅ **Ready for Testing**: Yes!

---

## 📝 Testing Checklist

- [ ] Test 1: Warning at 45 seconds ✓
- [ ] Test 2: Extend session works ✓
- [ ] Test 3: Auto-logout at 60 seconds ✓
- [ ] Test 4: Activity keeps alive ✓
- [ ] Test 5: Manual logout works ✓
- [ ] Test 6: Token validation ✓
- [ ] Test 7: Server enforcement ✓
- [ ] No blinking or refreshing ✓
- [ ] Smooth animations ✓
- [ ] Storage cleared properly ✓

---

**Happy Testing! 🎉**

*Remember: This is a 1-minute configuration for TESTING ONLY. Production should use 15 minutes.*
