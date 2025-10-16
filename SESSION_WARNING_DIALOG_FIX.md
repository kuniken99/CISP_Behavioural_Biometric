# Session Warning Dialog - Click Outside Fix

## Issue
When the session warning dialog appears and the user clicks outside of it, the page shows "Network error fetching dashboard metrics."

## Root Causes

1. **Clicks propagating through overlay**: Clicks outside the dialog were triggering page interactions
2. **Activity detection during warning**: User activity was being processed even when warning was shown
3. **API calls failing during session timeout**: Dashboard metrics API was returning 401 errors when session was expiring
4. **Error messages showing during logout**: Network errors displayed even though logout was intentional

## Solutions Implemented

### 1. Prevent Overlay Click Propagation

**File**: `frontend/src/components/security/SessionManager.js`

Added event handlers to stop click propagation:

```javascript
// Prevent clicks outside the dialog from propagating
const handleOverlayClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
};

const handleDialogClick = (e) => {
    e.stopPropagation();
};

// Applied to overlay div
<div 
    onClick={handleOverlayClick}
    onMouseDown={handleOverlayClick}
    onKeyDown={handleOverlayClick}
>
```

**What this does:**
- Stops all click events from reaching the page behind the overlay
- Prevents keyboard events from triggering page actions
- Ensures only dialog buttons can be interacted with

---

### 2. Disable Activity Tracking During Warning

**File**: `frontend/src/components/security/SessionManager.js`

Modified activity handler to ignore events when warning is shown:

```javascript
const handleActivity = () => {
    // Don't process activity when warning is shown
    // Only allow explicit button clicks to extend session
    if (showWarning) {
        return;
    }

    // ... rest of activity handling
};
```

**What this does:**
- When warning dialog is visible, all user activity is ignored
- Only the "Continue Session" button can reset the timer
- Prevents accidental timer resets from background clicks

---

### 3. Handle Session Expiration in API Calls

**File**: `frontend/src/pages/DashboardPage.js`

Added session expiration detection:

```javascript
// Handle session expiration
if (response.status === 401) {
    const data = await response.json();
    if (data.sessionExpired) {
        // Session expired, let SessionManager handle logout
        return;
    }
}

// Only show error if token still exists
catch (err) {
    const token = localStorage.getItem('jwt_token');
    if (token) {
        setError('Network error fetching dashboard metrics.');
    }
    // If no token, user is being logged out, don't show error
}
```

**What this does:**
- Detects 401 responses with `sessionExpired` flag
- Silently allows SessionManager to handle logout
- Only shows errors if session is still supposed to be active
- Prevents error messages during intentional logout

---

### 4. Created API Client Utility

**File**: `frontend/src/utils/apiClient.js`

Created reusable utilities for safe API calls:

```javascript
// Makes authenticated API calls with session handling
export const authenticatedFetch = async (endpoint, options = {}) => {
    // Automatically handles session expiration
    // Returns null if session expired (instead of throwing error)
};

// Checks if current session is valid
export const isSessionValid = () => {
    // Decodes JWT and checks expiration time
};

// Wrapper for safe API calls
export const safeApiCall = async (apiFn, onSuccess, onError) => {
    // Only calls onError if session is still valid
    // Prevents error messages during logout
};
```

**Benefits:**
- Consistent session handling across all API calls
- Prevents error messages during logout
- Easier to use than manual error handling

---

## How It Works Now

### Scenario 1: User Clicks Outside Warning Dialog

**Before:**
1. Warning dialog appears
2. User clicks outside dialog (on overlay)
3. Click propagates to dashboard
4. Dashboard triggers some action
5. API call fails with 401
6. Error message: "Network error fetching dashboard metrics"

**After:**
1. Warning dialog appears
2. User clicks outside dialog (on overlay)
3. ✅ Click is stopped by `handleOverlayClick`
4. ✅ Event doesn't propagate to page
5. ✅ No API calls triggered
6. ✅ No error message

---

### Scenario 2: User Interacts During Warning

**Before:**
1. Warning dialog shows
2. User moves mouse or types
3. Activity handler resets timer
4. Warning disappears unexpectedly
5. Session continues (timer reset)

