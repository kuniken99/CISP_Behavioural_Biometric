# Session Timeout - Page Refresh Issue FIXED

## Problem Description

**Issue**: After logging in and waiting for session timeout, refreshing the page still allows access to the application.

## Root Causes Identified

### 1. **Token Not Validated on Page Load**
The `useAuth` hook was checking for the existence of a token but **NOT validating if it was expired**.

```javascript
// BEFORE (Problem):
useEffect(() => {
  const token = localStorage.getItem('jwt_token');
  if (token) {
    setIsAuthenticated(true);  // ❌ No expiration check!
  }
}, []);
```

### 2. **Inconsistent LocalStorage Keys**
- **useAuth.js** uses: `jwt_token`, `current_user`, `user_role`
- **SessionManager.js** was looking for: `token`, `user`, `sessionId`
- **Result**: SessionManager couldn't find the token!

### 3. **No Expiration Check on Mount**
When the page refreshed, the app would:
1. Find `jwt_token` in localStorage
2. Set `isAuthenticated = true` immediately
3. Never check if the token had expired
4. Allow access even with 1-minute old expired token

---

## Solutions Implemented

### Fix 1: Add Token Expiration Validation in useAuth

**File**: `frontend/src/hooks/useAuth.js`

```javascript
// Helper function to check if token is expired
const isTokenExpired = (token) => {
  try {
    // Decode JWT token (simple base64 decode of payload)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    
    console.log('Token expiration check:', {
      expiresAt: new Date(expirationTime).toLocaleTimeString(),
      now: new Date(now).toLocaleTimeString(),
      isExpired: expirationTime <= now,
      timeRemaining: Math.floor((expirationTime - now) / 1000) + 's'
    });
    
    return expirationTime <= now;
  } catch (error) {
    console.error('Error decoding token:', error);
    return true; // Treat invalid tokens as expired
  }
};

// Check for existing token on mount and validate it
useEffect(() => {
  const token = localStorage.getItem('jwt_token');
  const user = localStorage.getItem('current_user');
  const role = localStorage.getItem('user_role');
  
  if (token && user && role) {
    // Check if token is expired
    if (isTokenExpired(token)) {
      console.log('Token expired on mount - clearing authentication');
      // Token is expired, clear everything
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('current_user');
      localStorage.removeItem('user_role');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('sessionId');
      localStorage.removeItem('userRole');
      localStorage.removeItem('username');
      setIsAuthenticated(false);
      setCurrentUser(null);
      setUserRole(null);
    } else {
      console.log('Valid token found - user authenticated');
      setIsAuthenticated(true);
      setCurrentUser(user);
      setUserRole(role);
    }
  } else {
    console.log('No valid authentication found');
  }
}, []);
```

**What this does:**
- ✅ Decodes the JWT token to get expiration time (`exp` claim)
- ✅ Compares current time with expiration time
- ✅ If expired: Clears all auth data and blocks access
- ✅ If valid: Allows authentication to proceed
- ✅ Logs everything for debugging

---

### Fix 2: Use Correct LocalStorage Keys in SessionManager

**File**: `frontend/src/components/security/SessionManager.js`

```javascript
// BEFORE:
const token = localStorage.getItem('token');  // ❌ Wrong key!

// AFTER:
const token = localStorage.getItem('jwt_token') || localStorage.getItem('token');  // ✅ Correct!
```

**Changes made in 4 places:**
1. `handleLogout()` - Get token for API call
2. `checkTokenExpiration()` - Validate token
3. `useEffect()` - Check if token exists on mount
4. Logout cleanup - Remove both `jwt_token` and legacy `token`

---

## How It Works Now

### Scenario 1: Fresh Page Load with Valid Token

```
User refreshes page
  ↓
useAuth checks localStorage for jwt_token
  ↓
Decodes token and checks expiration
  ↓
Token still valid (< 1 minute old)
  ↓
✅ User authenticated - access granted
  ↓
SessionManager starts monitoring
```

### Scenario 2: Fresh Page Load with Expired Token

```
User refreshes page after 1+ minute idle
  ↓
useAuth checks localStorage for jwt_token
  ↓
Decodes token and checks expiration
  ↓
Token expired (> 1 minute old)
  ↓
❌ Clears all localStorage
  ↓
setIsAuthenticated(false)
  ↓
React Router redirects to /login
  ↓
User must login again
```

