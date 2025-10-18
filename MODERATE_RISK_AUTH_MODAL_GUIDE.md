# Moderate Risk Authentication Modal - Implementation Guide

## 📋 Overview

The **Moderate Risk Authentication Modal** is a security feature that triggers when the CBBA (Continuous Behavioral Biometric Authentication) system detects moderate risk levels (50-79%). It requires users to verify their identity using Google Authenticator before continuing their session.

## 🎯 Key Features

### 1. **Modal Overlay with Blur Effect**
- Full-screen overlay that blurs the background content
- Users **cannot dismiss** the modal without verification
- Forces authentication within the popup

### 2. **Google Authenticator Integration**
- 6-digit code input from authenticator app
- Auto-submit when 6 digits are entered
- Real-time validation with backend

### 3. **Security Features**
- ✅ **3 Attempt Limit**: After 3 failed attempts, user is logged out
- ✅ **Auto-focus**: Input field automatically focused for quick entry
- ✅ **Numeric Keyboard**: Mobile devices show numeric keyboard
- ✅ **Visual Feedback**: Color-coded input (red for error, green for complete)
- ✅ **Audit Logging**: All verification attempts are logged

### 4. **User Experience**
- Risk score indicator shows current threat level
- Animated warning icon
- Clear instructions
- Help section with troubleshooting tips
- Cannot close modal by clicking backdrop

---

## 🏗️ Architecture

### Frontend Components

#### `ModerateRiskAuthModal.js`
```
frontend/src/components/security/ModerateRiskAuthModal.js
```

**Props:**
- `show` (boolean): Controls modal visibility
- `riskScore` (number): Current CBBA risk score (0-100)
- `username` (string): Current user's username
- `onVerify` (function): Callback when verification succeeds
- `onCancel` (function): Callback when verification fails/cancelled

**Features:**
- Auto-focus input field
- Auto-submit on 6 digits
- Failed attempt tracking
- Backdrop blur effect
- Responsive design

#### `ModerateRiskAuthModal.css`
```
frontend/src/styles/ModerateRiskAuthModal.css
```

**Styling:**
- Blurred backdrop (`backdrop-filter: blur(8px)`)
- Slide-up animation
- Shake animation on error
- Pulse/bounce animations
- Mobile responsive

---

### Backend API

#### Endpoint: `POST /api/TwoFactor/verify-moderate-risk`

**Location:** `backend/Controllers/TwoFactorController.cs`

**Request Body:**
```json
{
  "code": "123456",
  "riskScore": 65.5
}
```

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Verification successful. You may continue.",
  "riskScore": 65.5,
  "timestamp": "2025-10-18T10:30:00Z"
}
```

**Response (Error):**
```json
{
  "message": "Invalid verification code. Please try again."
}
```

**Features:**
- JWT authentication required
- Validates Google Authenticator code
- Creates audit log entry
- Creates alert entry
- Logs to application logs

---

## 🔄 Integration Flow

### 1. Risk Detection
```javascript
// In useCBBA.js or CBBAContext.js
if (riskScore >= 50 && riskScore < 80) {
  handleRiskDetected('challenge', riskScore);
}
```

### 2. Modal Display
```javascript
// In App.js
const handleRiskDetected = (action, riskScore) => {
  if (action === 'challenge' && riskScore >= 50 && riskScore < 80) {
    setShowModerateRiskAuth(true);
  }
};
```

### 3. User Verification
```
User enters 6-digit code → Auto-submit → Backend validates → Success/Failure
```

### 4. Verification Result

**On Success:**
- Modal closes
- User continues session
- Audit log created
- Alert marked as "Resolved"

**On Failure:**
- Error message displayed
- Input cleared
- Attempt counter incremented
- If 3 attempts failed → User logged out

---

## 🎨 Visual Design

### Risk Level Badges

**Moderate Risk (50-69%):**
```css
Background: #FEF3C7 (light yellow)
Border: #FBBF24 (amber)
Icon: 🟡
```

**High Risk (70-79%):**
```css
Background: #FEE2E2 (light red)
Border: #F87171 (red)
Icon: 🔴
```

### Input States

**Empty:**
- Border: Gray (#D1D5DB)
- Hint: "⌨️ Enter the 6-digit code from your app"

**Incomplete:**
- Border: Gray
- Hint: "3 digits remaining..."

**Complete:**
- Border: Green (#10B981)
- Background: Light green (#F0FDF4)
- Hint: "✓ Code complete - verifying..."

**Error:**
- Border: Red (#EF4444)
- Background: Light red (#FEF2F2)
- Shake animation
- Error message displayed

---

## 📱 Mobile Responsive

### Breakpoint: 640px

**Changes:**
- Modal takes full screen
- No border radius
- Reduced padding
- Smaller font sizes
- Adjusted letter spacing

```css
@media (max-width: 640px) {
  .moderate-risk-modal {
    border-radius: 0;
    max-height: 100vh;
  }
  
  .code-input-modal {
    font-size: 28px;
    letter-spacing: 8px;
  }
}
```

---

## 🔐 Security Considerations

### 1. **Cannot Be Dismissed**
```javascript
const handleBackdropClick = (e) => {
  e.stopPropagation(); // Prevents closing
};
```

### 2. **Attempt Limiting**
```javascript
if (attempts >= 2) { // 3 total attempts
  setError('Too many failed attempts...');
  setTimeout(() => {
    onCancel(); // Triggers logout
  }, 2000);
}
```

### 3. **Auto-Logout on Cancel**
```javascript
onCancel={() => {
  handleLogout(); // Force logout for security
}}
```

### 4. **Background Scroll Prevention**
```javascript
useEffect(() => {
  if (show) {
    document.body.style.overflow = 'hidden';
  }
}, [show]);
```

---

## 🧪 Testing Guide

### Manual Testing

**1. Trigger Moderate Risk:**
```javascript
// Temporarily modify useCBBA.js to force moderate risk
setRiskScore(65); // Force 65% risk
```

**2. Test Valid Code:**
- Open Google Authenticator app
- Enter current 6-digit code
- Should verify successfully

**3. Test Invalid Code:**
- Enter wrong code (e.g., 000000)
- Should show error message
- Should clear input
- Should increment attempt counter

**4. Test 3 Failed Attempts:**
- Enter wrong code 3 times
- Should show "Too many failed attempts"
- Should logout after 2 seconds

**5. Test Auto-Submit:**
- Enter 6 digits
- Should auto-submit without clicking button

**6. Test Mobile:**
- Open on mobile device
- Should show numeric keyboard
- Should be full-screen
- Should work smoothly

---

## 📊 Audit Trail

### Database Tables Updated

**1. AuditLogs Table:**
```sql
INSERT INTO AuditLogs (UserId, Action, Details, Timestamp, IpAddress, SessionId)
VALUES (5, 'MODERATE_RISK_VERIFICATION', 
        'User verified identity via 2FA due to moderate risk detection (Risk: 65%)',
        GETUTCDATE(), '192.168.1.100', 'session-123');
