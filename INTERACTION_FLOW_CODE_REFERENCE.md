# Interaction Flow Code Reference

## 🎯 Complete User Interaction & Service Request Flow

### **The Complete Pathway:**
```
User Interacts → Component Responds → Service Called → Data Returned → UI Updated
```

---

## 📍 CODE LOCATION 1: HOME PAGE - User Clicks Event Card

### **HTML: User Interaction Point** 
**File:** `src/app/home/home.html` (Lines 23-37)

```html
<!-- ===== USER INTERACTS WITH EVENT CARD ===== -->
<div class="cards-grid">
   @for (s of getGridSlides(); track $index; let i = $index) {
   
   <!-- 🔴 CLICK EVENT HANDLER -->
   <div class="card" 
      [class.highlight]="i < 3" 
      (click)="goTo(s.index)"           <!-- ← USER CLICKS HERE -->
      (keydown.enter)="goTo(s.index)">
      
      <!-- 🔵 DATA BINDING FROM SERVICE -->
      <div class="card-media">
         <img [src]="s.data.img" />
         <div class="overlay">
            <h4 class="card-title">{{ s.data.title }}</h4>
            <p class="card-date">{{ s.data.date }}</p>
            <p class="card-location">{{ s.data.description }}</p>
            <div class="card-price">{{ s.data.price }}</div>
         </div>
      </div>
   </div>
   }
</div>
```

**What's happening:**
- `(click)="goTo(s.index)"` - **User interaction**: Click on event
- `{{ s.data.title }}` - **Data binding**: Title from service
- `[src]="s.data.img"` - **Data binding**: Image from service
- Data flows: **Service → Component property → Template display**

---

## 📍 CODE LOCATION 2: HOME COMPONENT - Service Injection

### **TypeScript: Component + Service Integration**
**File:** `src/app/home/home.ts` (Lines 1-30)

```typescript
import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { register } from 'swiper/element/bundle';
import { Router } from '@angular/router';
import { DataEventService } from '../data-event-service/data-event.service';
import { EventItem } from '../data-event-service/data-event';

@Component({
   selector: 'app-home',
   standalone: true,
   imports: [CommonModule],
   schemas: [CUSTOM_ELEMENTS_SCHEMA],
   templateUrl: './home.html',
   styleUrls: ['./home.css'],
})
export class Home implements AfterViewInit {
   activeIndex = 0;
   slides: EventItem[] = [];           // ← Property to hold service data

   constructor(
      private host: ElementRef<HTMLElement>,
      private dataSrv: DataEventService,        // 🔴 SERVICE INJECTED
      private router: Router
   ) {
      // 🔴 SERVICE REQUEST IN CONSTRUCTOR
      this.slides = this.dataSrv.getEvents();   // ← Calls service method
   }
```

**Key Points:**
- Line 23: `private dataSrv: DataEventService` - **Dependency Injection**
- Line 27: `this.dataSrv.getEvents()` - **Service Request**
- Line 18: `slides: EventItem[]` - **Component property** holds returned data
- Service response stored → Used in template → Displayed to user

---

## 📍 CODE LOCATION 3: HOME COMPONENT - Event Handler

### **TypeScript: Click Handler Method**
**File:** `src/app/home/home.ts` (Lines 59-65)

```typescript
// 🔴 USER CLICKS CARD → THIS METHOD EXECUTES
goTo(index: number) {
   const slideData = this.slides[index];        // ← Get service data
   if (!slideData) return;
   
   // 🔴 NAVIGATION WITH PARAMETER
   // This passes event ID to next page
   this.router.navigate(['/ticket', slideData.id]);  // Example: /ticket/0
}
```

**The flow:**
1. User clicks card → `(click)="goTo(s.index)"`
2. Component method `goTo()` executed
3. Gets data from service response stored in `this.slides`
4. Extracts ID from data: `slideData.id`
5. Navigates to next page with ID: `/ticket/0`

---

## 📍 CODE LOCATION 4: HOME COMPONENT - Data Processing for Template

### **TypeScript: Getter Methods Return Data to Template**
**File:** `src/app/home/home.ts` (Lines 67-98)

