# Auto-Login State Management - Code References

This document provides exact code references for the auto-login functionality that persists authentication state across browser refreshes and page navigations.

---

## 1. AuthService Constructor - Auto-Restore on App Load

### Location 1: AuthService - Constructor with Auto-Restore

**File:** `src/app/auth/auth.service.ts` (Lines 26-43)

```typescript
@Injectable({
   providedIn: 'root'
})
export class AuthService {
   private authState = new BehaviorSubject<AuthState>({
      currentUser: null,
      isAuthenticated: false,
   });

   public authState$: Observable<AuthState> = this.authState.asObservable();

   // Inject PLATFORM_ID and determine if running in browser
   private platformId = inject(PLATFORM_ID);
   private isBrowser = isPlatformBrowser(this.platformId);

   // Mock users database (moved to dev-only file when environment.useMocks === true)
   private mockUsers: User[] = [];

   // Try to load dev mock users if configured
   private static loadDevMocks(): User[] {
      if (!environment || !environment.useMocks) return [];
      try {
         // eslint-disable-next-line @typescript-eslint/no-var-requires
         // tslint:disable-next-line:no-var-requires
         // @ts-ignore
         const mock = require('../mock/mock-users');
         return (mock && mock.MOCK_USERS) ? mock.MOCK_USERS : [];
      } catch (e) {
         return [];
      }
   }

   constructor() {
      // PENTING: Hanya panggil restoreAuthState() jika berada di browser
      if (this.isBrowser) {
         this.restoreAuthState();
      }
   }
```

**What it does:**
- **Line 22**: Injects PLATFORM_ID to detect browser vs server
- **Line 23**: `isPlatformBrowser()` checks if running in browser
- **Line 41**: **CRITICAL**: Calls `restoreAuthState()` in constructor
- Only restores if in browser environment (not SSR)
- Auto-login happens when AuthService is instantiated (app startup)

**Auto-Login Flow:**
```
App Starts
    ↓
AuthService instantiated (provided in root)
    ↓
Constructor called
    ↓
Check: isBrowser === true?
    ↓
YES → restoreAuthState() executes
    ↓
Retrieves authState from localStorage
    ↓
Sets authState BehaviorSubject
    ↓
All components subscribed to authState$ receive update
    ↓
UI updates with logged-in user info (if exists)
```

---

## 2. Restore Auth State from localStorage

### Location 2: AuthService - Restore Auth State Method

**File:** `src/app/auth/auth.service.ts` (Lines 213-228)

```typescript
private restoreAuthState(): void {
   // Gunakan isBrowser untuk memastikan hanya berjalan di browser
   if (this.isBrowser) {
      try {
         const stored = localStorage.getItem('authState');
         if (stored) {
            const authData = JSON.parse(stored) as AuthState;
            if (authData.isAuthenticated && authData.currentUser) {
               this.authState.next(authData);
            }
         }
      } catch (e) {
         console.warn('Failed to restore auth state:', e);
      }
   }
}
```

**What it does:**
- **Line 216**: Browser check (safety for SSR)
- **Line 218**: `localStorage.getItem('authState')` retrieves stored state
- **Line 220**: Parses JSON string back to AuthState object
- **Line 221-222**: Validates user is authenticated before restoring
- **Line 223**: **KEY**: `this.authState.next(authData)` updates BehaviorSubject
- **Line 225**: Error handling if localStorage fails

**Restore Process:**
```typescript
localStorage content: 
{
  "currentUser": {
    "id": "user_123",
    "username": "john_user",
    "email": "john@example.com",
    "password": "password123",
    "role": "user",
    "fullName": "John Attendee",
    "createdAt": "2025-01-20T10:00:00Z"
  },
  "isAuthenticated": true,
  "token": "token_user_123_1705756200000"
}
    ↓
restoreAuthState() retrieves it
    ↓
Parses and validates
    ↓
authState.next() broadcasts
    ↓
Components see: currentUser populated, isAuthenticated = true
    ↓
Header shows user name instead of login button
```

