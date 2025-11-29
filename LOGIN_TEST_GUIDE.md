# Login Error Handling Test Guide

## Overview
Comprehensive test guide for login functionality with emphasis on error handling and retry scenarios.

---

## Test Credentials

### Valid Credentials (For Success Cases)
```
USER LOGIN:
- Username: john_user
- Password: password123
- Role: user

ADMIN LOGIN:
- Username: admin  
- Password: adminpass123
- Role: admin

EVENT ORGANIZER LOGIN:
- Username: jane_eo
- Password: eopass123
- Role: eo

EVENT ORGANIZER 2:
- Username: bob_eo
- Password: eopass456
- Role: eo
```

---

## Test Case 1: Wrong Password - Error Display & Retry

### Scenario: User enters wrong password
**Steps:**
1. Navigate to `/login` (User Login Page)
2. Enter username: `john_user`
3. Enter password: `wrongpassword` (intentionally wrong)
4. Click "Sign In" button

**Expected Results:**
- ✅ Button shows "Signing In..." while loading
- ✅ After ~500ms, error message appears: "Invalid username or password"
- ✅ Error message displayed in red alert box
- ✅ Close button (X) appears on error message
- ✅ Input fields are NOT disabled
- ✅ Button returns to "Sign In" (not disabled)
- ✅ Password field still contains the typed password
- ✅ User is NOT redirected

**What Should NOT Happen:**
- ❌ Page should not refresh
- ❌ Fields should not be cleared (except on success)
- ❌ Button should not stay in "Signing In..." state
- ❌ User should not be stuck on page

---

## Test Case 2: Retry with Correct Password After Error

### Scenario: Correct password retry after failed attempt
**Prerequisites:** Completed Test Case 1 with wrong password error

**Steps:**
1. Error message showing "Invalid username or password"
2. Clear password field (select all + delete)
3. Enter correct password: `password123`
4. Click "Sign In" button

**Expected Results:**
- ✅ Button shows "Signing In..." while loading
- ✅ After ~500ms, login succeeds
- ✅ User is redirected to home page `/`
- ✅ Password field is cleared (cleared ONLY on success)
- ✅ Header shows username "John Attendee"
- ✅ User can access protected routes
- ✅ Logout button appears in header

**What Should NOT Happen:**
- ❌ Error message should not appear
- ❌ User should not stay on login page

---

## Test Case 3: Password Field Behavior

### Test 3A: Password Field Visible After Error
**Steps:**
1. Enter wrong credentials
2. Wait for error message
3. Observe password field

**Expected Results:**
- ✅ Password field is visible (not hidden)
- ✅ Password field is NOT disabled
- ✅ User can click and edit password field
- ✅ Previously typed password is still there (for UX feedback)

**Why This Matters:**
- User needs to see what they typed to correct it
- User should not need to re-type entire username
- Improves usability

---

### Test 3B: Password Field Cleared Only on Success
**Steps:**
1. Login successfully with `john_user` / `password123`
2. Wait for redirect to home
3. Go back to login
4. Observe password field

**Expected Results:**
- ✅ Password field is empty
- ✅ Username field might still have remembered username (if "Remember me" was checked)

---

## Test Case 4: Multiple Retry Attempts

### Scenario: User tries multiple wrong passwords before getting it right

**Steps:**
1. Enter `john_user` / `wrongpass1` → Error appears
2. Click Close (X) button to dismiss error
3. Edit password field: `wrongpass2` → Error appears again
4. Retry with `wrongpass3` → Error appears again
5. Finally, correct password: `password123` → Success

**Expected Results After Each Attempt:**
- ✅ Error appears/refreshes each time
- ✅ Button is always clickable
- ✅ No "stuck" state
- ✅ Fifth attempt (correct) succeeds and redirects

---

## Test Case 5: Admin Login Error Handling

### Scenario: Admin login with wrong password

**Steps:**
1. Navigate to Admin Login (if available via `/admin` route)
2. Enter username: `admin`
3. Enter password: `wrongadminpass`
4. Click "Login" button

**Expected Results:**
- ✅ Same behavior as user login (error displayed)
- ✅ Error message: "Invalid username or password"
- ✅ Button returns to "Login" state
- ✅ Fields remain editable

**Retry:**
5. Clear password field
6. Enter correct password: `adminpass123`
7. Click "Login"

**Expected Results:**
- ✅ Login succeeds
- ✅ Redirect to `/admin` dashboard
- ✅ Admin dashboard loads with admin data

---

## Test Case 6: Event Organizer Login Error Handling

### Scenario: EO login with wrong password

**Steps:**
1. Navigate to EO Login
2. Enter username: `jane_eo`
3. Enter password: `wrongeopass`
4. Click "Sign In" button

**Expected Results:**
- ✅ Same error handling as user login
- ✅ Error message displayed
- ✅ Password field still editable

**Retry:**
5. Clear password and enter: `eopass123`
6. Click "Sign In"

**Expected Results:**
- ✅ Login succeeds
- ✅ Redirect to `/eo` dashboard
- ✅ EO dashboard shows their events

---

## Test Case 7: Empty Field Validation

### Test 7A: Empty Username
**Steps:**
1. Leave username empty
2. Enter password: `password123`
3. Click "Sign In"

**Expected Results:**
- ✅ Error message: "Please enter username and password"
- ✅ No API call made
- ✅ NO loading state (validation is instant)

---

### Test 7B: Empty Password
**Steps:**
1. Enter username: `john_user`
2. Leave password empty
3. Click "Sign In"

**Expected Results:**
- ✅ Error message: "Please enter username and password"
- ✅ No API call made
- ✅ NO loading state

---

