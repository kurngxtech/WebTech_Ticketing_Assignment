# RxJS Reactive State Management - Code References

This document provides exact code references for reactive state management with RxJS observables, BehaviorSubjects, and event streams for authentication, event list, and ticketing with real-time UI updates.

---

## 1. Authentication State Management with BehaviorSubject

### Location 1: AuthService - BehaviorSubject Definition

**File:** `src/app/auth/auth.service.ts` (Lines 12-17)

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
```

**What it does:**
- **Line 12**: `new BehaviorSubject<AuthState>()` - Creates a reactive state container for authentication
- **Line 17**: `authState$: Observable<AuthState>` - Exposes the state as an observable stream
- Holds active user state and authentication status
- Components subscribe to `authState$` to receive real-time updates

**BehaviorSubject Features:**
- Holds the current state value
- New subscribers immediately receive the latest state
- Emits new values when state changes (`authState.next()`)
- Tracks both current user and authentication status

---

### Location 2: AuthService - State Updates

**File:** `src/app/auth/auth.service.ts` (Lines 60-67)

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

      this.authState.next(authData);  // <-- Emit new state to all subscribers
      this.persistAuthState(authData);
      return { success: true, message: 'Login successful', user };
   }
```

**What it does:**
- **Line 74**: `this.authState.next(authData)` - Updates BehaviorSubject with new user state
- All components subscribed to `authState$` receive the update immediately
- Triggered when user logs in
- Real-time state propagation across entire application

---

### Location 3: AuthService - Observable Stream for Async Operations

**File:** `src/app/auth/auth.service.ts` (Lines 80-82)

```typescript
   loginAsync(username: string, password: string, ms = 300) {
      const result = this.login(username, password);
      return of(result).pipe(delay(ms));  // <-- Observable stream with delay
   }
```

**What it does:**
- Converts login result into an observable stream
- Simulates network latency with RxJS `delay` operator
- Returns `Observable<LoginResult>` that components can subscribe to
- Example of composing observables with RxJS operators

**RxJS Operators Used:**
- `of()` - Creates an observable from a value
- `delay()` - Delays the emission by specified milliseconds

---

### Location 4: AuthService - Logout Observable

**File:** `src/app/auth/auth.service.ts` (Lines 153-159)

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
- Resets the auth state to unauthenticated
- **Line 154**: `authState.next()` - Emits cleared state
- Triggers UI updates in all subscribed components
- Subscribers see: `currentUser: null` and `isAuthenticated: false`

---

## 2. Event List Management with BehaviorSubject

### Location 5: DataEventService - Event Stream with Search

**File:** `src/app/data-event-service/data-event.service.ts` (Lines 27-44)

```typescript
@Injectable({
   providedIn: 'root'
})
export class DataEventService {
   private data: EventItem[] = [...(loadDevEvents().length ? loadDevEvents() : [])];
   private subject = new BehaviorSubject<EventItem[]>([...this.data]);
   private searchQuery = new BehaviorSubject<string>('');
   
   public searchResults$: Observable<EventItem[]> = this.searchQuery.pipe(
      distinctUntilChanged(),
      map(q => {
         const term = (q || '').trim().toLowerCase();
         if (!term) return [];
         return this.data.filter(e => e.title.toLowerCase().includes(term));
      })
   );

   public searchQuery$ = this.searchQuery.asObservable();
```

**What it does:**
- **Line 28**: `subject = new BehaviorSubject()` - Holds all events
- **Line 29**: `searchQuery = new BehaviorSubject()` - Holds current search term
- **Lines 31-39**: `searchResults$` - Reactive search stream that:
  - Uses `distinctUntilChanged()` to avoid duplicate searches
  - Uses `map()` to filter events based on search query
  - Returns filtered results observable

**Stream Features:**
- When search query changes → `searchQuery.next()` is called
- All operators re-run in pipeline
- Subscribers receive filtered event list
- Real-time search results without manual refresh

---

### Location 6: DataEventService - Observable Getters

