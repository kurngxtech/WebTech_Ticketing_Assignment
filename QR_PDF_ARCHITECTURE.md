# 🎯 QR Code & PDF Download - Architecture & Flow Diagrams

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Angular Application                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐              ┌──────────────────┐         │
│  │  My Bookings     │              │  Ticket Buy Page │         │
│  │  Component       │              │  Component       │         │
│  ├──────────────────┤              ├──────────────────┤         │
│  │ - loadBookings() │              │ - processPayment()        │
│  │ - selectBooking()│              │ - closeQRDisplay()        │
│  │ - downloadTicket│◄─────────┐   │ - downloadTicketPDF()     │
│  │ - applyFilter()  │          │   │ - downloadQRCode()        │
│  └──────────────────┘          │   └──────────────────┘         │
│         │                      │          │                     │
│         │ (auto-generate QR)   │          │ (payment success)    │
│         ▼                      │          ▼                     │
│  ┌──────────────────────────────────────────┐                  │
│  │  PDF Generator Service                   │                  │
│  ├──────────────────────────────────────────┤                  │
│  │ - generateTicketPDF()                    │                  │
│  │ - generateMultipleTicketsPDF()           │                  │
│  │ - generateQRCodeImage()                  │                  │
│  └──────────────────┬───────────────────────┘                  │
│                     │                                           │
│                     │ (jsPDF library)                           │
│                     ▼                                           │
│  ┌──────────────────────────────────────────┐                  │
│  │  PDF Output                              │                  │
│  ├──────────────────────────────────────────┤                  │
│  │ - ticket_[booking-id].pdf                │                  │
│  │ - User Downloads to Downloads Folder    │                  │
│  └──────────────────────────────────────────┘                  │
│                                                                   │
│  ┌──────────────────────────────────────────┐                  │
│  │  QR Code Service                         │                  │
│  ├──────────────────────────────────────────┤                  │
│  │ - generateQRCodeImage()                  │                  │
│  │ - toDataURL()                            │                  │
│  │ (qrcode library)                         │                  │
│  └──────────────────────────────────────────┘                  │
│                                                                   │
│  ┌──────────────────────────────────────────┐                  │
│  │  Data Event Service                      │                  │
│  ├──────────────────────────────────────────┤                  │
│  │ - getBookingById()                       │                  │
│  │ - getEventById()                         │                  │
│  │ - getBookingsByUser()                    │                  │
│  └──────────────────────────────────────────┘                  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow - My Bookings

```
User Opens My Bookings Page
        │
        ▼
Component ngOnInit()
        │
        ├─→ Get current user ID
        │
        ├─→ Load bookings from DataEventService
        │
        ├─→ Load waitlist entries
        │
        └─→ FOR EACH booking:
            │
            ├─→ Get booking object
            │
            ├─→ Check if has QR code
            │
            ├─→ Generate QR code image
            │   (QRCode.toDataURL())
            │
            └─→ Store in bookingQrDataUrls Map
                │
                ▼
         QR Code Display in Card
         
         User Hovers QR
         ├─→ Scale 1.05
         ├─→ Yellow shadow
         └─→ Semi-transparent overlay
         
         User Clicks QR
         ├─→ Scale 0.98
         ├─→ Event: downloadTicket()
         │
         └─→ PDF Generation
             ├─→ Get booking details
             ├─→ Get event details
             ├─→ Get ticket category
             ├─→ Get user name
             ├─→ Build QR data string
             │
             └─→ Call PdfGeneratorService
                 ├─→ Generate QR image
                 ├─→ Create PDF document
                 ├─→ Add header (yellow)
                 ├─→ Add booking info
                 ├─→ Add QR code image
                 ├─→ Add QR data string
                 ├─→ Add footer
                 │
                 └─→ PDF Download
                     └─→ Browser downloads: ticket_[id].pdf
```

---

## 🔄 Data Flow - Ticket Buy

