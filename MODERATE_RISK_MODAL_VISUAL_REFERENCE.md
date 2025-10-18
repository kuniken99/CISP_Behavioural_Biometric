# 🎨 Moderate Risk Authentication Modal - Visual Reference

## Full Modal Design (Desktop View)

```
═══════════════════════════════════════════════════════════════════
║                    BACKGROUND (BLURRED)                         ║
║  ┌────────────────────────────────────────────────────────┐    ║
║  │                     MODAL OVERLAY                       │    ║
║  │                                                          │    ║
║  │                  ⚠️                                      │    ║
║  │              (animated pulse)                            │    ║
║  │                                                          │    ║
║  │      Additional Verification Required                   │    ║
║  │                                                          │    ║
║  │   We detected unusual activity. Please verify           │    ║
║  │   your identity to continue.                            │    ║
║  ├─────────────────────────────────────────────────────────┤    ║
║  │                                                          │    ║
║  │         ┌──────────────────────────────┐                │    ║
║  │         │ 🟡 Moderate Risk: 65%       │                │    ║
║  │         └──────────────────────────────┘                │    ║
║  │                                                          │    ║
║  ├─────────────────────────────────────────────────────────┤    ║
║  │                                                          │    ║
║  │   🔐  Google Authenticator                              │    ║
║  │                                                          │    ║
║  │   Open your authenticator app and enter the             │    ║
║  │   6-digit code                                           │    ║
║  │                                                          │    ║
║  ├─────────────────────────────────────────────────────────┤    ║
║  │                                                          │    ║
║  │   Verification Code                                      │    ║
║  │                                                          │    ║
║  │   ┌────────────────────────────────────────────────┐    │    ║
║  │   │                                                 │    │    ║
║  │   │         1   2   3   4   5   6                  │    │    ║
║  │   │                                                 │    │    ║
║  │   └────────────────────────────────────────────────┘    │    ║
║  │                                                          │    ║
║  │   ⌨️ Enter the 6-digit code from your app               │    ║
║  │                                                          │    ║
║  │   ┌────────────────────────────────────────────────┐    │    ║
║  │   │                                                 │    │    ║
║  │   │         🔐  Verify Code                        │    │    ║
║  │   │                                                 │    │    ║
║  │   └────────────────────────────────────────────────┘    │    ║
║  │                                                          │    ║
║  ├─────────────────────────────────────────────────────────┤    ║
║  │                                                          │    ║
║  │   ❓ Can't access your authenticator app?     ▼         │    ║
║  │                                                          │    ║
║  ├─────────────────────────────────────────────────────────┤    ║
║  │                                                          │    ║
║  │   🛡️  This verification is required for your account   │    ║
║  │       security. You cannot dismiss this dialog          │    ║
║  │       without verification.                              │    ║
║  │                                                          │    ║
║  └─────────────────────────────────────────────────────────┘    ║
║                                                                  ║
═══════════════════════════════════════════════════════════════════
```

---

## Color Scheme

### Moderate Risk (50-69%)
```
Background: #FEF3C7 (Light Amber)
Border: #FBBF24 (Amber)
Text: #92400E (Dark Brown)
Icon: 🟡 (Yellow Circle)
```

### High Risk (70-79%)
```
Background: #FEE2E2 (Light Red)
Border: #F87171 (Red)
Text: #991B1B (Dark Red)
Icon: 🔴 (Red Circle)
```

### Input States

**Empty / Typing:**
```
Border: #D1D5DB (Gray)
Background: white
Font: 32px Courier New
Letter Spacing: 12px
```

**Complete (6 digits):**
```
Border: #10B981 (Green)
Background: #F0FDF4 (Light Green)
```

**Error:**
```
Border: #EF4444 (Red)
Background: #FEF2F2 (Light Red)
Animation: Shake
```

---

## Animation States

### 1. Modal Entrance
```
Animation: slideUp (0.4s)
From: translateY(40px) scale(0.95)
To: translateY(0) scale(1)
```

### 2. Warning Icon
```
Animation: pulse (2s infinite)
From: scale(1)
To: scale(1.05)
```

