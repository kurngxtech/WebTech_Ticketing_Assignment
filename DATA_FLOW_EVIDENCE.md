# Data Flow & Interaction Evidence

## 📊 Complete Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER INTERACTION FLOW                        │
└─────────────────────────────────────────────────────────────────┘

1. HOME PAGE INTERACTION
   ├─ User visits app
   ├─ Home Component loads (app.routes.ts: { path: '', component: Home })
   └─ DataEventService called immediately

2. EVENT DISCOVERY
   ├─ Service retrieves event data
   ├─ UI displays carousel (Swiper)
   ├─ UI displays event grid
   └─ User sees events

3. EVENT SELECTION
   ├─ User clicks event card
   ├─ Component method triggered (click handler)
   ├─ Navigation happens
   └─ Details page loads

4. TICKET PURCHASE
   ├─ Component loads ticket page
   ├─ Service fetches event details by ID
   ├─ User selects quantity
   ├─ User proceeds to checkout
   ├─ Service processes booking
   ├─ PDF generated
   └─ Booking confirmed
```

---

## 🔍 EVIDENCE 1: Routing Configuration

**File:** `src/app/app.routes.ts`

```typescript
export const routes: Routes = [
  { path: '', component: Home },                                    // ← Home page route
  { path: 'ticket/:id', component: TicketBuy },                   // ← Ticket purchase (with parameter)
  { path: 'login', component: UserLoginPage },
  { path: 'my-bookings', component: MyBookings },
  { path: 'ticket-list', component: TicketList },
  // ... more routes
];
```

**What this shows:**
- ✅ **Route definition** for Home page (`path: ''`)
- ✅ **Route definition** for Ticket Purchase (`path: 'ticket/:id'`)
- ✅ **Dynamic parameter** `:id` for passing event ID
- ✅ **Navigation pathway** from home → ticket purchase

---

## 🔍 EVIDENCE 2: Home Component - UI Interaction

**File:** `src/app/home/home.html`

```html
<!-- CAROUSEL (Swiper) - User can scroll/interact -->
<swiper-container class="mySwiper" 
   slides-per-view="1" 
   space-between="30" 
   autoplay-delay="3000">
   @for (slide of swiperSlides; track slide) {
   <swiper-slide>
      <a [href]="slide.link">
         <div class="slide-bg" 
            [style.backgroundImage]="'url(' + slide.img + ')'">
         </div>
      </a>
   </swiper-slide>
   }
</swiper-container>

<!-- EVENT GRID - User clicks on event card -->
<div class="cards-grid">
   @for (s of getGridSlides(); track $index) {
   <div class="card" 
      (click)="goTo(s.index)"                              <!-- ← USER INTERACTION -->
      (keydown.enter)="goTo(s.index)">
      <img [src]="s.data.img" />
      <h4>{{ s.data.title }}</h4>
      <p>{{ s.data.date }}</p>
      <div class="card-price">{{ s.data.price }}</div>
   </div>
   }
</div>
```

**What this shows:**
- ✅ **UI Binding** `[style.backgroundImage]` - binds data to view
- ✅ **User Click Event** `(click)="goTo(s.index)"` - triggers component method
- ✅ **Component Method** `goTo()` - responds to user interaction
- ✅ **Data Display** `{{ s.data.title }}` - displays service data in template

---

## 🔍 EVIDENCE 3: Home Component - Service Integration

**File:** `src/app/home/home.ts`

```typescript
// STEP 1: Dependency Injection - Service injected into component
export class Home implements AfterViewInit {
   slides: EventItem[] = [];

   constructor(
      private host: ElementRef<HTMLElement>,
      private dataSrv: DataEventService,              // ← SERVICE INJECTED
      private router: Router
   ) {
      // STEP 2: Service called immediately in constructor
      this.slides = this.dataSrv.getEvents();         // ← SERVICE REQUEST
   }