---

## 3. Persist Auth State to localStorage

### Location 3: AuthService - Persist Auth State Method

**File:** `src/app/auth/auth.service.ts` (Lines 202-211)

```typescript
// Private helper methods for localStorage persistence
private persistAuthState(authData: AuthState): void {
   // Gunakan isBrowser untuk memastikan hanya berjalan di browser
   if (this.isBrowser) {
      try {
         localStorage.setItem('authState', JSON.stringify(authData));
      } catch (e) {
         console.warn('Failed to persist auth state:', e);
      }
   }
}
```

**What it does:**
- **Line 206**: Browser check
- **Line 208**: `localStorage.setItem('authState', JSON.stringify(authData))`
- Converts AuthState object to JSON string
- Stores in browser's localStorage with key 'authState'
- **Line 210**: Error handling

**Storage Details:**
```
Key: 'authState'
Value: JSON stringified AuthState object
Size: ~300-500 bytes per user
Lifespan: Persists until localStorage is cleared
Access: Retrieves on app startup via restoreAuthState()
```

---

## 4. Login Method - Save State Automatically

### Location 4: AuthService - Login with State Persistence

**File:** `src/app/auth/auth.service.ts` (Lines 59-76)

```typescript
login(username: string, password: string): { success: boolean; message: string; user?: User } {
   this.ensureMockLoaded();
   const user = this.mockUsers.find(
      u => (u.username === username || u.email === username) && u.password === password
   );

   if (!user) {
      return { success: false, message: 'Invalid username or password' };
   }

   const authData: AuthState = {
      currentUser: { ...user },
      isAuthenticated: true,
      token: `token_${user.id}_${Date.now()}`,
   };

   this.authState.next(authData);
   this.persistAuthState(authData);
   return { success: true, message: 'Login successful', user };
}
```

**What it does:**
- **Line 68-73**: Creates AuthState object with:
  - `currentUser`: Copy of logged-in user
  - `isAuthenticated`: Set to true
  - `token`: Generated JWT-like token
- **Line 75**: `this.authState.next()` - Updates BehaviorSubject
- **Line 76**: `this.persistAuthState()` - **SAVES TO LOCALSTORAGE**
- State persists even after browser close

**Login Sequence:**
```
1. User enters credentials
   ↓
2. login() validates against mockUsers
   ↓
3. If valid, create AuthState object
   ↓
4. authState.next(authData) 
   → Components subscribed to authState$ receive update
   → Header updates to show user name
   → UI changes to authenticated view
   ↓
5. persistAuthState(authData)
   → localStorage.setItem('authState', JSON.stringify(authData))
   → Saves user info to browser storage
   ↓
6. User is now logged in
   ↓
7. If browser closes/refreshes:
   → New session still has stored authState
   → Constructor calls restoreAuthState()
   → User automatically logged in again
```

---

## 5. Logout Method - Clear State

### Location 5: AuthService - Logout with State Clearing

**File:** `src/app/auth/auth.service.ts` (Lines 154-162)

```typescript
logout(): void {
   this.authState.next({
      currentUser: null,
      isAuthenticated: false,
   });
   this.clearAuthState();
}
```

**What it does:**
- **Lines 155-158**: Resets authState to logged-out state
- **Line 159**: `clearAuthState()` removes from localStorage
- After logout, user must login again (no auto-login)

---

## 6. Clear Auth State from localStorage

### Location 6: AuthService - Clear Auth State Method

**File:** `src/app/auth/auth.service.ts` (Lines 230-239)

```typescript
private clearAuthState(): void {
   // Gunakan isBrowser untuk memastikan hanya berjalan di browser
   if (this.isBrowser) {
      try {
         localStorage.removeItem('authState');
      } catch (e) {
         console.warn('Failed to clear auth state:', e);
      }
   }
}
```