### 3. Risk Icon
```
Animation: bounce (1s infinite)
From: translateY(0)
To: translateY(-4px)
```

### 4. Error Shake
```
Animation: shake (0.4s)
Keyframes: -8px → +8px → -8px → +8px → 0
```

### 5. Button Spinner
```
Animation: spin (0.8s linear infinite)
Border: 2px solid rgba(255,255,255,0.3)
Border-top: white
```

---

## Input Field States Visualization

### Empty State
```
┌────────────────────────────────────────┐
│                                         │
│         ░   ░   ░   ░   ░   ░          │
│                                         │
└────────────────────────────────────────┘
Border: Gray
Hint: "⌨️ Enter the 6-digit code from your app"
```

### Typing (3 digits entered)
```
┌────────────────────────────────────────┐
│                                         │
│         1   2   3   ░   ░   ░          │
│                                         │
└────────────────────────────────────────┘
Border: Gray
Hint: "3 digits remaining..."
```

### Complete (6 digits)
```
┌────────────────────────────────────────┐
│                                         │
│         1   2   3   4   5   6          │
│                                         │
└────────────────────────────────────────┘
Border: Green ✓
Background: Light Green
Hint: "✓ Code complete - verifying..."
```

### Error State
```
┌────────────────────────────────────────┐
│                                         │
│         ░   ░   ░   ░   ░   ░          │  ← Shaking animation
│                                         │
└────────────────────────────────────────┘
Border: Red
Background: Light Red

┌────────────────────────────────────────┐
│ ⚠️  Invalid verification code.         │
│     Please try again.                   │
│     (2 attempts remaining)              │
└────────────────────────────────────────┘
```

---

## Button States

### Default (Not Ready)
```
┌────────────────────────────────────────┐
│                                         │
│     🔐  Enter Code to Continue         │
│                                         │
└────────────────────────────────────────┘
Background: Gray (Disabled)
Cursor: not-allowed
```

### Ready (6 digits entered)
```
┌────────────────────────────────────────┐
│                                         │
│     ✓  Verify Code                     │
│                                         │
└────────────────────────────────────────┘
Background: Blue Gradient
Cursor: pointer
Box-shadow: 0 4px 12px rgba(59,130,246,0.3)
```

### Loading (Verifying)
```
┌────────────────────────────────────────┐
│                                         │
│     ⟳  Verifying...                    │
│                                         │
└────────────────────────────────────────┘
Background: Blue Gradient
Spinner: Rotating
Cursor: wait
```

---

## Help Dropdown (Collapsed)
```
┌────────────────────────────────────────┐
│ ❓ Can't access your authenticator?  ▼ │
└────────────────────────────────────────┘
Border: Gray
Hover: Light Gray Background
```

## Help Dropdown (Expanded)
```
┌────────────────────────────────────────┐
│ ❓ Can't access your authenticator?  ▲ │
├────────────────────────────────────────┤
│                                         │
│ Troubleshooting Steps:                  │
│                                         │
│ ✓ Ensure your device's time is         │
│   synchronized                           │
│ ✓ Check if the code has expired         │
│   (codes refresh every 30 seconds)      │
│ ✓ Verify you're using the correct      │
│   authenticator account                 │
│                                         │
│ ┌─────────────────────────────────────┐│
│ │       Contact Support               ││
│ └─────────────────────────────────────┘│
│                                         │
└────────────────────────────────────────┘
Background: Light Gray
Border: Blue (when open)
```

---

## Mobile View (< 640px)