```typescript
// 🟢 GETTER: Processes and returns data for template rendering
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
   return unique;  // ← Returns to template
}

// 🟢 GETTER: Returns grid data for template
getGridSlides(): any[] {
   const seen = new Set<string>();
   const order: number[] = [];
   for (const s of this.sortedSlides) {
      const key = `${s.title}|${s.date}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const idx = this.slides.findIndex((x) => x.title === s.title && x.date === s.date);
      if (idx >= 0) order.push(idx);
   }
   // Maps to { index, data } objects
   return order.map((i) => ({ index: i, data: this.slides[i] }));
}
```

**Template uses these:**
```html
@for (s of getGridSlides(); track $index)  <!-- Calls getGridSlides() -->
```

---

## 📍 CODE LOCATION 5: TICKET BUY PAGE - Route Parameter Extraction

### **TypeScript: Component Init → Service Called with Parameter**
**File:** `src/app/ticket-page/ticket-buy/ticket-buy.ts` (Lines 47-76)

```typescript
@Component({
   selector: 'app-ticket-buy',
   standalone: true,
   imports: [CommonModule, FormsModule, RouterLink],
   templateUrl: './ticket-buy.html',
   styleUrls: ['./ticket-buy.css']
})
export class TicketBuy implements OnInit {
   event?: EventItem;
   eventId!: number;
   couponCode = '';
   appliedDiscount = 0;
   message = '';
   quantities: { [ticketId: string]: number } = {};
   currentUserId = '';
   isAuthenticated = false;

   constructor(
      private route: ActivatedRoute,              // 🔴 Get route params
      private dataSrv: DataEventService,          // 🔴 Event service
      private authService: AuthService,           // 🔴 Auth service
      private pdfGeneratorService: PdfGeneratorService,  // 🔴 PDF service
      private router: Router
   ) { }

   ngOnInit(): void {
      // 🔴 SERVICE CALL 1: Get current user
      const currentUser = this.authService.getCurrentUser();
      if (currentUser) {
         this.currentUserId = currentUser.id;
         this.isAuthenticated = true;
      } else {
         this.isAuthenticated = false;
      }

      // 🔴 SERVICE CALL 2: Extract route parameter
      this.route.paramMap.subscribe(params => {
         const idStr = params.get('id');  // ← Gets :id from URL like /ticket/0
         if (!idStr) {
            this.router.navigate(['/']);
            return;
         }

         this.eventId = Number(idStr);
         
         // 🔴 SERVICE CALL 3: Fetch event by ID using parameter
         this.event = this.dataSrv.getEventById(this.eventId);

         if (!this.event) {
            this.router.navigate(['/']);
         } else {
            // Initialize quantities
            for (const t of this.event.tickets) {
               this.quantities[t.id] = 1;
            }
         }
      });
   }
```

**The flow:**
1. URL: `/ticket/0` contains parameter
2. `route.paramMap.subscribe()` extracts `id: 0`
3. `dataSrv.getEventById(0)` called with parameter
4. Service returns matching event
5. Component stores in `this.event`
6. Template displays event details

---

## 📍 CODE LOCATION 6: TICKET PAGE - User Applies Coupon

### **HTML: Two-way Binding + Click Handler**
**File:** `src/app/ticket-page/ticket-buy/ticket-buy.html` (Lines 42-52)

```html
<!-- 🔴 USER INTERACTION: COUPON INPUT & BUTTON -->
<div class="coupon mt-auto">
   <!-- 🔵 TWO-WAY BINDING: Input field -->
   <input name="coupon" 
      [(ngModel)]="couponCode"           <!-- ← Binds to component property -->
      placeholder="Enter coupon code (e.g SAVE20)" />
   
   <!-- 🔴 CLICK EVENT: Apply button -->
   <button type="button" (click)="applyCoupon()">Apply</button>
   