**File:** `src/app/data-event-service/data-event.service.ts` (Lines 98-99)

```typescript
   getEvents$(): Observable<EventItem[]> {
      return this.subject.asObservable();
   }
```

**What it does:**
- Exposes event stream as observable
- Components subscribe to receive event updates
- Alternative to synchronous `getEvents()` method
- Enables reactive data flow

---

### Location 7: DataEventService - Search Update Observable

**File:** `src/app/data-event-service/data-event.service.ts` (Lines 45, 48-50)

```typescript
   public searchQuery$ = this.searchQuery.asObservable();

   setSearchQuery(q: string) {
      this.searchQuery.next(q || '');  // <-- Emit new search term
   }
```

**What it does:**
- **Line 45**: `searchQuery$` - Observable stream of search terms
- **Line 49**: `this.searchQuery.next(q)` - Updates search term
- Triggers entire search pipeline
- All subscribers receive filtered results

---

## 3. Ticketing & Booking State Management

### Location 8: DataEventService - Buy Ticket Observable Stream

**File:** `src/app/data-event-service/data-event.service.ts` (Lines 199-223)

```typescript
   buyTicket(eventId: number, ticketId: string, qty = 1, userId = 'guest'): 
      { success: boolean; message: string; remaining?: number; booking?: Booking } {
      
      // Find event and ticket
      const event = this.data.find(e => e.id === eventId);
      if (!event) {
         return { success: false, message: 'Event not found' };
      }

      const t = event.tickets.find(t => t.id === ticketId);
      if (!t || t.total - t.sold < qty) {
         return { success: false, message: 'Not enough tickets available' };
      }

      // Create booking record with state
      const booking: Booking = {
         id: `booking_${this.nextBookingId++}`,
         eventId,
         userId,
         ticketCategoryId: ticketId,
         quantity: qty,
         pricePerTicket: t.price,
         totalPrice: t.price * qty,
         discountApplied: 0,
         status: 'confirmed',
         bookingDate: new Date().toISOString(),
         qrCode: this.generateQRCode(),
         checkedIn: false,
      };

      this.bookings.push(booking);
      this.saveState();
      this.subject.next([...this.data]);  // <-- Emit updated event state

      return {
         success: true,
         message: 'Purchase successful',
         remaining: t.total - t.sold,
         booking
      };
   }
```

**What it does:**
- Creates booking with state management
- **Line 222**: `this.subject.next()` - Broadcasts event data update
- Returns booking object with state info
- Updates BehaviorSubject so all subscribers receive new event state
- Persists state to localStorage

---

## 4. Real-Time UI Updates via Observable Subscriptions

### Location 9: Header Component - Real-Time Auth Updates

**File:** `src/app/layout/header/header.ts` (Lines 28-46)

```typescript
export class Header implements OnInit {
   query = '';
   suggestions: EventItem[] = [];
   currentUser: User | null = null;
   isAuthenticated = false;

   constructor(
      private dataSrv: DataEventService,
      private authService: AuthService,
      private router: Router,
      private scroller: ViewportScroller
   ) { }

   ngOnInit(): void {
      // Subscribe to search results observable
      this.dataSrv.searchResults$.subscribe((list) => {
         this.suggestions = list.slice(0, 6);  // <-- Real-time update
      });

      // Subscribe to authentication state observable
      this.authService.authState$.subscribe(state => {
         this.currentUser = state.currentUser;  // <-- Real-time user update
         this.isAuthenticated = state.isAuthenticated;  // <-- Real-time auth status
      });
   }
```

**What it does:**
- **Line 36**: Subscribes to `searchResults$` - Receives filtered events
- **Line 38**: Updates component property - Triggers template change detection
- **Line 40**: Subscribes to `authState$` - Receives auth state changes
- **Lines 41-42**: Updates component properties - Header updates when user logs in/out
- **Real-time flow**: Auth state change → BehaviorSubject update → Observable emit → Component property update → Template re-renders