   // STEP 3: Data getter with business logic
   get sortedSlides(): any[] {
      return [...this.slides].sort((a, b) => {
         const da = new Date(a.date).getTime() || 0;
         const db = new Date(b.date).getTime() || 0;
         return db - da;  // Sort by date descending
      });
   }

   // STEP 4: Response to user click
   goTo(index: number) {
      const slideData = this.slides[index];
      if (!slideData) return;
      // STEP 5: Navigate to ticket purchase with ID parameter
      this.router.navigate(['/ticket', slideData.id]);  // ← NAVIGATION
   }

   // STEP 6: Get data for template rendering
   get swiperSlides(): any[] {
      const seen = new Set<string>();
      const unique: any[] = [];
      for (const s of this.sortedSlides) {
         const key = `${s.title}|${s.date}`;
         if (seen.has(key)) continue;
         seen.add(key);
         unique.push(s);
         if (unique.length >= 4) break;  // Max 4 slides
      }
      return unique;
   }
}
```

**What this shows:**
- ✅ **Dependency Injection** (line 20) - Service injected
- ✅ **Service Request** (line 24) - `getEvents()` called
- ✅ **Data Processing** (lines 28-35) - Component processes service data
- ✅ **Template Binding** (line 71) - Data sent to template via `get swiperSlides()`
- ✅ **Event Handler** (lines 60-65) - `goTo()` responds to user click
- ✅ **Navigation** (line 64) - Router navigates with parameter

---

## 🔍 EVIDENCE 4: Ticket Purchase Component - Service Integration

**File:** `src/app/ticket-page/ticket-buy/ticket-buy.ts`

```typescript
// STEP 1: Multiple services injected for different concerns
export class TicketBuy implements OnInit {
   event?: EventItem;
   eventId!: number;
   couponCode = '';
   appliedDiscount = 0;
   cart: Array<{ ticket: TicketCategory; qty: number }> = [];

   constructor(
      private route: ActivatedRoute,              // ← Route parameter extraction
      private dataSrv: DataEventService,          // ← Event data service
      private authService: AuthService,           // ← User authentication
      private pdfGeneratorService: PdfGeneratorService,  // ← PDF generation
      private router: Router
   ) { }

   // STEP 2: On component init
   ngOnInit(): void {
      // Get current user
      const currentUser = this.authService.getCurrentUser();  // ← AUTH SERVICE
      if (currentUser) {
         this.currentUserId = currentUser.id;
         this.isAuthenticated = true;
      }

      // STEP 3: Extract route parameter (from /ticket/:id)
      this.route.paramMap.subscribe(params => {
         const idStr = params.get('id');              // ← GET PARAM
         if (!idStr) {
            this.router.navigate(['/']);
            return;
         }

         // STEP 4: Call service with parameter to fetch event
         this.eventId = Number(idStr);
         this.event = this.dataSrv.getEventById(this.eventId);  // ← SERVICE REQUEST

         if (!this.event) {
            this.router.navigate(['/']);
         } else {
            // STEP 5: Initialize quantities for each ticket
            for (const t of this.event.tickets) {
               this.quantities[t.id] = 1;
            }
         }
      });
   }

   // STEP 6: User buys ticket
   buyTicket() {
      if (!this.currentUserId) {
         this.message = 'Please login to buy ticket';
         return;
      }

      // STEP 7: Service processes booking
      const result = this.dataSrv.buyTicket(
         this.eventId,
         selectedTicketId,
         qty,
         this.currentUserId
      );

      if (result.success && result.booking) {
         // STEP 8: Generate PDF with booking data
         await this.pdfGeneratorService.generateTicketPDF(
            result.booking.id,
            result.booking.qrCode,
            this.event.title,
            ticketCategory.type,
            result.booking.quantity,
            result.booking.totalPrice,
            this.event.date,
            currentUser.fullName
         );
      }
   }
}
```

**What this shows:**
- ✅ **Multiple Service Injection** - Different services for different concerns
- ✅ **Route Parameter Extraction** - Gets `:id` from URL
- ✅ **Service Calls** - `getEventById()`, `getCurrentUser()`, `buyTicket()`
- ✅ **Data Flow Chain** - Route param → Service → Component logic → Another service
- ✅ **User Interaction Response** - `buyTicket()` triggered by user

---

## 📊 DATA FLOW DIAGRAM: Home → Ticket Purchase

```
USER INTERACTION
      ↓
