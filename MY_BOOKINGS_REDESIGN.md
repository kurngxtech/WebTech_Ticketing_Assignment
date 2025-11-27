# My Bookings Page - Redesign Documentation 📱

**Date:** 27 November 2025  
**Component:** My Bookings (my-bookings)  
**Changes:** Complete UI/UX redesign with card layout and sorting menu

---

## 🎯 Overview

Halaman My Bookings telah di-redesign sepenuhnya dengan:
- ✅ Card-based layout untuk setiap booking
- ✅ Hamburger menu (☰) dengan filter/sorting options
- ✅ QR code positioned di kanan setiap card
- ✅ Download PDF dan Cancel buttons terintegrasi
- ✅ Smooth animations dan blur effects
- ✅ Yellow-black theme dengan warna status (hijau/kuning/merah)
- ✅ Fully responsive design

---

## 🎨 Design Features

### 1. Card Layout
Setiap booking ditampilkan dalam bentuk card dengan:
- **Header**: Event title + Status badge
- **Content Left**: Event details, ticket info, price, dan action buttons
- **QR Section**: QR code display di kanan (200x200px)

```
┌─────────────────────────────────────────────────────────┐
│  Event Title          [Status Badge]                    │
├──────────────────────────────────────────────┬──────────┤
│ • Date: Nov 28, 2025                         │ QR Code  │
│ • Ticket: VIP                                │ Image    │
│ • Quantity: 2                                │          │
│ • Total: Rp 1,000,000                        │          │
│                                              │          │
│ [Download PDF] [Cancel]                      │          │
└──────────────────────────────────────────────┴──────────┘
```

### 2. Hamburger Menu (Sort Menu)
**Icon:** 3 garis (☰) di top-right

**Behavior:**
- Click ☰ → Menu slide in dari kanan, icon berubah menjadi ✕
- Menu overlay dengan blur background
- Click ✕ → Menu slide out, icon kembali ke ☰
- Click backdrop → Menu close
- Click sort item → Filter applied + menu auto-close

**Filter Options:**
1. **All Bookings** - Semua booking (count badge)
2. **✓ Confirmed** - Booking yang sudah dikonfirmasi (hijau/green)
3. **⏳ Pending** - Booking pending pembayaran (kuning/yellow)
4. **✕ Cancelled** - Booking yang dibatalkan (merah/red)
5. **⭐ Waitlist** - Event yang di-waitlist

### 3. Animations
Smooth transitions dan animations:
- **Cards**: Slide up pada page load dengan staggered delay
- **Menu**: Slide in dari kanan dengan cubic-bezier easing
- **Items**: Fade in dengan translateX animation
- **Hover**: Lift effect (translateY -5px) pada cards
- **Icon**: Hamburger → Cross transformation

### 4. Color Theme
```
Primary Yellow:  #feb706 (warning/accent)
Dark Background: #0f172a
Success Green:   #10b981 (confirmed)
Warning Yellow:  #f59e0b (pending)
Danger Red:      #ef4444 (cancelled)
Text Light:      #e6edf3
Text Muted:      #cbd5e1
```

---

## 🔧 Technical Implementation

### TypeScript (my-bookings.ts)

#### New Properties:
```typescript
isSortMenuOpen = false;                          // Track menu state
bookingQrDataUrls: Map<string, string> = new Map(); // Cache QR codes
filterStatus: 'all' | 'confirmed' | 'pending' | 'cancelled' | 'waitlist' = 'all';
```

#### New Methods:
```typescript
toggleSortMenu()           // Open/close sort menu
closeSortMenu()            // Close menu
getTotalBookings()         // Count all bookings
getConfirmedCount()        // Count confirmed
getPendingCount()          // Count pending
getCancelledCount()        // Count cancelled
getWaitlistCount()         // Count waitlist
setFilter(status)          // Apply filter + close menu
```

#### Pre-generate QR Codes:
- QR codes di-generate untuk semua bookings saat loadBookings()
- Disimpan di Map untuk performa optimal
- Tidak perlu generate ulang saat scroll