   <!-- 🔵 CONDITIONAL DISPLAY: Shows after service response -->
   @if (message) {
   <div class="coupon-msg" [class.success]="message.includes('✓')">
      {{ message }}  <!-- ← Message from service response -->
   </div>
   }
</div>
```

---

### **TypeScript: Component Method Calls Service**
**File:** `src/app/ticket-page/ticket-buy/ticket-buy.ts` (Lines 82-87)

```typescript
// 🔴 USER CLICKS APPLY BUTTON → THIS METHOD EXECUTES
applyCoupon(): void {
   // 🔴 SERVICE REQUEST: Apply coupon
   this.appliedDiscount = this.dataSrv.applyCoupon(this.couponCode);
   
   // 🟡 UPDATE COMPONENT STATE with service response
   this.message = this.appliedDiscount > 0
      ? `✓ Coupon applied: ${this.appliedDiscount}% discount`
      : '❌ Invalid coupon code';
   // Template updates automatically with new message
}
```

**The flow:**
1. User types coupon code: `[(ngModel)]="couponCode"` updates property
2. User clicks Apply button: `(click)="applyCoupon()"`
3. Component method executes
4. Service called: `dataSrv.applyCoupon(code)`
5. Service returns discount percentage or 0
6. Component updates `this.message`
7. Template displays new message: `{{ message }}`

---

## 📍 CODE LOCATION 7: TICKET PAGE - Add to Cart

### **HTML: Multiple Interactions**
**File:** `src/app/ticket-page/ticket-buy/ticket-buy.html` (Lines 60-76)

```html
<!-- 🔴 USER INTERACTION: QUANTITY SELECTOR -->
@if (getRemaining(t) > 0) {
   <!-- 🔵 TWO-WAY BINDING: Quantity input -->
   <div class="qty-wrap">
      <input type="number" 
         name="qty-{{ t.id }}" 
         [(ngModel)]="quantities[t.id]"    <!-- ← Binds to component -->
         min="1" 
         [max]="getRemaining(t)" 
         step="1" />
   </div>
   
   <!-- 🔴 CLICK EVENT: Add to cart button -->
   <button type="button" 
      (click)="addToCart(t)" 
      class="btn-add-cart">
      🛒 Add to Cart
   </button>
} @else {
   <!-- Alternative: Join waitlist if sold out -->
   <button type="button" 
      (click)="joinWaitlist(t)" 
      class="btn-waitlist">
      Join Waitlist
   </button>
}
```

---

### **TypeScript: Add to Cart Service Request**
**File:** `src/app/ticket-page/ticket-buy/ticket-buy.ts` (Approx lines 155-165)

```typescript
// 🔴 USER CLICKS "ADD TO CART" → THIS METHOD EXECUTES
addToCart(ticket: TicketCategory): void {
   const quantity = this.quantities[ticket.id] || 1;
   
   // Add to local cart
   this.cart.push({ ticket, qty: quantity });
   
   // Update total price
   this.totalCartPrice += ticket.price * quantity;
   
   // User feedback
   this.message = `✓ ${quantity} × ${ticket.type} added to cart`;
}
```

---

## 📍 CODE LOCATION 8: TICKET PAGE - Checkout with Multiple Services

### **HTML: Checkout Button**
**File:** `src/app/ticket-page/ticket-buy/ticket-buy.html` (Lines 138-142)

```html
<!-- 🔴 USER INTERACTION: CHECKOUT BUTTON -->
<button type="button" 
   class="btn btn-checkout" 
   (click)="checkoutCart()">      <!-- ← Triggers service chain -->
   🛍️ Proceed to Checkout
</button>
```

---

### **TypeScript: Multiple Services in Chain**
**File:** `src/app/ticket-page/ticket-buy/ticket-buy.ts` (Lines 205-255)

```typescript
// 🔴 USER CLICKS CHECKOUT → THIS METHOD EXECUTES
// This uses MULTIPLE SERVICES in sequence

// Get cart items to process
const itemsToProcess = this.cart.length > 0 ? this.cart : [...];

if (itemsToProcess.length === 0) return;

// 🔴 SERVICE CALL 1: Process bookings via DataEventService
if (this.cart.length > 0) {
   for (const cartItem of this.cart) {
      // Call booking service for each item
      const result = this.dataSrv.buyTicket(
         this.eventId, 
         cartItem.ticket.id, 
         cartItem.qty, 
         this.currentUserId
      );
      
      if (result.success && result.booking) {
         result.booking.discountApplied = this.appliedDiscount;
         result.booking.totalPrice = 
            this.ticketPriceAfterDiscount(cartItem.ticket) * cartItem.qty;
         
         if (!this.currentBooking) {
            this.currentBooking = result.booking;
         }
      }
   }
}

// Prepare QR code data
const firstItem = itemsToProcess[0];
const qrData = `${this.event.id}|${firstItem.ticket.section}|${this.event.date}`;
this.qrCodeData = qrData;

if (this.currentBooking) {
   this.currentBooking.qrCode = qrData;
}

// 🔴 SERVICE CALL 2: Generate QR code via QRCode library
QRCode.toDataURL(qrData, {
   width: 300,
   margin: 2,
   color: {
      dark: '#000000',
      light: '#ffffff'
   }
}).then((url: string) => {
   this.qrCodeDataUrl = url;  // ← Display QR code in template
}).catch((err: Error) => {
   console.error('Error generating QR code:', err);
});

// Update UI state
this.showPaymentModal = false;
this.showQRCodeDisplay = true;
this.showContinueShopping = false;
this.message = '✓ Payment successful! Your QR code is ready';
// Template updates automatically to show QR code
```

---

## 📊 COMPLETE INTERACTION FLOW CHART

```
┌────────────────────────────────────────────────────────────┐
│                 HOME PAGE INTERACTION                      │
└────────────────────────────────────────────────────────────┘

1. PAGE LOADS
   ↓
2. Home Component initializes
   ↓
3. Constructor injects DataEventService
   ↓
4. Service called: this.dataSrv.getEvents()
   ↓
5. Data stored: this.slides = [Event1, Event2, ...]
   ↓
6. Template renders: @for (s of getGridSlides())
   ↓
7. User SEES event cards with:
   - Event image: [src]="s.data.img"
   - Event title: {{ s.data.title }}
   - Event date: {{ s.data.date }}
   - Event price: {{ s.data.price }}
   ↓
8. USER CLICKS EVENT CARD
   ↓
9. HTML handler triggers: (click)="goTo(s.index)"
   ↓
10. Component method executes: goTo(index)
    ↓
11. Gets data: const slideData = this.slides[index]
    ↓
12. Navigates: router.navigate(['/ticket', slideData.id])
    ↓
13. URL changes: /ticket/0
    ↓

┌────────────────────────────────────────────────────────────┐
│              TICKET PAGE INTERACTION                       │
└────────────────────────────────────────────────────────────┘

14. TicketBuy Component loads
    ↓
15. Constructor injects multiple services
    ↓
16. ngOnInit() executes
    ↓
17. THREE service calls:
    a) authService.getCurrentUser() → Gets logged-in user
    b) route.paramMap → Extracts :id (0) from URL
    c) dataSrv.getEventById(0) → Fetches event by ID
    ↓