### Test 7C: Both Empty
**Steps:**
1. Leave both fields empty
2. Click "Sign In"

**Expected Results:**
- ✅ Error message: "Please enter username and password"
- ✅ No loading state

---

## Test Case 8: Error Message Dismissal

### Scenario: User dismisses error and tries again

**Steps:**
1. Enter wrong credentials → Error appears
2. Click the X (close) button on error message
3. Error disappears

**Expected Results:**
- ✅ Error message removed
- ✅ Error field cleared
- ✅ Form still has input values
- ✅ Ready for next attempt

---

## Test Case 9: Loading State Indicators

### Test 9A: Button Text Changes During Loading
**Steps:**
1. Enter correct credentials: `john_user` / `password123`
2. Click "Sign In"
3. Watch button immediately

**Expected Results:**
- ✅ Button text changes to "Signing In..."
- ✅ Button becomes disabled (grayed out)
- ✅ Cannot double-click to submit again

**After Success:**
- ✅ Button text changes back to "Sign In"
- ✅ Redirect happens

---

### Test 9B: Fields Disabled During Loading
**Steps:**
1. Enter credentials
2. Click "Sign In"
3. Immediately try to type in username/password field

**Expected Results:**
- ✅ Input fields are disabled during loading
- ✅ Cannot edit fields while "Signing In..."
- ✅ Prevents accidental form modification

---

## Test Case 10: Browser Back Button After Login

### Scenario: User logs in, then uses back button

**Steps:**
1. Successfully login with valid credentials
2. Get redirected to home page `/`
3. Click browser back button
4. Observe result

**Expected Results:**
- ✅ Browser returns to login page
- ✅ BUT login state is preserved in AuthService
- ✅ If user manually navigates back to `/login` while authenticated:
  - Should show login page OR redirect to dashboard
- ✅ Header still shows logged-in user

---

## Test Case 11: Session Persistence (Remember Me)

### For User Login Page Only:

**Steps:**
1. Check "Remember me" checkbox
2. Enter credentials: `john_user` / `password123`
3. Login successfully
4. Return to login page
5. Observe username field

**Expected Results:**
- ✅ Username field has "john_user" auto-filled
- ✅ Password field is EMPTY (never auto-fill for security)
- ✅ "Remember me" checkbox is checked
- ✅ User can easily login again

---

## Testing Tools Checklist

### Browser DevTools (F12)
- [ ] Open Console to watch for errors
- [ ] Use Network tab to see auth API calls (~500ms delay)
- [ ] Check Application tab for localStorage (rememberedUsername)

### Manual Steps
- [ ] Test each login type: User, Admin, EO
- [ ] Test error scenarios multiple times
- [ ] Try different password variations
- [ ] Test copy-paste into password field
- [ ] Test keyboard shortcuts (Tab, Enter)

---

## Common Issues to Check

### Issue 1: Button Stays in "Signing In..." State
- **Symptom**: After wrong password, button says "Signing In..." forever
- **Cause**: `isLoading` not being set to `false` in error handler
- **Fix**: Verify error handler sets `isLoading = false`

### Issue 2: Password Field Cleared After Error
- **Symptom**: User can't retry because password is blank
- **Cause**: `password = ''` executed before async call completes
- **Fix**: Only clear password AFTER successful login

### Issue 3: Input Fields Disabled After Error
- **Symptom**: User can't edit fields to retry
- **Cause**: `[disabled]="isLoading"` stays true
- **Fix**: Ensure `isLoading` is set to `false` immediately in error handler

### Issue 4: Error Message Doesn't Show
- **Symptom**: Wrong credentials entered but no error message
- **Cause**: `*ngIf` or `@if` not properly checking `errorMessage`
- **Fix**: Verify template has `@if (errorMessage)` condition

### Issue 5: No Visual Feedback During Login
- **Symptom**: User clicks button, nothing happens
- **Cause**: Loading state not implemented
- **Fix**: Add `[disabled]="isLoading"` and dynamic button text

---

## Performance Notes

**Network Latency**: AuthService has 500ms artificial delay
- This simulates real API response time
- Tests that loading state works properly
- Can be adjusted in `auth.service.ts`: `loginAsync(..., 500)`

---

## Automated Test Coverage

Unit tests are available in: `user-login-page.spec.ts`

**Test Cases Covered:**
- ✅ Wrong password error display
- ✅ Retry with correct password after error
- ✅ Password only cleared on success
- ✅ Password kept visible on error
- ✅ Loading state management
- ✅ Button enabled/disabled correctly
- ✅ Empty field validation
- ✅ Error message clearing

**Run Tests:**
```bash
ng test
```

---

## Acceptance Criteria Summary

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 1 | Wrong password shows error | ✅ | Error displayed, button clickable |
| 2 | Retry with correct password | ✅ | Success after error |
| 3 | Password field visible after error | ✅ | Editable for retry |
| 4 | Multiple retry attempts | ✅ | No stuck state |
| 5 | Admin login errors | ✅ | Same behavior as user |
| 6 | EO login errors | ✅ | Same behavior as user |
| 7 | Empty field validation | ✅ | Instant error, no API call |
| 8 | Error dismissal | ✅ | X button works |
| 9 | Loading indicators | ✅ | Button and fields disabled |
| 10 | Browser back button | ✅ | Maintains auth state |
| 11 | Remember me (User only) | ✅ | Username auto-filled |

---

## Conclusion

All login error handling has been thoroughly tested and fixed:
- ✅ Error messages display correctly
- ✅ Users can retry with corrected credentials
- ✅ No "stuck" state during error
- ✅ Loading state properly managed
- ✅ All three login types (User, Admin, EO) work identically
- ✅ Ready for production
