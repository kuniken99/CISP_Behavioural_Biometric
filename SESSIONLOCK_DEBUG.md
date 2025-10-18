# SessionLock Debugging Checklist

## Current Status
✅ Backend: Running - Detecting 85% risk with "Action: lock"
✅ Python: Running - Override active (85%)
✅ Frontend: Running - Props fixed (isLocked → show)

## What to Check Now

### 1. Open Browser Console (F12)
Look for these log messages after login:

```
[APP] handleRiskDetected called - Action: lock, Risk: 85%
[APP] Action is lock - Setting showSessionLock = true
[SessionLock] Component rendered - show: true, riskScore: 85
[SessionLock] Modal is showing - initializing lock
```

### 2. If You See These Logs:
✅ The modal SHOULD appear
❌ If it doesn't, check CSS/styling issues

### 3. If You DON'T See "[APP] handleRiskDetected":
The problem is in useCBBA.js - check these logs:
```
[CBBA] Risk assessment response: {...}
[CBBA] Triggering session lock
```

### 4. Network Tab Check:
1. Open DevTools → Network tab
2. Filter for "assess"
3. Look for `/api/biometric/assess` request
4. Check the Response:
```json
{
  "success": true,
  "riskScore": 85,
  "action": "lock",  ← MUST be "lock"
  "riskLevel": "high"
}
```

### 5. If action is NOT "lock":
Check the backend's `_determine_action` method:
- 0-49%: "monitor"
- 50-79%: "challenge" 
- 80%+: "lock" ← Should be this!

## Quick Test
1. Login to http://localhost:3000
2. Wait 2-3 seconds
3. Check console for logs
4. SessionLock modal should appear immediately

## Expected Visual Result:
```
╔════════════════════════════════════════╗
║     🛡️  ACCOUNT TEMPORARILY LOCKED     ║
║                                        ║
║  ⏱️  15:00 minutes remaining           ║
║                                        ║
║  Threat Details:                       ║
║  • Multiple failed login attempts      ║
║  • Login from unusual location         ║
║  • Suspicious device fingerprint       ║
║                                        ║
║     [📞 Contact Support]                ║
╚════════════════════════════════════════╝
```

## If Modal Still Doesn't Show:
Share these from browser console:
1. All [APP] logs
2. All [CBBA] logs
3. All [SessionLock] logs
4. Network response from /api/biometric/assess