### HTML (my-bookings.html)

#### Structure:
```html
.my-bookings-page
  ├── .page-header
  │   ├── .page-title
  │   └── .sort-menu-toggle (☰/✕)
  ├── .sort-menu-backdrop (blur effect)
  ├── .sort-menu (overlay)
  │   └── .sort-item × 5 (filter options)
  └── .bookings-grid
      └── .booking-card × N
          ├── .card-header
          ├── .card-content
          │   ├── .content-left (info + buttons)
          │   └── .qr-section (QR code)
          └── .card-actions (buttons)
```

### CSS (my-bookings.css)

#### Key Animations:
- `@keyframes spin` - Loading spinner
- `@keyframes slideIn` - Menu items fade in
- `@keyframes cardSlideUp` - Card entrance animation
- `@keyframes fadeIn` - Grid fade in

#### Responsive Breakpoints:
- **768px**: Grid 1 column, wrap QR below content
- **480px**: Further optimization untuk mobile

---

## 📋 Feature Breakdown

### Card Features

**✅ Card Header:**
- Event title (color: yellow)
- Status badge dengan color-coding:
  - ✓ Confirmed (green background)
  - ⏳ Pending (yellow background)
  - ✕ Cancelled (red background)

**✅ Card Content (Left):**
- Event date
- Ticket type
- Quantity
- Total price (highlighted dalam yellow)

**✅ Card Actions:**
- Download PDF button (yellow/bright)
- Cancel button (red outline, visible only if cancellable)
- Action buttons have hover effect dan transform

**✅ QR Code (Right):**
- QR code image 180x180px
- White background untuk scanability
- Placeholder jika tidak ada QR

### Sort Menu Features

**✅ Menu Trigger:**
- Icon toggle: ☰ ↔ ✕
- Smooth icon transformation
- Yellow border + background saat open

**✅ Sort Items:**
- 5 filterable categories
- Each item shows count badge
- Color-coded left border sesuai status
- Hover: translateX dan background change
- Active: full color highlight

**✅ Blur Effect:**
- Backdrop blur ketika menu open
- Click backdrop untuk close
- Dark overlay untuk focus

---

## 🎬 User Interactions

### Standard Booking Interaction:
```
1. User sees bookings dalam grid format
2. User lihat QR code immediately di card
3. User click "Download PDF" → download ticket
4. User click "Cancel" → cancel booking (jika eligible)
```

### Sort/Filter Interaction:
```
1. User click ☰ (hamburger)
   ↓
2. Menu slide in dari kanan, icon → ✕
   Backdrop blur background
   ↓
3. User click filter option (e.g., "Confirmed")
   ↓
4. Bookings di-filter, menu auto-close
   ↓
5. Icon ✕ → ☰ (hamburger kembali)
```

### Menu Close Interaction:
```
1. User click ✕ atau click backdrop
   ↓
2. Menu slide out, blur effect hilang
   ↓
3. Bookings tetap ter-filter sesuai selection
```

---

## 📱 Responsive Design

### Desktop (>768px)
- Grid: auto-fill minmax(500px)
- Card content horizontal (info left, QR right)
- Full animations dan transitions

### Tablet (768px - 481px)
- Grid: 1 column
- Card content vertical (QR below info)
- Same buttons dan functionality

### Mobile (<480px)
- Single column layout
- Smaller text sizes
- Reduced button sizes
- Simplified spacing
- Menu adjusted untuk mobile viewport

---

## 🎨 Styling Details

### Card Hover/Active States:
```css
Default:
  - background: rgba(30, 41, 59, 0.6)
  - border: rgba(254, 183, 6, 0.2)

Hover:
  - background: rgba(30, 41, 59, 0.9)
  - border: #feb706
  - transform: translateY(-5px)
  - box-shadow: 0 8px 25px rgba(254, 183, 6, 0.2)

Active (Selected):
  - background: rgba(30, 41, 59, 0.95)
  - border: #feb706
  - box-shadow: 0 12px 35px rgba(254, 183, 6, 0.3)
```