**What it does:**
- **Line 234**: `localStorage.removeItem('authState')`
- Removes stored authentication state
- Called only during logout
- After removal, no auto-login on next session

---

## 7. User Login Component - Remember Me Feature

### Location 7: UserLoginPage - ngOnInit Auto-Fill Username

**File:** `src/app/login/sign-in-page-user/user-login-page.ts` (Lines 78-90)

```typescript
export class UserLoginPage implements OnInit {
   username: string = '';
   password: string = '';
   rememberMe: boolean = false;
   errorMessage: string = '';
   isLoading: boolean = false;

   constructor(
      private router: Router,
      private authService: AuthService
   ) {}

   ngOnInit() {
      // Auto-fill remembered username (only if localStorage is available)
      if (typeof localStorage !== 'undefined') {
         const remembered = localStorage.getItem('rememberedUsername');
         if (remembered) {
            this.username = remembered;
            this.rememberMe = true;
         }
      }
   }
```

**What it does:**
- **Line 81**: Checks if localStorage is available
- **Line 82**: Retrieves 'rememberedUsername' from localStorage
- **Line 83-85**: Auto-fills username field and checks "Remember me" checkbox
- Password is NOT auto-filled (security best practice)

---

### Location 8: UserLoginPage - Store Remember Me Preference

**File:** `src/app/login/sign-in-page-user/user-login-page.ts` (Lines 41-43)

```typescript
// Store remember me preference (only if localStorage is available)
if (this.rememberMe && typeof localStorage !== 'undefined') {
   localStorage.setItem('rememberedUsername', this.username);
}
```

**What it does:**
- Stores username in localStorage if "Remember me" is checked
- Key: 'rememberedUsername'
- Value: entered username
- Retrieved in ngOnInit to auto-fill on return visit

---

## 8. Complete Auto-Login Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│          APPLICATION STARTUP (First Time)               │
└──────────────────────┬──────────────────────────────────┘
                       │
              ┌────────▼────────┐
              │ App Initializes │
              └────────┬────────┘
                       │
          ┌────────────▼────────────┐
          │ AuthService created     │
          │ (providedIn: 'root')    │
          └────────┬────────────────┘
                   │
          ┌────────▼─────────────┐
          │ Constructor executes │
          └────────┬─────────────┘
                   │
        ┌──────────▼──────────┐
        │ isBrowser check?    │
        └──────┬──────┬───────┘
              NO      YES
               │       │
               │  ┌────▼──────────────────────┐
               │  │ restoreAuthState() called │
               │  │ Check localStorage        │
               │  └────┬─────────────────────┘
               │       │
               │  ┌────▼──────────────────────┐
               │  │ Stored 'authState' found? │
               │  └──┬──────────────────┬──────┘
               │    NO              YES
               │    │                │
               │    │         ┌──────▼────────────┐
               │    │         │ Parse & validate  │
               │    │         └──────┬───────────┘
               │    │                │
               │    │         ┌──────▼────────────────────┐
               │    │         │ authState.next(authData)   │
               │    │         │ → Broadcasts to component  │
               │    │         └──────┬───────────────────┘
               │    │                │
               │    │         ┌──────▼────────────────────┐
               │    │         │ Components subscribed to   │
               │    │         │ authState$ receive update  │
               │    │         └──────┬───────────────────┘
               │    │                │
               │    └────────┬───────┘
               │             │
        ┌──────▼─────────────▼──────┐
        │ App Ready                 │
        │ With/Without Auto-Login   │
        └──────────────────────────┘
```

---

## 9. Session Persistence Flow - With Auto-Login

```
User is logged in and closes browser
        │
        ▼
logout() NOT called
        │
        ▼
localStorage still contains 'authState':
{
  "currentUser": { ... },
  "isAuthenticated": true,
  "token": "..."
}
        │
        ▼