```

**2. Alerts Table:**
```sql
-- Success
INSERT INTO Alerts (UserId, Type, Severity, Message, Status, CreatedAt, ResolvedAt)
VALUES (5, 'MODERATE_RISK_AUTH', 'Medium', 
        'User successfully verified identity (Risk: 65%)', 
        'Resolved', GETUTCDATE(), GETUTCDATE());

-- Failure
INSERT INTO Alerts (UserId, Type, Severity, Message, Status, CreatedAt)
VALUES (5, 'MODERATE_RISK_AUTH', 'Medium',
        'Failed verification attempt (Risk: 65%)',
        'Active', GETUTCDATE());
```

---

## 🚀 Deployment Checklist

- [x] Create `ModerateRiskAuthModal.js` component
- [x] Create `ModerateRiskAuthModal.css` stylesheet
- [x] Add backend endpoint `/api/TwoFactor/verify-moderate-risk`
- [x] Add DTO `ModerateRiskVerifyDto`
- [x] Import component in `App.js`
- [x] Add state management in `App.js`
- [x] Update `handleRiskDetected` logic
- [x] Test with valid Google Authenticator codes
- [x] Test with invalid codes
- [x] Test attempt limiting
- [x] Test mobile responsiveness
- [x] Verify audit logging
- [x] Verify alert creation

---

## 🎓 Usage Example

### In App.js:
```javascript
import ModerateRiskAuthModal from './components/security/ModerateRiskAuthModal';

// State
const [showModerateRiskAuth, setShowModerateRiskAuth] = useState(false);
const [detectedRiskScore, setDetectedRiskScore] = useState(0);

// Risk detection handler
const handleRiskDetected = (action, riskScore) => {
  setDetectedRiskScore(riskScore);
  if (action === 'challenge' && riskScore >= 50 && riskScore < 80) {
    setShowModerateRiskAuth(true);
  }
};

// Render
<ModerateRiskAuthModal
  show={showModerateRiskAuth}
  riskScore={detectedRiskScore}
  username={currentUser}
  onVerify={(success, data) => {
    if (success) {
      setShowModerateRiskAuth(false);
      console.log('Verification successful!');
    }
  }}
  onCancel={() => {
    setShowModerateRiskAuth(false);
    handleLogout();
  }}
/>
```

---

## 🐛 Troubleshooting

### Issue: Modal doesn't appear

**Solution:**
- Check `showModerateRiskAuth` state
- Verify risk score is between 50-79%
- Check console for errors

### Issue: Code always invalid

**Solution:**
- Ensure 2FA is enabled for user
- Check device time is synchronized
- Verify correct authenticator account
- Check backend logs for validation errors

### Issue: Modal can be closed by clicking outside

**Solution:**
- Verify `handleBackdropClick` function prevents propagation
- Check CSS z-index is high enough

### Issue: Auto-submit not working

**Solution:**
- Check `submitCode` function is called when length === 6
- Verify `isLoading` state isn't stuck true
- Check for JavaScript errors in console

---

## 📈 Performance Optimization

### Code Splitting
```javascript
// Lazy load the modal
const ModerateRiskAuthModal = React.lazy(() => 
  import('./components/security/ModerateRiskAuthModal')
);

// Use with Suspense
<Suspense fallback={<div>Loading...</div>}>
  <ModerateRiskAuthModal ... />
</Suspense>
```

### Memoization
```javascript
const ModerateRiskAuthModal = React.memo(({ show, riskScore, ... }) => {
  // Component code
});
```

---

## 🔮 Future Enhancements

1. **Backup Codes**: Allow users to use backup codes if authenticator unavailable
2. **Biometric Auth**: Support fingerprint/face ID on mobile
3. **SMS Fallback**: Send SMS code as alternative
4. **Remember Device**: Option to skip verification on trusted devices
5. **Session Extension**: Grant extended session on successful verification
6. **Risk Score Visualization**: Show historical risk scores
7. **Analytics Dashboard**: Track verification success rates

---

## 📞 Support

For issues or questions:
- Check console logs (`[CBBA]` prefix)
- Review audit logs in database
- Check backend logs for API errors
- Contact security team for policy questions

---

**Last Updated:** October 18, 2025  
**Version:** 1.0  
**Author:** CBBA Security Team