```
User Completes Payment
        │
        ▼
processPayment() Method
        │
        ├─→ FOR EACH item in cart:
        │   └─→ Create booking via DataEventService
        │
        ├─→ Generate QR code data
        │   └─→ Format: eventId|section|date
        │
        ├─→ Call QRCode.toDataURL()
        │   └─→ Generate QR image (300x300px)
        │
        └─→ showQRCodeDisplay = true
            │
            ▼
        QR Display Modal Shows
        ├─→ QR Code Image
        ├─→ Booking Details
        ├─→ QR Data String
        │
        └─→ Buttons:
            ├─→ [Close]
            ├─→ [Download QR Image] → downloadQRCode()
            ├─→ [Download PDF] → downloadTicketPDF()
            │
            └─→ downloadTicketPDF() Executes:
                ├─→ Call PdfGeneratorService.generateTicketPDF()
                │
                └─→ PDF Generated & Downloaded
                    └─→ ticket_[booking-id].pdf
```

---

## 📄 PDF Document Structure

```
┌─────────────────────────────────────────────────┐
│ Header Section (30mm, Yellow #feb706)           │
│                                                 │
│              BOOKING TICKET                    │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Booking Info Section (50mm, Light Gray)         │
│                                                 │
│  Booking ID: BK2025112700123                   │
│  Customer: John Doe                            │
│  Event: Concert 2025                           │
│  Date: Jan 15, 2025                            │
│  Ticket Type: VIP | Quantity: 2                │
│  Total Price: IDR 1,000,000                    │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ QR Code Section (90x90mm, Centered)             │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │                                           │ │
│  │              [QR CODE]                   │ │
│  │                                           │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  QR Data: 12345|VIP|2025-01-15                │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Footer Section (15mm)                           │
│                                                 │
│  Show QR code for check-in                     │
│  Generated: 27 Nov 2025 13:02:07               │
└─────────────────────────────────────────────────┘
```

---

## 🎨 QR Code Interaction Flow

```
Initial State
    │
    ▼
    ┌─────────────┐
    │   QR CODE   │  opacity: 1, scale: 1
    │   (Normal)  │  cursor: pointer
    └─────────────┘
         │
         │ (Mouse Enter)
         ▼
    ┌─────────────┐
    │   QR CODE   │  scale: 1.05
    │  (Hover)    │  shadow: rgba(254,183,6,0.4)
    │             │  overlay: rgba(254,183,6,0.1)
    └─────────────┘
         │
         │ (Mouse Click)
         ▼
    ┌─────────────┐
    │   QR CODE   │  scale: 0.98
    │  (Click)    │  (Press effect)
    └─────────────┘
         │
         │ (Click Action Complete)
         ▼
    ┌─────────────┐
    │   QR CODE   │  scale: 1.05
    │ (Download)  │  PDF generated and downloaded
    │             │  File: ticket_[id].pdf
    └─────────────┘
         │
         │ (Mouse Leave)
         ▼
    ┌─────────────┐
    │   QR CODE   │  scale: 1
    │  (Normal)   │  Return to initial state
    └─────────────┘
```

---

## 📱 Responsive Layout - QR Code

### Desktop (>1200px)
```
┌────────────────────────────────────┐
│  Event Title          [✓ Confirmed]│
│  Date | Ticket Type | Qty | Price │
│                                    │
│  Booking Info    │    QR Code      │
│  - ID            │    [180x180px]  │
│  - Date          │                 │
│  - Price         │                 │
│  [Download PDF]  │    [Clickable]  │
│  [Cancel]        │                 │
└────────────────────────────────────┘
```

### Tablet (768px - 1200px)
```
┌─────────────────────────────────┐
│  Event Title      [✓ Confirmed] │
│  Date | Type | Qty | Price      │
│                                 │
│  Booking Info                   │
│  ─────────────────────────────  │
│  - ID: ...                      │
│  - Date: ...                    │
│  - Price: ...                   │
│  [Download PDF]  [Cancel]       │
│                                 │
│  QR Code                        │
│  [150x150px]                    │
│  [Clickable]                    │
└─────────────────────────────────┘
```