┌─────────────────────────────────────────────────────────┐
│ 1. HOME PAGE LOADS                                      │
│    app.routes.ts: { path: '', component: Home }        │
└─────────────────────┬───────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│ 2. COMPONENT INITIALIZATION                             │
│    Home Component NgOnInit() called                      │
└─────────────────────┬───────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│ 3. SERVICE REQUEST                                      │
│    DataEventService.getEvents()                         │
│    ↓                                                     │
│    Returns: EventItem[] (from mock data)               │
└─────────────────────┬───────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│ 4. TEMPLATE BINDING                                     │
│    Component property: slides = []                      │
│    Template: @for (s of getGridSlides())               │
│    ↓                                                     │
│    HTML Rendered with event data                        │
└─────────────────────┬───────────────────────────────────┘
                      ↓
              USER SEES UI
                      ↓
           USER CLICKS EVENT CARD
                      ↓
┌─────────────────────────────────────────────────────────┐
│ 5. USER INTERACTION - CLICK EVENT                       │
│    (click)="goTo(s.index)" triggered                    │
│    Component Method: goTo(index)                        │
└─────────────────────┬───────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│ 6. NAVIGATION                                           │
│    router.navigate(['/ticket', slideData.id])           │
│    Route changes to: /ticket/0 (example)               │
└─────────────────────┬───────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│ 7. NEW COMPONENT LOADS                                  │
│    app.routes.ts: { path: 'ticket/:id',               │
│                     component: TicketBuy }             │
└─────────────────────┬───────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│ 8. TICKET BUY COMPONENT INIT                            │
│    TicketBuy Component OnInit() called                  │
│    route.paramMap.subscribe() → Gets :id               │
└─────────────────────┬───────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│ 9. SERVICE REQUEST WITH PARAMETER                       │
│    DataEventService.getEventById(id)                    │
│    ↓                                                     │
│    Returns: EventItem (specific event)                 │
└─────────────────────┬───────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│ 10. TICKET PAGE RENDERED                                │
│     Template displays event details                     │
│     User can select tickets and proceed                 │
└─────────────────────┬───────────────────────────────────┘
                      ↓
             USER SELECTS TICKETS
                      ↓
┌─────────────────────────────────────────────────────────┐
│ 11. USER INTERACTION - BUY BUTTON                       │
│     (click)="buyTicket()" triggered                     │
│     Component Method: buyTicket()                       │
└─────────────────────┬───────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│ 12. BOOKING SERVICE REQUEST                             │
│     DataEventService.buyTicket(eventId, ticketId, qty)  │
│     ↓                                                    │
│     Service updates internal state                      │
│     Returns: { success, booking, qrCode }              │
└─────────────────────┬───────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│ 13. PDF GENERATION SERVICE                              │
│     PdfGeneratorService.generateTicketPDF()             │
│     ↓                                                    │
│     Generates QR code                                   │
│     Creates PDF with booking info                       │
│     Auto-downloads: ticket_booking_001.pdf             │
└─────────────────────┬───────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│ 14. CONFIRMATION DISPLAYED                              │
│     Show booking confirmation                           │
│     Display QR code                                     │
│     Offer download/print options                        │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 SERVICE LAYER - Angular Components Calling Services

### **Home Component → DataEventService**

```
Home Component (UI Layer)
    ↓
    ├─ constructor() {
    │   this.slides = this.dataSrv.getEvents()    ← SERVICE CALL
    │ }
    ↓
DataEventService (Business Logic Layer)
    ↓
    ├─ getEvents(): EventItem[] {
    │   return this.data;  ← Returns mock data
    │ }
    ↓
Response: EventItem[]
    ↓
Home Component uses data
    ↓
Template renders UI
```

