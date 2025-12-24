# Ticket Generation Flow - QR Code & PDF Conversion

This document provides exact code references for the ticket generation flow when a user purchases tickets, including PDF conversion with QR code encoding and downloadable ticket functionality.

---

## 1. Ticket Purchase to Booking Creation

### Location 1: TicketBuy Component - Buy Ticket Process

**File:** `src/app/ticket-page/ticket-buy/ticket-buy.ts` (Lines 115-140)

```typescript
purchase(ticket: TicketCategory, qty = 1): void {
   // Check if user is authenticated
   if (!this.isAuthenticated) {
      this.message = '🔐 Please login to purchase tickets';
      setTimeout(() => {
         this.router.navigate(['/login']);
      }, 2000);
      return;
   }

   if (this.getRemaining(ticket) < qty) {
      this.message = 'Not enough tickets available';
      return;
   }

   const result = this.dataSrv.buyTicket(this.eventId, ticket.id, qty, this.currentUserId);

   if (result.success && result.booking) {
      this.currentBooking = result.booking;
      this.currentBooking.discountApplied = this.appliedDiscount;
      this.currentBooking.totalPrice = this.ticketPriceAfterDiscount(ticket) * qty;
      this.showPaymentModal = true;
      this.bookingInProgress = true;
      this.message = '';

      // Refresh event data
      this.event = this.dataSrv.getEventById(this.eventId);
   } else {
      this.message = result.message || 'Purchase failed';
   }
}
```

**What it does:**
- **Lines 118-125**: Validates user is authenticated
- **Lines 127-130**: Checks ticket availability
- **Line 132**: Calls DataEventService to create booking
- **Lines 134-140**: Stores booking object in component state
- Creates booking record with status, date, and initial data

**Process Flow:**
```
User clicks "Purchase"
    ↓
validate authentication
    ↓
check ticket availability
    ↓
dataSrv.buyTicket() creates booking
    ↓
booking stored in component.currentBooking
    ↓
payment modal shows
```

---

### Location 2: DataEventService - Create Booking with QR Data