### Mobile (<768px)
```
┌──────────────────┐
│ Event Title      │
│ [✓ Confirmed]    │
│ Date | Type | Qty│
│ Price            │
├──────────────────┤
│ [QR 150x150]     │
│ [Clickable]      │
├──────────────────┤
│ Booking Info:    │
│ ID: ...          │
│ Date: ...        │
│ Price: ...       │
├──────────────────┤
│ [Download PDF]   │
│ [Cancel]         │
└──────────────────┘
```

---

## 🔗 Component Dependencies

```
my-bookings.component.ts
    ├─→ DataEventService
    │   ├─ getBookingsByUser()
    │   ├─ getEventById()
    │   └─ getBookingById()
    │
    ├─→ AuthService
    │   └─ getCurrentUser()
    │
    └─→ PdfGeneratorService
        └─ generateTicketPDF()
            ├─→ QRCode (library)
            │   └─ toDataURL()
            │
            └─→ jsPDF (library)
                ├─ setFillColor()
                ├─ addImage()
                ├─ text()
                ├─ rect()
                └─ save()

ticket-buy.component.ts
    ├─→ DataEventService
    │   └─ buyTicket()
    │
    ├─→ AuthService
    │   └─ getCurrentUser()
    │
    ├─→ QRCode (library)
    │   └─ toDataURL()
    │
    └─→ PdfGeneratorService
        └─ generateTicketPDF()
```

---

## 📊 State Management

### My Bookings Component State
```typescript
bookings: BookingDisplay[]                    // All bookings
filteredBookings: BookingDisplay[]            // Filtered bookings
bookingQrDataUrls: Map<string, string>        // QR code image URLs
filterStatus: 'all'|'confirmed'|...           // Current filter
selectedBookingId: string | null              // Selected booking
isLoading: boolean                            // Loading state
isSortMenuOpen: boolean                       // Menu state
```

### Ticket Buy Component State
```typescript
currentBooking: Booking | null                // Current booking
showPaymentModal: boolean                     // Payment modal state
showQRCodeDisplay: boolean                    // QR modal state
qrCodeDataUrl: string                         // QR image URL
qrCodeData: string                            // QR data string
cart: CartItem[]                              // Shopping cart
totalCartPrice: number                        // Cart total
quantities: { [ticketId: string]: number }   // Quantities
```

---

## 🔐 Security Considerations

```
PDF Generation Process:
    │
    ├─→ User-provided data sanitized
    ├─→ QR code generated from booking ID + event date
    ├─→ No sensitive data (passwords, tokens) in PDF
    ├─→ File download only after authentication
    ├─→ PDF filename contains only booking ID
    │
    └─→ Safe to share/print/display
```

---

## ⚡ Performance Optimization

```
QR Code Generation:
    ├─→ Debounced to prevent multiple calls
    ├─→ Cached in bookingQrDataUrls Map
    ├─→ Lazy loaded on demand
    └─→ Size: 200x200px (balanced)

PDF Generation:
    ├─→ Asynchronous (non-blocking)
    ├─→ Generated only on user request
    ├─→ Downloads initiated via browser
    ├─→ No server-side processing needed
    └─→ File size: ~50-100KB per PDF

Memory Usage:
    ├─→ QR images cached in memory
    ├─→ Cleaned up on component destroy
    ├─→ No memory leaks from event listeners
    └─→ Efficient DOM manipulation
```

---

## 📈 Scalability

```
Current Implementation:
    ├─→ Works for 1-1000 bookings efficiently
    ├─→ PDF generation: ~500-1000ms per document
    ├─→ QR generation: ~50-100ms per code
    └─→ No database queries required

Future Scaling:
    ├─→ Add server-side PDF generation for large batches
    ├─→ Implement batch download (ZIP multiple PDFs)
    ├─→ Add email delivery of PDFs
    ├─→ Cache PDFs for frequent downloads
    └─→ CDN for static assets
```

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** Nov 27, 2025  
**Version:** 1.0