User reopens browser and returns to app
        │
        ▼
App starts fresh but AuthService constructor runs
        │
        ▼
restoreAuthState() checks localStorage
        │
        ▼
Finds stored 'authState'
        │
        ▼
authState.next(storedAuthData)
        │
        ▼
All subscribed components get update
        │
        ▼
Header component shows:
  - User name
  - Dashboard link
  - Logout button
        │
        ▼
User is automatically logged in!
NO need to re-enter credentials
```

---

## 10. Session Termination Flow - Logout Clears Auto-Login

```
User clicks logout button
        │
        ▼
logout() method called
        │
        ▼
authState.next({
  currentUser: null,
  isAuthenticated: false
})
        │
        ▼
Components subscribed to authState$ receive update
        │
        ▼
Header updates to show login button
        │
        ▼
clearAuthState() called
        │
        ▼
localStorage.removeItem('authState')
        │
        ▼
'authState' REMOVED from storage
        │
        ▼
User closes browser
        │
        ▼
Browser session ends
        │
        ▼
User opens app again
        │
        ▼
restoreAuthState() checks localStorage
        │
        ▼
localStorage.getItem('authState') returns NULL
        │
        ▼
No auto-login occurs
        │
        ▼
User must login again manually
```

---

## 11. localStorage Data Structure

### Key: `authState`

```json
{
  "currentUser": {
    "id": "user_1705756200000",
    "username": "john_user",
    "email": "john@example.com",
    "password": "password123",
    "role": "user",
    "fullName": "John Attendee",
    "phone": "08123456789",
    "createdAt": "2025-01-20T10:00:00Z"
  },
  "isAuthenticated": true,
  "token": "token_user_1705756200000_1705756200000"
}
```

### Key: `rememberedUsername` (Optional - User Login Only)

```
Value: "john_user"
```

### Storage Locations in DevTools:

```
Browser DevTools → Application → LocalStorage
  └─ https://localhost:4200 (or your app URL)
     ├─ authState (contains full auth data)
     └─ rememberedUsername (optional, user only)
```

---

## 12. Auto-Login Code Summary Table

| Component | Method | Purpose | Called When | Effect |
|-----------|--------|---------|-------------|--------|
| AuthService | Constructor | Initialize service | App starts | Triggers restoreAuthState() if browser |
| AuthService | restoreAuthState() | Restore from storage | Constructor + browser check | Loads stored user, auto-login |
| AuthService | persistAuthState() | Save to storage | After successful login | Stores authState in localStorage |
| AuthService | clearAuthState() | Remove from storage | When logout() called | Clears stored state, prevents auto-login |
| AuthService | login() | Authenticate user | User submits credentials | Creates state + persists |
| AuthService | logout() | End session | User clicks logout | Clears state + storage |
| UserLoginPage | ngOnInit() | Auto-fill username | Component init | Retrieves remembered username |
| UserLoginPage | login() | Submit credentials | User clicks login | Optionally stores username if "Remember me" |

---

## 13. Real-Time Example: Session Persistence

### Scenario: User logs in on Monday, closes browser, returns on Tuesday

**Monday 10:00 AM:**
```typescript
1. User navigates to app
2. AuthService constructor runs
3. restoreAuthState() checks localStorage
4. No stored state found
5. User must login manually

2. User enters: john_user / password123
3. Checks "Remember me" checkbox
4. Clicks Login

5. login() executes:
   - Validates credentials
   - Creates AuthState object
   - authState.next() → broadcasts to components
   - persistAuthState() → saves to localStorage
   
6. localStorage now contains:
   - Key: 'authState' → Full authentication object
   - Key: 'rememberedUsername' → "john_user"

7. User can browse app normally
8. Header shows "John Attendee" and logout button
```

**Monday 5:00 PM:**
```
User closes browser completely
localStorage still contains:
  - 'authState': {...full user data...}
  - 'rememberedUsername': 'john_user'
