# Session Timeout Troubleshooting Guide

## Issue: Warning Dialog Not Appearing

### How to Test with Debug Logging

1. **Open Browser Developer Tools**
   - Press `F12` or right-click → Inspect
   - Go to the **Console** tab
   - Clear any existing messages

2. **Login to the Application**
   - Go to http://localhost:3000
   - Login with your credentials
   - Watch the console for: `SessionManager started:`

3. **Watch the Console Logs**
   
   You should see logs every second like:
   ```
   SessionManager started: {timeout: "60s", warningAt: "45s", checkInterval: "1000ms"}
   
   Session check: {
     timeSinceLastActivity: "5s",
     timeRemaining: "55s",
     warningThreshold: "15s",
     showWarning: false,
     willShowWarning: false
   }
   ```

4. **Stay Completely Idle**
   - **DO NOT** move your mouse
   - **DO NOT** type anything
   - **DO NOT** click anywhere
   - **DO NOT** scroll
   - Just watch the console

5. **At 45 Seconds (timeRemaining: 15s)**
   ```
   Session check: {
     timeSinceLastActivity: "45s",
     timeRemaining: "15s",
     warningThreshold: "15s",
     showWarning: false,
     willShowWarning: true   ← Should be true!
   }
   
   Showing warning dialog
   ```
   
   ⚠️ **Warning dialog should appear on screen**

6. **If You Move/Click/Type**
   ```
   User activity detected - resetting timer
   
   Session check: {
     timeSinceLastActivity: "0s",   ← Reset to 0
     timeRemaining: "60s",           ← Back to 60s
     ...
   }
   ```

---

## Common Issues

### ❌ "Warning dialog never appears"

**Possible Causes:**
1. **You're moving the mouse/keyboard** → Activity resets the timer
2. **SessionManager not mounted** → Check console for "SessionManager started"
3. **Not logged in** → Check localStorage for 'token'

**Solutions:**
- Keep hands off keyboard and mouse
- Don't touch the browser window
- Minimize mouse movement entirely

---

### ❌ "Timer keeps resetting to 60s"

**Cause:** Activity detected (mouse, keyboard, click, touch)

**Events that reset the timer:**
- `mousedown` - Clicking anywhere
- `keydown` - Typing anything
- `click` - Any click
- `touchstart` - Touch on mobile/touchpad

**Solution:** 
- Don't interact with the page at all
- Watch from distance or another monitor

---

### ❌ "Console shows 'No token found, not starting'"

**Cause:** Not logged in or token cleared

**Solution:**
1. Make sure you're logged in
2. Check localStorage (F12 → Application → Local Storage)
3. Verify `token` exists

---

### ❌ "Page automatically logs out before warning"

**Possible Causes:**
1. JWT token expired (check backend logs)
2. Token validation failing
3. Server session timeout

**Check:**
- Backend console for session tracking logs
- Network tab for 401 responses
- Token expiration time in checkTokenExpiration()

---

## Manual Test Without Moving

### Option 1: Use Browser DevTools Console

Run this in console after login:
```javascript
// Monitor session state
setInterval(() => {
  const token = localStorage.getItem('token');
  console.log('Token exists:', !!token);
}, 5000);
```

### Option 2: Open Two Browser Windows

1. **Window 1**: Your application (don't touch it!)
2. **Window 2**: DevTools console (watch logs here)

This way you can see console without interacting with the app.

---

## Expected Console Output (Full Flow)

```
[00:00] SessionManager started: {timeout: "60s", warningAt: "45s", checkInterval: "1000ms"}

[00:01] Session check: {timeSinceLastActivity: "1s", timeRemaining: "59s", ...}
[00:02] Session check: {timeSinceLastActivity: "2s", timeRemaining: "58s", ...}
[00:03] Session check: {timeSinceLastActivity: "3s", timeRemaining: "57s", ...}
...
[00:44] Session check: {timeSinceLastActivity: "44s", timeRemaining: "16s", ...}
[00:45] Session check: {timeSinceLastActivity: "45s", timeRemaining: "15s", willShowWarning: true}
[00:45] Showing warning dialog ⚠️ ← DIALOG APPEARS HERE

[00:46] Session check: {timeSinceLastActivity: "46s", timeRemaining: "14s", showWarning: true}
[00:47] Session check: {timeSinceLastActivity: "47s", timeRemaining: "13s", showWarning: true}
...
[00:59] Session check: {timeSinceLastActivity: "59s", timeRemaining: "1s", ...}
[01:00] Session timeout - logging out
[01:00] Redirecting to /login
```

---

## If Activity Is Detected

```
[00:30] Session check: {timeSinceLastActivity: "30s", timeRemaining: "30s", ...}
[00:31] User activity detected - resetting timer  ← YOU MOVED/CLICKED!
[00:32] Session check: {timeSinceLastActivity: "1s", timeRemaining: "59s", ...}  ← Reset!
```

---

## Quick Debug Checklist

- [ ] Browser DevTools Console open (F12)
- [ ] Logged into application successfully
- [ ] Console shows "SessionManager started"
- [ ] Console shows "Session check" every second
- [ ] Hands completely off mouse and keyboard
- [ ] No other programs moving cursor (e.g., remote desktop)
- [ ] Watching logs on separate monitor or window
- [ ] timeRemaining counting down from 60s to 0s
- [ ] At 15s remaining, warning should appear
- [ ] At 0s remaining, automatic logout

---

## Still Not Working?

### Check these files:

1. **SessionManager.js** - Verify these values:
   ```javascript
   const SESSION_TIMEOUT = 1 * 60 * 1000;      // 60000ms = 1 minute
   const WARNING_TIME = 15 * 1000;             // 15000ms = 15 seconds
   const ACTIVITY_CHECK_INTERVAL = 1000;       // 1000ms = 1 second
   ```

2. **App.js** - Verify SessionManager is rendered:
   ```javascript
   {isAuthenticated && <SessionManager />}
   ```

3. **Console Errors** - Check for any JavaScript errors

---

## Test Results

Once you see the warning dialog, verify:

- [ ] Dialog appears at exactly 45 seconds
- [ ] Countdown shows "0:15" to "0:00"
- [ ] Progress bar animates smoothly
- [ ] No page blinking or refreshing
- [ ] "Extend Session" button works
- [ ] "Logout Now" button works
- [ ] Auto-logout at 60 seconds works
- [ ] Redirects to login page
- [ ] Shows timeout message

---

**After Testing:**
Remember to remove debug console.log statements for production!