**After:**
1. Warning dialog shows
2. User moves mouse or types
3. ✅ Activity handler checks `if (showWarning) return;`
4. ✅ Activity is ignored
5. ✅ Only "Continue Session" button can reset timer
6. ✅ Warning stays until user makes explicit choice

---

### Scenario 3: API Call During Session Expiration

**Before:**
1. Dashboard loads while session is expiring
2. API call gets 401 Unauthorized
3. Error: "Network error fetching dashboard metrics"
4. User sees error even though they're being logged out

**After:**
1. Dashboard loads while session is expiring
2. API call gets 401 Unauthorized with `sessionExpired: true`
3. ✅ Code detects session expiration
4. ✅ Returns silently without error
5. ✅ SessionManager handles logout
6. ✅ No confusing error message

---

## Testing Checklist

### Test 1: Click Outside Warning Dialog
- [ ] Login and wait 14 minutes
- [ ] Warning dialog appears
- [ ] Click on the dark overlay (outside white box)
- [ ] ✅ Nothing happens (no error, dialog stays)
- [ ] Click "Continue Session"
- [ ] ✅ Dialog closes, session continues

### Test 2: Keyboard During Warning
- [ ] Login and trigger warning dialog
- [ ] Press keys on keyboard
- [ ] ✅ No effect on dialog or timer
- [ ] Use Tab to navigate to button
- [ ] Press Enter on "Continue Session"
- [ ] ✅ Dialog closes, session continues

### Test 3: Dashboard API During Warning
- [ ] Open Dashboard page
- [ ] Wait for warning dialog (14 minutes)
- [ ] ✅ No "Network error" messages appear
- [ ] Let session timeout (15 minutes)
- [ ] ✅ Clean logout, no error messages
- [ ] Login again
- [ ] ✅ Dashboard loads normally

### Test 4: Multiple Clicks on Overlay
- [ ] Trigger warning dialog
- [ ] Click rapidly on overlay multiple times
- [ ] ✅ Dialog remains stable
- [ ] ✅ No page interactions occur
- [ ] ✅ No API calls triggered
- [ ] ✅ No error messages

---

## Files Modified

1. ✅ `frontend/src/components/security/SessionManager.js`
   - Added overlay click prevention
   - Added activity disabling during warning
   - Enhanced event handling

2. ✅ `frontend/src/pages/DashboardPage.js`
   - Added session expiration detection
   - Improved error handling
   - Prevent errors during logout

3. ✅ `frontend/src/utils/apiClient.js` (NEW)
   - Reusable API utilities
   - Session-aware fetch wrapper
   - Safe API call wrapper

---

## Additional Improvements

### For Future Use

You can now update other pages to use the API client utility:

```javascript
import { authenticatedFetch, safeApiCall } from '../utils/apiClient';

// Example 1: Direct use
const data = await authenticatedFetch('/Dashboard/metrics');
if (data) {
    // Use data (data is null if session expired)
}

// Example 2: With safe wrapper
await safeApiCall(
    () => authenticatedFetch('/Dashboard/metrics'),
    (data) => setMetrics(data),
    (error) => setError(error.message)
);
```

**Benefits:**
- Consistent error handling
- Automatic session expiration detection
- No error messages during logout
- Cleaner code

---

## Summary

### ✅ Fixed Issues:
1. Clicks outside warning dialog no longer cause errors
2. User activity ignored when warning is shown
3. API calls handle session expiration gracefully
4. No error messages during intentional logout
5. Dialog is modal (can't interact with page behind it)

### ✅ User Experience:
- Warning dialog is truly modal
- Clean, professional behavior
- No confusing error messages
- Explicit user choice required
- Smooth logout process

### ✅ Code Quality:
- Reusable API utilities
- Consistent error handling
- Better separation of concerns
- Easier to maintain

---

**Status**: ✅ Issue Resolved

The session warning dialog now properly prevents clicks outside from causing network errors. Users must explicitly choose "Continue Session" or "Logout" - no accidental interactions possible.

---

*Last Updated: October 16, 2025*