**File:** `src/app/data-event-service/data-event.service.ts` (Lines 197-223)

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
   this.subject.next([...this.data]);

   return {
      success: true,
      message: 'Purchase successful',
      remaining: t.total - t.sold,
      booking
   };
}
```

**What it does:**
- **Line 207**: Generates unique booking ID
- **Lines 209-211**: Increments ticket sold count
- **Line 213**: Creates booking object with all ticket details
- **Line 214**: **IMPORTANT**: `generateQRCode()` - Generates initial QR code
- **Lines 216-217**: Saves booking to array and localStorage
- **Line 218**: Broadcasts event update via BehaviorSubject
- Returns success response with booking object

**Booking Data Structure:**
```typescript
{
  id: "booking_1",
  eventId: 123,
  userId: "user_456",
  ticketCategoryId: "vip_001",
  quantity: 2,
  pricePerTicket: 50,
  totalPrice: 100,
  discountApplied: 0,
  status: "confirmed",
  bookingDate: "2025-01-20T10:30:00Z",
  qrCode: "QR_1705756200000_abc123",  // ← Initial QR data
  checkedIn: false
}
```

---

### Location 3: DataEventService - Generate QR Code String

**File:** `src/app/data-event-service/data-event.service.ts` (Lines 378-380)

```typescript
private generateQRCode(): string {
   return `QR_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}
```

**What it does:**
- Generates unique QR code identifier
- Format: `QR_[timestamp]_[randomString]`
- Example: `QR_1705756200000_x8k4n2`
- Stored in booking.qrCode property

---

## 2. QR Code Generation from Booking Data

### Location 4: TicketBuy Component - Process Payment & Generate QR

**File:** `src/app/ticket-page/ticket-buy/ticket-buy.ts` (Lines 200-250)

```typescript
processPayment(): void {
   // Generate QR code using qrcode library
   if (!this.event) return;

   // Process all items in cart or single booking
   const itemsToProcess = this.cart.length > 0 ? this.cart :
      (this.currentBooking ? [{ ticket: this.event.tickets.find(t => t.id === this.currentBooking!.ticketCategoryId)!, qty: this.currentBooking.quantity }] : []);

   if (itemsToProcess.length === 0) return;

   // If cart has items, create bookings for each cart item
   if (this.cart.length > 0) {
      for (const cartItem of this.cart) {
         const result = this.dataSrv.buyTicket(this.eventId, cartItem.ticket.id, cartItem.qty, this.currentUserId);
         if (result.success && result.booking) {
            result.booking.discountApplied = this.appliedDiscount;
            result.booking.totalPrice = this.ticketPriceAfterDiscount(cartItem.ticket) * cartItem.qty;
            if (!this.currentBooking) {
               this.currentBooking = result.booking;
            }
         }
      }
   }

   // Generate QR for the first item or use cart
   const firstItem = itemsToProcess[0];
   const qrData = `${this.event.id}|${firstItem.ticket.section || 'GENERAL'}|${this.event.date}`;
   this.qrCodeData = qrData;

   if (this.currentBooking) {
      this.currentBooking.qrCode = qrData;
   }

   // Generate QR code image using qrcode library
   QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
         dark: '#000000',
         light: '#ffffff'
      }
   }).then((url: string) => {
      this.qrCodeDataUrl = url;
   }).catch((err: Error) => {
      console.error('Error generating QR code:', err);
   });

   this.showPaymentModal = false;
   this.showQRCodeDisplay = true;
   this.showContinueShopping = false;
   this.message = '✓ Payment successful! Your QR code is ready';
}
```

**What it does:**
- **Line 230**: Creates QR data string: `{eventId}|{seatSection}|{eventDate}`
- Example: `123|VIP|2025-01-15`
- **Lines 234-243**: **CRITICAL**: `QRCode.toDataURL()` - Converts QR data to image
  - Width: 300px
  - Margin: 2px
  - Color: Black on white
  - Returns: Data URL (image/png)
- **Line 244**: Stores QR image data URL in `qrCodeDataUrl`
- **Line 245**: Shows QR code display modal to user

**QR Code Generation Process:**
```
QR Data String: "123|VIP|2025-01-15"
    ↓
QRCode.toDataURL(qrData, options)
    ↓
qrcode library encodes to image
    ↓
Returns: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
    ↓
Stores in this.qrCodeDataUrl
    ↓
UI renders <img [src]="qrCodeDataUrl">
```

---

## 3. PDF Generation with QR Code Integration

### Location 5: PdfGeneratorService - Main PDF Generation Method

**File:** `src/app/services/pdf-generator.service.ts` (Lines 23-128)

```typescript
async generateTicketPDF(
   bookingId: string,
   qrCodeData: string,
   eventTitle: string,
   ticketType: string,
   quantity: number,
   totalPrice: number,
   eventDate: string,
   userName: string
): Promise<void> {
   try {
      // Step 1: Generate QR code image from data
      const qrCodeImage = await QRCode.toDataURL(qrCodeData, {
         width: 200,
         margin: 2,
         color: {
            dark: '#000000',
            light: '#ffffff'
         }
      });

      // Step 2: Create PDF document
      const pdf = new jsPDF('portrait', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Define colors
      const primaryColor: [number, number, number] = [254, 183, 6];      // #feb706 (yellow)
      const darkColor: [number, number, number] = [15, 15, 15];          // #0f0f0f (dark)
      const lightGray: [number, number, number] = [245, 245, 245];       // Light gray
      const borderColor: [number, number, number] = [200, 200, 200];     // Border gray

      let yPosition = 10;

      // Step 3: Add header section (yellow background)
      pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      pdf.rect(0, 0, pageWidth, 30, 'F');

      // Step 4: Add title
      pdf.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(24);
      pdf.text('BOOKING TICKET', pageWidth / 2, 20, { align: 'center' });

      yPosition = 40;

      // Step 5: Add booking info section (light gray background)
      pdf.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      pdf.rect(10, yPosition, pageWidth - 20, 50, 'F');

      pdf.setFont('Helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.setTextColor(darkColor[0], darkColor[1], darkColor[2]);

      const infoMargin = 15;
      const lineHeight = 10;

      // Add booking details
      pdf.text(`Booking ID: ${bookingId}`, infoMargin, yPosition + 8);
      pdf.text(`Customer: ${userName}`, infoMargin, yPosition + 18);
      pdf.text(`Event: ${eventTitle}`, infoMargin, yPosition + 28);
      pdf.text(`Date: ${eventDate}`, infoMargin, yPosition + 38);
      pdf.text(`Ticket Type: ${ticketType}`, pageWidth / 2, yPosition + 8);
      pdf.text(`Quantity: ${quantity}`, pageWidth / 2, yPosition + 18);
      pdf.text(`Total Price: $ ${totalPrice}`, pageWidth / 2, yPosition + 28);

      yPosition += 60;

      // Step 6: Add QR code section with border
      const qrSize = 90;
      const qrMarginLeft = (pageWidth - qrSize) / 2;

      // Draw QR border
      pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      pdf.setLineWidth(1);
      pdf.rect(qrMarginLeft - 5, yPosition - 5, qrSize + 10, qrSize + 10);

      // Step 7: Add QR code image to PDF
      pdf.addImage(qrCodeImage, 'PNG', qrMarginLeft, yPosition, qrSize, qrSize);

      yPosition += qrSize + 15;

      // Step 8: Add QR code data string
      pdf.setFont('Helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);

      const qrDataX = 15;
      const qrDataMaxWidth = pageWidth - 30;
      const qrDataLines = pdf.splitTextToSize(`QR Code Data: ${qrCodeData}`, qrDataMaxWidth);

      pdf.text('QR Code Data:', qrDataX, yPosition);
      pdf.setFont('Courier', 'normal');
      pdf.setFontSize(8);
      pdf.text(qrDataLines, qrDataX, yPosition + 5);

      yPosition = pageHeight - 30;

      // Step 9: Add footer
      pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      pdf.setLineWidth(0.5);
      pdf.line(10, yPosition, pageWidth - 10, yPosition);

      pdf.setFont('Helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Please save this ticket and show the QR code for check-in', pageWidth / 2, yPosition + 10, { align: 'center' });
      pdf.text(`Generated: ${new Date().toLocaleString('en-US')}`, pageWidth / 2, yPosition + 20, { align: 'center' });

      // Step 10: Download PDF
      pdf.save(`ticket_${bookingId}.pdf`);
   } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
   }
}
```

**What it does:**

| Step | Action | Code | Output |
|------|--------|------|--------|
| 1 | Generate QR image | `QRCode.toDataURL()` | PNG data URL |
| 2 | Create PDF | `new jsPDF()` | PDF document object |
| 3 | Yellow header | `pdf.setFillColor(254, 183, 6)` | Yellow background |
| 4 | Header title | `pdf.text('BOOKING TICKET')` | Large bold text |
| 5 | Info section | `pdf.setFillColor(245, 245, 245)` | Light gray background |
| 6 | Booking details | `pdf.text()` x 7 | All ticket information |
| 7 | QR border | `pdf.rect()` | Border around QR |
| 8 | QR image | `pdf.addImage()` | Actual QR code image |
| 9 | QR data text | `pdf.text()` | Reference string |
| 10 | Download | `pdf.save()` | Browser downloads PDF |

---

## 4. PDF Structure Layout

### Location 6: PDF Document Structure

**File:** `src/app/services/pdf-generator.service.ts` (PDF Layout)

```
PDF DOCUMENT (A4 Portrait, 210mm x 297mm)
┌────────────────────────────────────────────────────┐
│ [0-30mm]  YELLOW HEADER SECTION (#feb706)          │
│ ┌──────────────────────────────────────────────────┤
│ │  "BOOKING TICKET"  (24pt, bold, dark)            │
│ └──────────────────────────────────────────────────┘
│                                                    │
│ [40-90mm]  LIGHT GRAY INFO SECTION (#f5f5f5)      │
│ ┌──────────────────────────────────────────────────┤
│ │ Booking ID: booking_123                          │
│ │ Customer: John Doe                               │
│ │ Event: Concert 2025                              │
│ │ Date: 2025-01-15                                 │
│ │                                                  │
│ │              Ticket Type: VIP                    │
│ │              Quantity: 2                         │
│ │              Total Price: $ 500                  │
│ └──────────────────────────────────────────────────┘
│                                                    │
│ [100-200mm]  QR CODE SECTION (centered)           │
│ ┌──────────────────────────────────────────────────┤
│ │                                                  │
│ │          ┌──────────────────────┐                │
│ │          │                      │                │
│ │          │     QR CODE IMAGE    │ (90x90mm)     │
│ │          │    (PNG, 300x300px)  │                │
│ │          │                      │                │
│ │          └──────────────────────┘                │
│ │                                                  │
│ │  QR Code Data:                                   │
│ │  123|VIP|2025-01-15                              │
│ └──────────────────────────────────────────────────┘
│                                                    │
│ [260-297mm]  FOOTER SECTION                       │
│ ┌──────────────────────────────────────────────────┤
│ │ ────────────────────────────────────────────     │
│ │ Please save this ticket and show the QR code     │
│ │ for check-in                                     │
│ │ Generated: 1/20/2025, 10:30:00 AM               │
│ └──────────────────────────────────────────────────┘
```

---

## 5. Download PDF from TicketBuy Component

### Location 7: TicketBuy - Download PDF After Payment

**File:** `src/app/ticket-page/ticket-buy/ticket-buy.ts` (Lines 309-327)

```typescript
/**
 * Download complete ticket as PDF
 */
downloadTicketPDF(): void {
   if (!this.currentBooking || !this.event) return;

   const ticketCategory = this.event.tickets.find(t => t.id === this.currentBooking!.ticketCategoryId);
   if (!ticketCategory) return;

   const userName = this.authService.getCurrentUser()?.fullName || 'Guest';

   this.pdfGeneratorService.generateTicketPDF(
      this.currentBooking.id,
      this.qrCodeData,
      this.event.title,
      ticketCategory.type,
      this.currentBooking.quantity,
      this.currentBooking.totalPrice,
      this.event.date,
      userName
   ).catch(error => {
      console.error('Error generating PDF:', error);
   });
}
```

**What it does:**
- **Line 315**: Gets ticket category details
- **Line 318**: Gets current user name
- **Lines 320-330**: Calls PDF generator with all booking information
- Passes:
  - `currentBooking.id` - Booking ID for PDF filename
  - `qrCodeData` - QR data to encode
  - `event.title` - Event name
  - `ticketCategory.type` - Ticket category (VIP, General, etc.)
  - `quantity` - Number of tickets
  - `totalPrice` - Total cost
  - `eventDate` - Event date
  - `userName` - Customer name

**User Flow:**
```
User clicks "Download PDF" button
    ↓
downloadTicketPDF() executes
    ↓
Retrieves all booking details
    ↓
Calls pdfGeneratorService.generateTicketPDF()
    ↓
Service generates QR image from qrCodeData
    ↓
Service creates PDF with all sections
    ↓
pdf.save(`ticket_${bookingId}.pdf`)
    ↓
Browser downloads file automatically
```

---

## 6. Download PDF from My Bookings Component

### Location 8: MyBookings - Download Existing Ticket PDF

**File:** `src/app/user/my-bookings/my-bookings.ts` (Lines 211-245)

```typescript
downloadTicket(bookingId: string) {
   const bookingObj = this.dataEventService.getBookingById(bookingId);
   if (!bookingObj) {
      console.error('Booking not found');
      return;
   }

   const event = this.dataEventService.getEventById(bookingObj.eventId);
   if (!event) {
      console.error('Event not found');
      return;
   }

   const ticketCategory = event.tickets.find(t => t.id === bookingObj.ticketCategoryId);
   if (!ticketCategory) {
      console.error('Ticket category not found');
      return;
   }

   const userName = this.authService.getCurrentUser()?.fullName || 'Guest';

   // Build QR code data
   const qrCodeData = bookingObj.qrCode || `${bookingObj.id}|${ticketCategory.section || 'GENERAL'}|${event.date}`;

   // Generate PDF
   this.pdfGeneratorService.generateTicketPDF(
      bookingObj.id,
      qrCodeData,
      event.title,
      ticketCategory.type,
      bookingObj.quantity,
      bookingObj.totalPrice,
      event.date,
      userName
   ).catch(error => {
      console.error('Error generating PDF:', error);
   });
}
```

**What it does:**
- **Line 212**: Gets booking from data service
- **Line 218**: Gets associated event
- **Line 224**: Gets ticket category
- **Line 227**: Gets current user name
- **Line 230**: Retrieves or rebuilds QR code data
- **Lines 233-242**: Calls PDF generator with booking data
- Downloads previously purchased ticket

**Data Retrieval Flow:**
```
User clicks "Download PDF" on my-bookings
    ↓
downloadTicket(bookingId) called
    ↓
Get booking by ID from DataEventService
    ↓
Get event by eventId from DataEventService
    ↓
Get ticket category by ticketCategoryId
    ↓
Retrieve QR code from booking.qrCode
    ↓
Call pdfGeneratorService.generateTicketPDF()
    ↓
PDF generated and downloaded
```

---

## 7. QR Code Download (PNG Image)

### Location 9: TicketBuy - Download QR Code as Image

**File:** `src/app/ticket-page/ticket-buy/ticket-buy.ts` (Lines 301-307)

```typescript
downloadQRCode(): void {
   if (!this.qrCodeDataUrl) return;

   const link = document.createElement('a');
   link.href = this.qrCodeDataUrl;
   link.download = `qr_${this.currentBooking?.id}.png`;
   link.click();
}
```

**What it does:**
- **Line 304**: Creates temporary `<a>` element
- **Line 305**: Sets href to QR image data URL
- **Line 306**: Sets filename: `qr_[bookingId].png`
- **Line 307**: Triggers download by simulating click

**Download Flow:**
```
this.qrCodeDataUrl = "data:image/png;base64,iVBORw0K..."
    ↓
Create <a> element
    ↓
Set href to data URL
    ↓
Set download attribute with filename
    ↓
Programmatically click link
    ↓
Browser downloads PNG image
```

---

## 8. Complete Ticket Generation Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER PURCHASE FLOW                            │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │  purchase() │
                    │   method    │
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              │                        │
         ┌────▼─────┐          ┌──────▼────────┐
         │Validate  │          │Insufficient   │
         │Auth & Qty│          │Tickets? → END │
         └────┬─────┘          └───────────────┘
              │
         ┌────▼────────────────────────────────┐
         │dataSrv.buyTicket()                  │
         │  ├─ Create booking                  │
         │  ├─ Generate initial QR: QR_xxx     │
         │  ├─ Status: confirmed               │
         │  └─ Return booking object           │
         └────┬──────────────────────────────┘
              │
         ┌────▼─────────────────┐
         │showPaymentModal=true │
         └────┬─────────────────┘
              │
    ┌─────────┴─────────┐
    │                   │
┌───▼────────────┐  ┌───▼──────────────┐
│ processPayment │  │ cancelBooking    │
└───┬────────────┘  └──────────────────┘
    │
┌───▼──────────────────────────────────────────┐
│ QR Data Generated:                           │
│ "eventId|section|date"                       │
│ Example: "123|VIP|2025-01-15"                │
└───┬──────────────────────────────────────────┘
    │
┌───▼──────────────────────────────────────────────────────┐
│ QRCode.toDataURL(qrData, {width:300, ...})               │
│  → Encodes text to QR image                              │
│  → Returns: data:image/png;base64,iVBORw0K...           │
└───┬──────────────────────────────────────────────────────┘
    │
┌───▼─────────────────────┐
│showQRCodeDisplay=true   │
│ Display QR modal        │
└───┬─────────────────────┘
    │
    ├─────────────────────────────┬──────────────────────────┐
    │                             │                          │
┌───▼────────────────┐   ┌────────▼──────────┐   ┌──────────▼──────┐
│  downloadQRCode()  │   │downloadTicketPDF()│   │  Continue Shop  │
│  ├─ Create <a>     │   │  ├─ Get booking   │   │  or My Bookings │
│  ├─ href=dataURL   │   │  ├─ Get event    │   │                  │
│  └─ click()        │   │  ├─ Get ticket   │   └──────────────────┘
│      ↓             │   │  └─ Call PDF svc │
│  Downloads PNG     │   └────┬──────────────┘
└────────────────────┘        │
                        ┌─────▼────────────────────────────┐
                        │PdfGeneratorService.               │
                        │generateTicketPDF()                │
                        │  ├─ Step 1: QRCode.toDataURL()   │
                        │  │           (convert QR to IMG) │
                        │  ├─ Step 2: new jsPDF()          │
                        │  ├─ Step 3: Add header (yellow)  │
                        │  ├─ Step 4: Add title            │
                        │  ├─ Step 5: Add booking info     │
                        │  ├─ Step 6: Add QR border        │
                        │  ├─ Step 7: Add QR image         │
                        │  ├─ Step 8: Add QR data text     │
                        │  ├─ Step 9: Add footer           │
                        │  └─ Step 10: pdf.save()          │
                        └─────┬────────────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │ Browser downloads: │
                    │ ticket_[id].pdf    │
                    │ with all content   │
                    └────────────────────┘
```

---

## 9. Complete Code Summary Table

| Component | Method | Purpose | Input | Output |
|-----------|--------|---------|-------|--------|
| TicketBuy | purchase() | Validate & create booking | ticket, qty | booking object |
| DataEventService | buyTicket() | Create booking record | eventId, ticketId | booking with QR |
| DataEventService | generateQRCode() | Generate QR identifier | - | "QR_xxx_yyy" |
| TicketBuy | processPayment() | Process payment & QR | cart items | QR image URL |
| TicketBuy | downloadQRCode() | Download QR as PNG | qrCodeDataUrl | PNG file download |
| TicketBuy | downloadTicketPDF() | Download full ticket PDF | booking details | PDF file download |
| MyBookings | downloadTicket() | Download existing ticket | bookingId | PDF file download |
| PdfGeneratorService | generateTicketPDF() | Generate complete PDF | booking + QR data | PDF downloaded |
| PdfGeneratorService | generateQRCodeImage() | Convert data to QR image | data string | PNG data URL |

---

## 10. Key Technologies Used

| Technology | Version | Purpose | Location |
|------------|---------|---------|----------|
| qrcode | 1.5.4 | QR code generation | `QRCode.toDataURL()` |
| jsPDF | 3.0.4 | PDF document creation | `new jsPDF()` |
| html2canvas | 1.4.1 | HTML to image capture | (available if needed) |
| Angular | 20.3.0 | Component framework | All components |
| TypeScript | 5.9.2 | Type safety | All files |

---

## 11. QR Code Data Encoding

### Format and Content

```typescript
// QR Data Format
qrData = `${eventId}|${section}|${eventDate}`

// Example Values
eventId: 123
section: "VIP" or "GENERAL"
eventDate: "2025-01-15"

// Final QR String
"123|VIP|2025-01-15"

// What Gets Encoded in QR Code
┌──────────────────────────────┐
│ QR Code Image (PNG)          │
│ ┌──────────────────────────┐ │
│ │   ┌──┐┌──┐     ┌────┐   │ │
│ │   │██││██│ ... │    │   │ │
│ │   ├──┼┼──┼ ... ├────┤   │ │
│ │   │  ││  │ ... │    │   │ │
│ │   └──┘└──┘     └────┘   │ │
│ │   (Encodes: 123|VIP|...)  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘

// When Scanned, Decodes to
→ "123|VIP|2025-01-15"
→ Venue staff validates booking
```

---

## 12. PDF File Download Details

### Browser Download Process

```
PDF Generation Complete
        ↓
pdf.save(`ticket_${bookingId}.pdf`)
        ↓
File Name: "ticket_booking_123.pdf"
File Size: ~50-100KB (typical)
File Type: application/pdf
        ↓
Browser Downloads Folder
├─ ticket_booking_123.pdf
├─ ticket_booking_124.pdf
└─ ticket_booking_125.pdf
        ↓
User can open, print, or share
```

---

## 13. Real-Time Example: Complete Purchase to Download

### Scenario: User buys 2 VIP tickets for Concert 2025

**Step 1: Purchase**
```typescript
// User clicks "Purchase" button
purchase(vipTicket, 2)
  → validation passes
  → dataSrv.buyTicket(event:123, ticket:vip_001, qty:2, userId:user_456)
  → Creates booking_1001
```

**Step 2: Booking Created**
```typescript
Booking object created:
{
  id: "booking_1001",
  eventId: 123,
  userId: "user_456",
  ticketCategoryId: "vip_001",
  quantity: 2,
  pricePerTicket: 75,
  totalPrice: 150,
  status: "confirmed",
  bookingDate: "2025-01-20T10:30:00Z",
  qrCode: "QR_1705756200000_x8k4n"
}
```

**Step 3: Payment Processing**
```typescript
processPayment()
  → qrData = "123|VIP|2025-01-15"
  → QRCode.toDataURL(qrData, {width:300, ...})
  → qrCodeDataUrl = "data:image/png;base64,iVBORw0K..."
  → showQRCodeDisplay = true
  → User sees QR modal
```

**Step 4: User Downloads PDF**
```typescript
downloadTicketPDF()
  → pdfGeneratorService.generateTicketPDF(
      "booking_1001",
      "123|VIP|2025-01-15",
      "Concert 2025",
      "VIP",
      2,
      150,
      "2025-01-15",
      "John Doe"
    )
```

**Step 5: PDF Generated**
```
PDF Content:
┌─────────────────────────────┐
│ BOOKING TICKET (yellow)     │
├─────────────────────────────┤
│ Booking ID: booking_1001    │
│ Customer: John Doe          │
│ Event: Concert 2025         │
│ Date: 2025-01-15            │
│ Ticket: VIP | Qty: 2        │
│ Total: $ 150                │
├─────────────────────────────┤
│      [QR CODE IMAGE]        │
│      (90x90mm PNG)          │
├─────────────────────────────┤
│ QR: 123|VIP|2025-01-15      │
├─────────────────────────────┤
│ Show QR for check-in        │
└─────────────────────────────┘
```

**Step 6: Download**
```
pdf.save("ticket_booking_1001.pdf")
  → Browser downloads
  → File appears in Downloads folder
  → User can print or share
```

---

## 14. Summary

### Ticket Generation Flow:

1. ✅ **User purchases ticket** → Creates booking with initial QR data
2. ✅ **Payment processes** → Generates QR code image from booking data
3. ✅ **QR code displayed** → User sees encoded ticket information
4. ✅ **PDF generated** → Combines booking info + QR image into document
5. ✅ **File downloaded** → Browser saves ticket_[id].pdf to device

### Key Encoding:
- **QR Data**: `eventId|seatSection|eventDate` → Encodes in QR image
- **QR Image**: PNG (300x300px or 90x90mm in PDF)
- **PDF File**: A4 portrait with yellow header, booking details, QR code, footer

### Download Formats:
- **PDF**: `ticket_[bookingId].pdf` - Full ticket document
- **PNG**: `qr_[bookingId].png` - QR code image only