**Example Flow:**
1. User clicks login button
2. `AuthService.login()` calls `authState.next(newState)`
3. `authState$` emits new authentication state
4. Header's subscription receives the update
5. `currentUser` and `isAuthenticated` properties update
6. Template re-renders with user name and logout button

---

### Location 10: MyBookings Component - Real-Time Auth State

**File:** `src/app/user/my-bookings/my-bookings.ts` (Lines 52-60)

```typescript
@Component({
   selector: 'app-my-bookings',
   standalone: true,
   imports: [CommonModule, RouterModule],
   templateUrl: './my-bookings.html',
   styleUrl: './my-bookings.css'
})
export class MyBookings implements OnInit {
   /*...*/
   ngOnInit() {
      this.authService.authState$.subscribe(state => {
         if (state.isAuthenticated && state.currentUser) {
            this.currentUserId = state.currentUser.id || 'user_' + Date.now();
            this.loadBookings();  // <-- Load user's bookings when authenticated
         } else {
            this.isLoading = false;
         }
      });
   }
```

**What it does:**
- **Line 52**: Subscribes to `authState$` - Watches for authentication changes
- **Line 53**: Checks current user state reactively
- **Line 55**: Loads bookings when user is authenticated
- **Real-time behavior**: When user logs in, bookings automatically load

---

## 5. Complete Observable Pipeline Examples

### Location 11: Header Component - Search + Auth Reactive Flow

**File:** `src/app/layout/header/header.ts` (Lines 36-43)

```typescript
ngOnInit(): void {
   // Event List Stream
   this.dataSrv.searchResults$.subscribe((list) => {
      this.suggestions = list.slice(0, 6);
   });

   // Authentication Stream
   this.authService.authState$.subscribe(state => {
      this.currentUser = state.currentUser;
      this.isAuthenticated = state.isAuthenticated;
   });
}

onSearchInput(): void {
   this.dataSrv.setSearchQuery(this.query);  // <-- Trigger search stream
}

selectSuggestion(ev: EventItem): void {
   this.query = ev.title;
   this.dataSrv.setSearchQuery(this.query);  // <-- Update stream
   this.suggestions = [];
   this.router.navigate(['/ticket', ev.id]);
}
```

**Observable Pipelines:**

**Pipeline 1: Search Stream**
```
User types in search box
    ↓
onSearchInput() calls setSearchQuery()
    ↓
searchQuery BehaviorSubject.next(searchTerm)
    ↓
searchResults$ observable emits
    ↓
Component receives filtered events
    ↓
UI updates with suggestions dropdown
```

**Pipeline 2: Authentication Stream**
```
User logs in
    ↓
AuthService.login() calls authState.next(newState)
    ↓
authState$ observable emits
    ↓
Header component receives authentication state
    ↓
currentUser and isAuthenticated update
    ↓
Template re-renders:
  - Shows user name instead of login button
  - Shows logout button
  - Shows role-specific dashboard link
```

---

## 6. RxJS Operators in Use

### Operators Found in Codebase:

| Operator | File | Line | Purpose |
|----------|------|------|---------|
| `distinctUntilChanged()` | data-event.service.ts | 32 | Prevents duplicate search queries from triggering filters |
| `map()` | data-event.service.ts | 33-39 | Transforms search query into filtered event list |
| `pipe()` | data-event.service.ts | 31 | Chains multiple operators together |
| `delay()` | auth.service.ts | 82 | Simulates network latency for async operations |
| `of()` | auth.service.ts | 81 | Creates observable from synchronous result |
| `asObservable()` | auth.service.ts | 17, 45 | Exposes BehaviorSubject as read-only observable |
| `subscribe()` | header.ts | 36, 40 | Components subscribe to observable streams |
| `next()` | auth.service.ts | 74, 154 | Updates BehaviorSubject with new value |

---