18. Data stored:
    - this.event = EventItem
    - this.currentUserId = string
    - this.isAuthenticated = boolean
    ↓
19. Template renders ticket details:
    - Event image: [src]="event.img"
    - Event title: {{ event.title }}
    - Available tickets: @for (t of event.tickets)
    - Coupon input: [(ngModel)]="couponCode"
    - Quantity selector: [(ngModel)]="quantities[t.id]"
    ↓
20. USER INTERACTION 1: APPLY COUPON
    ↓
21. User types: Input (click) → (click)="applyCoupon()"
    ↓
22. Service called: dataSrv.applyCoupon(couponCode)
    ↓
23. Service returns: discount percentage
    ↓
24. Component updates: this.message = "✓ Coupon applied"
    ↓
25. Template updates: {{ message }} displays
    ↓
26. USER INTERACTION 2: ADD TO CART
    ↓
27. User selects qty: [(ngModel)]="quantities[t.id]"
    ↓
28. User clicks: (click)="addToCart(t)"
    ↓
29. Component adds to cart: this.cart.push(item)
    ↓
30. Component updates: this.message = "✓ Added to cart"
    ↓
31. Template updates: Shows cart items
    ↓
32. USER INTERACTION 3: CHECKOUT
    ↓
33. User clicks: (click)="checkoutCart()"
    ↓
34. MULTIPLE SERVICES EXECUTED:
    a) dataSrv.buyTicket() → Books ticket
    b) QRCode.toDataURL() → Generates QR
    ↓
35. Component updates state:
    - this.currentBooking = booking
    - this.qrCodeDataUrl = QR image
    - this.showQRCodeDisplay = true
    ↓
36. Template displays:
    - QR code image
    - Booking confirmation
    - Download options
    ↓
37. USER DOWNLOADS PDF
    ↓

END
```

---

## 📋 SUMMARY: Components & Services

| Layer | Component | Service | Interaction |
|-------|-----------|---------|-------------|
| **Home Page** | Home | DataEventService | getEvents() |
| **User Click** | Home | Router | navigate() |
| **Ticket Page** | TicketBuy | AuthService | getCurrentUser() |
| **Route Param** | TicketBuy | DataEventService | getEventById(:id) |
| **Coupon** | TicketBuy | DataEventService | applyCoupon() |
| **Add Cart** | TicketBuy | (local) | Add item |
| **Checkout** | TicketBuy | DataEventService | buyTicket() |
| **PDF** | TicketBuy | PdfGeneratorService | generateTicketPDF() |
| **QR Code** | TicketBuy | QRCode | toDataURL() |