### **TicketBuy Component → Multiple Services**

```
TicketBuy Component (UI Layer)
    ↓
    ├─ AuthService.getCurrentUser()      ← Get logged-in user
    ├─ DataEventService.getEventById()   ← Get event details
    ├─ DataEventService.buyTicket()      ← Process booking
    └─ PdfGeneratorService.generateTicketPDF()  ← Generate ticket
    ↓
Services (Business Logic Layer)
    ↓
    ├─ AuthService: Returns User or null
    ├─ DataEventService: Returns EventItem or Booking
    └─ PdfGeneratorService: Generates and downloads PDF
    ↓
Response received by Component
    ↓
Component updates state
    ↓
Template re-renders with new state
```

---

## 📋 KEY INTERACTION PATTERNS EVIDENCE

### **Pattern 1: Constructor-based Service Initialization**
```typescript
// Home Component
constructor(private dataSrv: DataEventService) {
    this.slides = this.dataSrv.getEvents();  // ← Service called immediately
}
```

### **Pattern 2: Event Handler triggering Service Call**
```typescript
// Home Component HTML
<div (click)="goTo(s.index)">...</div>

// Home Component TypeScript
goTo(index: number) {
    const slideData = this.slides[index];
    this.router.navigate(['/ticket', slideData.id]);  // ← Navigation triggered
}
```

### **Pattern 3: Route Parameter triggering Service Call**
```typescript
// TicketBuy Component
ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
        const id = params.get('id');  // ← Extract from URL
        this.event = this.dataSrv.getEventById(Number(id));  // ← Service call
    });
}
```

### **Pattern 4: User Interaction triggering Multiple Services**
```typescript
// TicketBuy Component
buyTicket() {
    // Service 1: Book ticket
    const result = this.dataSrv.buyTicket(this.eventId, ticketId, qty, userId);
    
    // Service 2: Generate PDF
    await this.pdfGeneratorService.generateTicketPDF(...);
    
    // Result: User sees booking confirmation and downloads PDF
}
```

---

## 📊 Summary Table: Data Flow Pathways

| Pathway | Start | Component | Service | Action | End |
|---------|-------|-----------|---------|--------|-----|
| **1** | App loads | Home | DataEventService | getEvents() | Display carousel & grid |
| **2** | User clicks | Home | Router | navigate() | Go to ticket page |
| **3** | Page loads | TicketBuy | ActivatedRoute | Get :id param | Extract event ID |
| **4** | Route param | TicketBuy | DataEventService | getEventById() | Display event details |
| **5** | User input | TicketBuy | DataEventService | buyTicket() | Create booking |
| **6** | Booking created | TicketBuy | PdfGeneratorService | generateTicketPDF() | Download ticket |

---

## ✅ EVIDENCE SUMMARY

**You have demonstrated:**

1. ✅ **UI Components** - Home, TicketBuy, etc.
2. ✅ **Service Layer** - DataEventService, AuthService, PdfGeneratorService
3. ✅ **User Interaction** - Click handlers: `(click)="goTo()"`
4. ✅ **Template Binding** - Data to UI: `{{ s.data.title }}`
5. ✅ **Service Requests** - Component calls: `dataSrv.getEvents()`
6. ✅ **Route Parameters** - Dynamic routing: `/ticket/:id`
7. ✅ **Navigation** - `router.navigate()`
8. ✅ **State Management** - Component properties updating with service data
9. ✅ **Multi-Service Flow** - One action triggering multiple services

---

**File Locations:**
- Routing: `src/app/app.routes.ts`
- Home Component: `src/app/home/home.ts` + `home.html`
- Ticket Component: `src/app/ticket-page/ticket-buy/ticket-buy.ts`
- Services: `src/app/data-event-service/`, `src/app/auth/`, `src/app/services/`