## 7. Real-Time UI Update Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER INTERACTION                              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │ UI Component │
                    │  (Template)  │
                    └──────┬───────┘
                           │
                    ┌──────▼──────────────────┐
                    │   Component Class      │
                    │   (Subscribes to$)     │
                    └──────┬────────────────┬┘
                           │                │
              ┌────────────▼──┐    ┌────────▼────────────┐
              │ Auth Service  │    │ DataEvent Service   │
              │ authState$    │    │ searchResults$      │
              └────┬──────────┘    └────────┬───────────┘
                   │                        │
         ┌─────────▼─────────┐  ┌──────────▼────────────┐
         │ BehaviorSubject   │  │  BehaviorSubject      │
         │ (Current User)    │  │  (Search Query)       │
         └─────────┬─────────┘  └──────────┬─────────────┘
                   │                       │
         ┌─────────▼─────────┐  ┌──────────▼────────────┐
         │ authState.next()  │  │ searchQuery.next()    │
         │ emit new state    │  │ trigger pipeline      │
         └─────────┬─────────┘  └──────────┬─────────────┘
                   │                       │
         ┌─────────▼────────────────┬──────▼────────────┐
         │  Observable Emits        │  Apply Operators  │
         │  to all subscribers      │  map, filter, etc │
         └─────────┬────────────────┴──────┬───────────┘
                   │                       │
         ┌─────────▼───────────────────────▼────────┐
         │   Component Receives Update              │
         │   (subscription callback fired)          │
         └─────────┬──────────────────────────────┘
                   │
         ┌─────────▼──────────────────────────────┐
         │  Update Component Property              │
         │  (currentUser = newUser)                │
         │  (suggestions = filteredEvents)         │
         └─────────┬──────────────────────────────┘
                   │
         ┌─────────▼──────────────────────────────┐
         │  Change Detection Triggered            │
         │  Component Detects Property Change     │
         └─────────┬──────────────────────────────┘
                   │
         ┌─────────▼──────────────────────────────┐
         │  Template Re-renders                    │
         │  Angular updates DOM                    │
         │  User sees updated UI                   │
         └──────────────────────────────────────┘
```

---

## 8. Real-Time Example: User Login Flow

### Step 1: User Submits Login Form

**File:** `src/app/login/sign-in-page-user/user-login-page.ts` (Conceptual)

```typescript
onSubmit(): void {
   this.authService.loginAsync(this.username, this.tempPassword, 500).subscribe(
      (result) => {
         if (result.success) {
            // Observable emitted successfully
            this.router.navigate(['/']);
         }
      }
   );
}
```

### Step 2: AuthService Updates State

```typescript
// AuthService.login() is called
login(username: string, password: string): {...} {
   // Validate credentials
   const user = this.mockUsers.find(u => /* match found */);
   
   // Create new auth state
   const authData: AuthState = {
      currentUser: { ...user },
      isAuthenticated: true,
      token: `token_${user.id}_${Date.now()}`,
   };
   
   // Update BehaviorSubject - THIS TRIGGERS EMISSIONS TO ALL SUBSCRIBERS
   this.authState.next(authData);
   
   return { success: true, message: 'Login successful', user };
}
```

### Step 3: Header Component Receives Update

```typescript
// Header has subscribed to authState$ in ngOnInit()
ngOnInit(): void {
   this.authService.authState$.subscribe(state => {
      // THIS CALLBACK IS TRIGGERED WHEN LOGIN CHANGES STATE
      this.currentUser = state.currentUser;  // Updates to new user object
      this.isAuthenticated = state.isAuthenticated;  // Updates to true
   });
}
```

### Step 4: Template Re-renders

```html
<!-- Before Login -->
<div class="navbar-buttons">
   <button routerLink="/login">Login</button>
   <button routerLink="/sign-up">Sign Up</button>
</div>

<!-- After Login (AUTOMATICALLY UPDATED) -->
<div class="navbar-buttons">
   <span class="user-name">{{ currentUser?.fullName }}</span>
   <button (click)="goToMyBookings()">My Bookings</button>
   <button (click)="logout()">Logout</button>