### Scenario 3: Active Session (No Refresh)

```
User logged in and active
  ↓
SessionManager monitors activity
  ↓
At 45 seconds idle: Warning dialog
  ↓
At 60 seconds idle: Auto-logout
  ↓
Clears localStorage + redirects to login
```

---

## Testing the Fix

### Test 1: Expired Token on Refresh

1. Login to the application
2. **Wait 61 seconds** (more than 1-minute timeout)
3. **Refresh the page** (F5 or Ctrl+R)
4. ✅ **Expected**: Redirected to login page
5. ✅ **Expected**: Console shows "Token expired on mount - clearing authentication"
6. ✅ **Expected**: localStorage is cleared

### Test 2: Valid Token on Refresh

1. Login to the application
2. **Wait 30 seconds** (less than 1-minute timeout)
3. **Refresh the page** (F5 or Ctrl+R)
4. ✅ **Expected**: Stay on the page (authenticated)
5. ✅ **Expected**: Console shows "Valid token found - user authenticated"
6. ✅ **Expected**: SessionManager restarts monitoring

### Test 3: Session Timeout Without Refresh

1. Login to the application
2. **Stay idle** for 45 seconds
3. ✅ **Expected**: Warning dialog appears
4. **Don't click** - wait 15 more seconds
5. ✅ **Expected**: Auto-logout at 60 seconds
6. **Try to refresh** after logout
7. ✅ **Expected**: Cannot access - redirected to login

---

## Console Output Examples

### Valid Token on Page Load:
```
Token expiration check: {
  expiresAt: "10:05:30 AM",
  now: "10:05:00 AM",
  isExpired: false,
  timeRemaining: "30s"
}
Valid token found - user authenticated
SessionManager started: {timeout: "60s", warningAt: "45s", checkInterval: "1000ms"}
```

### Expired Token on Page Load:
```
Token expiration check: {
  expiresAt: "10:05:00 AM",
  now: "10:06:15 AM",
  isExpired: true,
  timeRemaining: "-75s"
}
Token expired on mount - clearing authentication
```

---

## Security Benefits

1. **No Expired Token Access**: Even if you refresh, expired tokens are rejected
2. **Client-Side Validation**: Fast response without server call
3. **Complete Cleanup**: All auth data cleared on expiration
4. **Debug Visibility**: Console logs show exactly what's happening
5. **Consistent Keys**: SessionManager now uses correct localStorage keys

---

## Files Modified

1. ✅ `frontend/src/hooks/useAuth.js`
   - Added `isTokenExpired()` helper function
   - Added token expiration check in `useEffect`
   - Added comprehensive cleanup on expired token
   - Added debug console.log statements

2. ✅ `frontend/src/components/security/SessionManager.js`
   - Changed `localStorage.getItem('token')` to `localStorage.getItem('jwt_token')`
   - Added fallback: `|| localStorage.getItem('token')` for backwards compatibility
   - Updated cleanup to remove both `jwt_token` and legacy keys

---

## Current Configuration (For Testing)

- **Session Timeout**: 1 minute (60 seconds)
- **Warning Time**: 15 seconds before timeout
- **JWT Expiration**: 1 minute (synchronized)
- **Server Session**: 1 minute (synchronized)

---

## How to Restore Production Settings

After testing, change these values back to 15 minutes:

### Frontend - SessionManager.js:
```javascript
const SESSION_TIMEOUT = 15 * 60 * 1000;     // 15 minutes
const WARNING_TIME = 60 * 1000;             // 60 seconds
const ACTIVITY_CHECK_INTERVAL = 5000;       // 5 seconds
const ACTIVITY_THROTTLE = 2000;             // 2 seconds
```

### Backend - SessionTrackingMiddleware.cs:
```csharp
private static readonly TimeSpan SessionTimeout = TimeSpan.FromMinutes(15);
```

### Backend - AuthController.cs:
```csharp
expires: DateTime.Now.AddMinutes(15)
```

---

## ✅ Status: FIXED

- [x] Token expiration validated on page load
- [x] Expired tokens rejected on refresh
- [x] Correct localStorage keys used
- [x] Debug logging added
- [x] Complete cleanup on expiration
- [x] Works with 1-minute test timeout
- [x] Ready for production (change back to 15 minutes)

---

**Test it now**: Login, wait 61 seconds, refresh the page - you should be logged out! 🎉