### Button States:
```css
Download Button:
  - Default: #feb706 background, dark text
  - Hover: #e6a600, lift effect, shadow
  - Active: reset transform

Cancel Button:
  - Default: transparent, red border/text
  - Hover: red background opacity, shadow
  - Active: reset transform
```

### Status Badges:
```css
Confirmed (Green):
  background: rgba(16, 185, 129, 0.2)
  border: rgba(16, 185, 129, 0.5)
  color: #10b981

Pending (Yellow):
  background: rgba(245, 158, 11, 0.2)
  border: rgba(245, 158, 11, 0.5)
  color: #f59e0b

Cancelled (Red):
  background: rgba(239, 68, 68, 0.2)
  border: rgba(239, 68, 68, 0.5)
  color: #ef4444
```

---

## 🔄 Data Flow

### Loading Bookings:
```
loadBookings()
  ├── Get user bookings dari service
  ├── For each booking:
  │   └── Generate QR code → store di Map
  ├── Map to BookingDisplay format
  └── applyFilter() → show filtered results
```

### Filtering:
```
setFilter(status)
  ├── Update filterStatus
  ├── applyFilter()
  │   └── Filter bookings by status
  ├── closeSortMenu()
  └── Update view
```

### Sorting Menu:
```
toggleSortMenu()
  └── isSortMenuOpen = !isSortMenuOpen

closeSortMenu()
  └── isSortMenuOpen = false

setFilter()
  ├── Apply filter
  └── Auto-close menu
```

---

## 📊 Count Methods

Setiap sort item menampilkan jumlah booking:

```typescript
getTotalBookings()    → Total semua bookings
getConfirmedCount()   → Filter: status === 'confirmed'
getPendingCount()     → Filter: status === 'pending'
getCancelledCount()   → Filter: status === 'cancelled'
getWaitlistCount()    → Length dari waitlistEntries array
```

---

## 🚀 Performance Optimizations

1. **QR Code Caching**: Generate once, store di Map
2. **Lazy Rendering**: Angular @for dengan track
3. **CSS Animations**: GPU-accelerated transforms
4. **Responsive Images**: QR codes scaled untuk setiap size
5. **No Layout Thrashing**: Batch DOM updates

---

## 🧪 Testing Checklist

### Visual Tests:
- [ ] Cards display dengan QR code di kanan
- [ ] Hamburger menu icon (☰) visible top-right
- [ ] Click ☰ → menu slide in, icon → ✕
- [ ] Click ✕ → menu slide out, icon → ☰
- [ ] Click backdrop → menu close
- [ ] Booking cards have action buttons
- [ ] Status badge color-coded
- [ ] Price highlighted dalam yellow

### Interaction Tests:
- [ ] Click sort item → bookings filter correctly
- [ ] Sort item shows correct count
- [ ] Click download → download PDF works
- [ ] Click cancel → cancel booking works
- [ ] Hover effects smooth dan visible
- [ ] Active card styling applied
- [ ] Menu animations smooth

### Responsive Tests:
- [ ] Desktop: QR on right, horizontal layout
- [ ] Tablet: QR below, vertical layout
- [ ] Mobile: Single column, readable text
- [ ] All buttons accessible dan clickable
- [ ] Menu responsive di mobile

---

## 📝 Notes

- ✅ Semua animasi smooth dan performant
- ✅ Blur effect menggunakan CSS backdrop-filter (modern browsers)
- ✅ Color theme sesuai dengan design system
- ✅ Responsive design mobile-first approach
- ✅ Accessibility: proper focus states, keyboard navigation
- ✅ QR codes pre-generated untuk better performance

---

## 🔮 Future Enhancements

Possible improvements:
- Modal detail view untuk booking details
- Export bookings ke multiple formats (PDF, CSV)
- Batch operations (multi-select, bulk cancel)
- Advanced filtering (date range, price range)
- Booking history/timeline view
- Dark mode toggle
- Custom sorting (sort by date, price, etc)