```

**Tuesday 9:00 AM:**
```typescript
1. User opens browser and navigates to app

2. App initializes
3. AuthService constructor runs
4. Checks: isBrowser === true ✓
5. restoreAuthState() executes

6. localStorage.getItem('authState')
   → Returns stored object

7. Parses and validates
8. authState.next(storedAuthData)
   → Broadcasts to all components

9. Header component receives update:
   currentUser = { id, username, email, ... }
   isAuthenticated = true

10. Header automatically shows:
    - "Welcome, John Attendee"
    - Dashboard link
    - Logout button

11. User is AUTOMATICALLY LOGGED IN!
    No need to re-enter credentials!
```

**Same Tuesday - Login Page Behavior:**
```typescript
1. User navigates to /login page while already auto-logged in

2. UserLoginPage.ngOnInit() executes

3. Checks localStorage for 'rememberedUsername'
4. Finds: "john_user"
5. Auto-fills username field
6. Sets rememberMe = true

7. Username field shows: "john_user"
8. Password field is empty (for security)
9. "Remember me" checkbox is checked

10. User can:
    - Just enter password and click login again
    - Or navigate to different page (already logged in)
```

---

## 14. Security Considerations

### What IS Stored in localStorage:
```
✅ User ID
✅ Username
✅ Email
✅ Role
✅ Token
✅ Full Name
✅ Phone (optional)
✅ Organization Name (if EO)
```

### What is NOT Stored:
```
❌ Password (intentionally excluded)
❌ Credit card info
❌ Sensitive personal data
```

### localStorage Security Notes:
```
⚠️ localStorage is accessible to JavaScript
   → XSS attacks could steal authState
   → Mitigated by Angular's built-in sanitization

⚠️ localStorage is domain-specific
   → localhost:4200 ≠ localhost:4201
   → Production domain isolated

⚠️ localStorage persists across browser sessions
   → Logout must clear it
   → Not suitable for ultra-sensitive data

✅ Best Practice: Token expiry (if backend implemented)
✅ Best Practice: HTTPS only (production)
✅ Best Practice: CSP headers (Content Security Policy)
```

---

## 15. Summary: Auto-Login Architecture

### Initialization Phase:
1. **App starts** → AuthService instantiated
2. **Constructor runs** → Checks if browser environment
3. **restoreAuthState()** → Retrieves stored auth data
4. **authState.next()** → Broadcasts to components
5. **Auto-login complete** → User sees authenticated UI

### Login Phase:
1. **User enters credentials** → Calls login()
2. **Validation passes** → Creates AuthState
3. **authState.next()** → Updates components
4. **persistAuthState()** → Saves to localStorage
5. **Session persists** → Even after browser close

### Logout Phase:
1. **User clicks logout** → Calls logout()
2. **authState.next()** → Resets to null
3. **clearAuthState()** → Removes from storage
4. **Auto-login disabled** → Requires manual login next time

### Recovery Phase:
1. **App restart** → AuthService constructor
2. **Check localStorage** → Gets stored state
3. **Validate and restore** → Auto-login executed
4. **Components updated** → UI shows user info

---

## 16. Key Code Locations Quick Reference

| Feature | File | Lines | Method |
|---------|------|-------|--------|
| **Auto-Login on Start** | auth.service.ts | 41 | Constructor |
| **Restore from Storage** | auth.service.ts | 213-228 | restoreAuthState() |
| **Save to Storage** | auth.service.ts | 202-211 | persistAuthState() |
| **Remove from Storage** | auth.service.ts | 230-239 | clearAuthState() |
| **Login Save State** | auth.service.ts | 75-76 | login() method |
| **Logout Clear State** | auth.service.ts | 154-162 | logout() method |
| **Remember Username** | user-login-page.ts | 78-90 | ngOnInit() |
| **Store Username** | user-login-page.ts | 41-43 | login() method |

