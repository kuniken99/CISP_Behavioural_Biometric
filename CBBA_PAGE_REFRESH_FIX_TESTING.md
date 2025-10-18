# Quick Testing Guide - CBBA Page Refresh Fix

## What Was Fixed
The issue where search fields and dropdowns would automatically clear/reset every 15 seconds has been resolved by implementing React Context for CBBA state management.

## How to Test

### Prerequisites
1. Make sure both backend and frontend are running:
   ```powershell
   # Terminal 1 - Backend
   cd backend
   dotnet run

   # Terminal 2 - Python CBBA Service
   cd cbba_python_service
   python app.py

   # Terminal 3 - Frontend
   cd frontend
   npm start
   ```

### Test Scenario 1: ActivityLogs Page
1. Login as user: `tank108` / `password123`
2. Navigate to "Activity Logs" page
3. In the search field, type some text (e.g., "login")
4. **Wait 15-20 seconds** (CBBA assessment cycle)
5. ✅ **EXPECTED**: Search text should remain, not clear
6. ❌ **OLD BUG**: Search would clear back to empty

### Test Scenario 2: Dropdowns
1. Stay on ActivityLogs page
2. Click any dropdown filter (if available)
3. Select an option from the dropdown
4. **Wait 15-20 seconds** (CBBA assessment cycle)
5. ✅ **EXPECTED**: Selected option should stay selected
6. ❌ **OLD BUG**: Dropdown would reset to default

### Test Scenario 3: Other Pages
Test the same on these pages with search/filter functionality:
- **User Management**: Search for users
- **Alert System**: Filter alerts
- **DB Configuration**: Any input fields

### Test Scenario 4: CBBA Still Works
Verify CBBA monitoring is still functional:

1. Check the floating CBBA monitor (bottom-right corner)
2. Look for risk score updates every 15 seconds
3. Risk score should show: "Risk: XX%" with color indicator:
   - 🟢 Green: 0-49%
   - 🟠 Orange: 50-79%
   - 🔴 Red: 80-100%
4. Status should show: "Active" or "Initializing"
5. Open browser console (F12) and look for CBBA assessment logs

### Test Scenario 5: Mouse and Keyboard Tracking
1. Move your mouse around the page
2. Type in various input fields
3. Check console for behavioral data collection logs
4. Every 15 seconds, you should see: "CBBA Assessment completed"

## What to Look For

### ✅ Success Indicators
- User inputs persist through CBBA assessment cycles
- No unexpected page refreshes or input clearing
- CBBA risk scores update every 15 seconds in the monitor
- Console shows regular CBBA assessment logs
- Page performance feels smooth

### ❌ Potential Issues
If you see these problems, let me know:
- Inputs still clearing after 15 seconds
- CBBA monitor not updating
- Console errors related to "CBBAContext"
- Risk scores stuck at 0% or not updating
- Page lag or performance issues

## Browser Console Monitoring

Open browser console (F12) and watch for these logs:

**Good Signs:**
```
CBBA Assessment completed. Score: 15.5, Level: green
Behavioral data collected: {keystrokes: 25, mouseMovements: 150}
```

**Warning Signs:**
```
Error: useCBBAContext must be used within CBBAProvider
Failed to assess behavioral risk
```

## Quick Troubleshooting

### If inputs still clearing:
1. Check browser console for errors
2. Verify CBBAProvider is wrapping the Router in App.js
3. Clear browser cache and hard reload (Ctrl+Shift+R)

### If CBBA not updating:
1. Check all three services are running (backend, Python, frontend)
2. Verify Python service is on http://localhost:5001
3. Check backend can reach Python service
4. Look for network errors in browser console

### If errors in console:
1. Make sure to save all files
2. Restart the frontend dev server (npm start)
3. Clear node_modules and reinstall if needed:
   ```powershell
   cd frontend
   Remove-Item -Recurse -Force node_modules
   npm install
   npm start
   ```

## Expected Behavior Summary

| Action | Before Fix | After Fix |
|--------|-----------|-----------|
| Type in search field | Text clears after 15s | ✅ Text persists |
| Select dropdown option | Resets to default after 15s | ✅ Selection persists |
| CBBA risk updates | Updates every 15s | ✅ Still updates every 15s |
| Page performance | Laggy re-renders | ✅ Smooth, no lag |
| User experience | Frustrating, unusable | ✅ Smooth and intuitive |

## Technical Note

The fix works by using React Context to isolate CBBA state updates. Now when CBBA assesses risk every 15 seconds:
- Only the CBBA-related components re-render
- Your input components maintain their local state
- No unnecessary page-wide re-renders

**Architecture**: `CBBAProvider` → `useCBBAContext()` → `CBBAMonitor` + `DashboardLayout`

## Report Results

After testing, please report:
1. ✅ All scenarios working correctly
2. ⚠️ Partial issues (describe which scenarios)
3. ❌ Still experiencing the bug (describe what happens)

Include:
- Browser used (Chrome/Firefox/Edge)
- Any console errors
- Which pages/features you tested
- Screenshots if helpful

---

**Status**: Ready for testing
**Priority**: High (major UX issue fix)
**Estimated Test Time**: 5-10 minutes