```
═══════════════════════════════════════
║                                     ║
║              ⚠️                     ║
║                                     ║
║  Additional Verification            ║
║  Required                           ║
║                                     ║
║  We detected unusual activity.      ║
║                                     ║
╠═════════════════════════════════════╣
║                                     ║
║  🟡 Moderate Risk: 65%             ║
║                                     ║
╠═════════════════════════════════════╣
║                                     ║
║  🔐 Google Authenticator           ║
║                                     ║
║  Open your authenticator app        ║
║  and enter the 6-digit code         ║
║                                     ║
╠═════════════════════════════════════╣
║                                     ║
║  Verification Code                  ║
║                                     ║
║  ┌───────────────────────────────┐ ║
║  │                               │ ║
║  │   1  2  3  4  5  6           │ ║
║  │                               │ ║
║  └───────────────────────────────┘ ║
║                                     ║
║  ⌨️ Enter 6-digit code              ║
║                                     ║
║  ┌───────────────────────────────┐ ║
║  │                               │ ║
║  │   🔐 Verify Code             │ ║
║  │                               │ ║
║  └───────────────────────────────┘ ║
║                                     ║
╠═════════════════════════════════════╣
║                                     ║
║  ❓ Can't access app?      ▼       ║
║                                     ║
╠═════════════════════════════════════╣
║                                     ║
║  🛡️ This verification is           ║
║     required for security           ║
║                                     ║
═══════════════════════════════════════

Changes:
- Full screen (no border radius)
- Font size reduced (28px)
- Letter spacing reduced (8px)
- Padding reduced
- Numeric keyboard appears automatically
```

---

## Backdrop Effect

```
┌─────────────────────────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│ ▓▓  Dashboard Content (Blurred 8px)               ▓▓ │
│ ▓▓  ╔════════════════════════════════╗             ▓▓ │
│ ▓▓  ║                                ║             ▓▓ │
│ ▓▓  ║    MODAL (Sharp & Focused)     ║             ▓▓ │
│ ▓▓  ║                                ║             ▓▓ │
│ ▓▓  ╚════════════════════════════════╝             ▓▓ │
│ ▓▓                                                  ▓▓ │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
└─────────────────────────────────────────────────────────┘

CSS:
backdrop-filter: blur(8px);
background: rgba(0, 0, 0, 0.6);
```

---

## Z-Index Layering

```
Layer 10000: Modal Container
  └─ position: relative
     └─ z-index: 10000

Layer 9999: Backdrop
  └─ position: absolute
     └─ backdrop-filter: blur(8px)
     └─ z-index: 9999

Layer 1-100: Page Content
  └─ Becomes blurred and non-interactive
```

---

## Interactive Elements

### Clickable Areas
```
✓ Input field (focus & type)
✓ Verify button (when enabled)
✓ Help dropdown (expand/collapse)
✓ Contact Support button (in dropdown)

✗ Backdrop (clicking does nothing)
✗ Modal itself (clicking does nothing)
```

---

## Responsive Breakpoints

```
Desktop (> 640px):
- Modal: 480px max width
- Padding: 32px
- Font: 32px
- Letter spacing: 12px
- Border radius: 16px

Mobile (≤ 640px):
- Modal: 100% width
- Padding: 20px
- Font: 28px
- Letter spacing: 8px
- Border radius: 0
- Full screen height
```

---

## Accessibility Features

```
✓ Auto-focus on input field
✓ Keyboard navigation (Tab)
✓ ARIA labels
✓ High contrast text
✓ Focus visible outlines
✓ Screen reader support
✓ Numeric keyboard on mobile
✓ One-time-code autocomplete
```

---

## Color Contrast Ratios

```
Text on White: #111827 → 15.8:1 ✓ (WCAG AAA)
Error Text: #991B1B on #FEF2F2 → 8.9:1 ✓ (WCAG AAA)
Button Text: white on #3B82F6 → 5.2:1 ✓ (WCAG AA)
Risk Badge: #92400E on #FEF3C7 → 9.2:1 ✓ (WCAG AAA)
```

---

## Print Preview

```
When user tries to print:
- Modal is hidden
- Normal page prints
- CSS: @media print { .moderate-risk-overlay { display: none; } }
```

---

## Loading States Timeline

```
0ms:     Modal appears (slideUp animation)
100ms:   Input field auto-focused
User:    Types 6 digits
0ms:     Auto-submit triggered
50ms:    Button shows "Verifying..." with spinner
100-500ms: Backend validates
500ms:   Response received
600ms:   Modal fades out (success) OR shake animation (error)
```

---

**This visual reference helps developers and designers understand the exact appearance and behavior of the Moderate Risk Authentication Modal.**