</div>
```

### Complete Real-Time Flow:
```
User submits login
    ↓ (500ms simulated delay)
Observable emits from loginAsync()
    ↓
authState.next() in AuthService
    ↓
All subscribers to authState$ receive new state
    ↓
Header subscription callback fires
    ↓
currentUser = loggedInUser
isAuthenticated = true
    ↓
Angular Change Detection runs
    ↓
Template updates:
- Shows "Welcome, John"
- Shows "My Bookings" button
- Shows "Logout" button
    ↓
User sees updated header immediately
```

---

## 9. Search Stream Real-Time Example

### Step 1: User Types in Search Box

```typescript
onSearchInput(): void {
   // User types 'Concert'
   this.dataSrv.setSearchQuery(this.query);  // query = 'Concert'
}
```

### Step 2: DataEventService Updates Search Stream

```typescript
setSearchQuery(q: string) {
   this.searchQuery.next(q || '');  // Emit new search term to BehaviorSubject
}
```

### Step 3: Observable Pipeline Processes

```typescript
public searchResults$: Observable<EventItem[]> = this.searchQuery.pipe(
   distinctUntilChanged(),     // Skip if same query as before
   map(q => {
      const term = (q || '').trim().toLowerCase();  // term = 'concert'
      if (!term) return [];
      return this.data.filter(e => 
         e.title.toLowerCase().includes(term)  // Filter events by title
      );
   })
);
```

### Step 4: Header Component Receives Filtered Results

```typescript
ngOnInit(): void {
   this.dataSrv.searchResults$.subscribe((list) => {
      this.suggestions = list.slice(0, 6);  // Show first 6 results
   });
}
```

### Step 5: Template Shows Suggestions

```html
<div class="search-results" *ngIf="suggestions.length > 0">
   <div *ngFor="let event of suggestions" (click)="selectSuggestion(event)">
      {{ event.title }}
   </div>
</div>
```

**Real-Time Search Flow:**
```
User types 'Con'
    ↓
searchQuery.next('Con')
    ↓
searchResults$ pipeline executes:
  1. distinctUntilChanged() - checks if different from last
  2. map() - filters events containing 'con'
    ↓
New filtered list emitted
    ↓
Header subscription receives 5 concerts
    ↓
suggestions array updated
    ↓
Template re-renders
    ↓
User sees matching concerts dropdown instantly
```

---

## 10. Summary: RxJS Reactive Architecture

### Key Components:

| Component | Purpose | Type |
|-----------|---------|------|
| `authState` | Holds current user & auth status | BehaviorSubject |
| `authState$` | Exposes auth state as observable | Observable |
| `searchQuery` | Holds current search term | BehaviorSubject |
| `searchResults$` | Exposes filtered events | Observable |
| `subject` | Holds events list | BehaviorSubject |
| `bookings` | Array of booking records | Array |

### Reactive Patterns Used:

1. **BehaviorSubject for State**: Holds current value, immediate emission to new subscribers
2. **Observable Streams**: Components subscribe to receive changes
3. **RxJS Operators**: Pipeline transformations (map, filter, distinctUntilChanged)
4. **Automatic UI Updates**: When state changes, all subscribers notified immediately
5. **Real-Time Data Flow**: User action → State update → Observable emit → UI render

### Benefits of This Architecture:

✅ **Real-time Updates**: UI updates instantly when state changes  
✅ **Decoupled Components**: Components don't know about each other  
✅ **Memory Efficient**: Observable subscriptions are managed  
✅ **Type-Safe**: TypeScript interfaces for all data  
✅ **Reactive**: Data flows push-based, not pull-based  
✅ **Composable**: Operators chain transformations  

---

## References

- **RxJS Documentation**: https://rxjs.dev/
- **Angular Docs**: https://angular.io/guide/rx-libraries
- **BehaviorSubject**: Observable that holds current state
- **Observable**: Data stream that emits values over time
- **Operators**: Functions that transform observable data

