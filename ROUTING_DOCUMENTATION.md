# WebTech Ticketing System - Complete Routing Documentation

## Table of Contents
1. [Routing Architecture Overview](#routing-architecture-overview)
2. [Visual Routing Diagram](#visual-routing-diagram)
3. [Route Details & Navigation](#route-details--navigation)
4. [Route Guards & Protection](#route-guards--protection)
5. [Navigation Flows](#navigation-flows)

---

## Routing Architecture Overview

### Application Structure

The WebTech Ticketing System uses Angular's component-based routing with lazy loading for feature modules. The application supports three primary user roles, each with dedicated route segments:

- **Public Routes**: Accessible to all users (home, about, FAQ, login)
- **Protected User Routes**: Accessible only to authenticated users
- **Role-Based Routes**: Specific to admin, event organizer, and regular users

### Routing Strategy

```
Routing Pattern:
├── Public Access (no authentication required)
├── Protected Routes (authentication required)
├── Role-Based Access (specific role required)
└── Lazy-Loaded Modules (loaded on demand)
```

---

## Visual Routing Diagram

### Complete Application Route Tree

```
┌─────────────────────────────────────────────────────────────────┐
│                   WebTech Ticketing Application                 │
│                      Root: "/"  (Home)                          │
└──────────────────────┬──────────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────────────┬──────────────┐
        │              │                      │              │
        │              │                      │              │
    ┌───▼────┐   ┌────▼────┐          ┌──────▼──────┐  ┌───▼──────┐
    │  /     │   │ /about  │          │  /faq       │  │ /ticket- │
    │ HOME   │   │         │          │             │  │  list    │
    │(Public)│   │(Public) │          │ (Public)    │  │(Public)  │
    └────────┘   └─────────┘          └─────────────┘  └──────────┘
        │
        │
    ┌───▼─────────────────────────────────────────────────────┐
    │                  AUTHENTICATED ROUTES                    │
    │           (Requires login - Auth Guard)                  │
    └───┬─────────────────────────────────────────────────────┘
        │
        ├─ /login
        │  ├─ /login/user          → UserLoginPage (Public)
        │  ├─ /login/admin         → AdminLoginPage (Public)
        │  └─ /login/eo            → EOLoginPage (Public)
        │
        ├─ /ticket/:id             → TicketBuy (User - buy ticket)
        │
        ├─ /my-bookings            → MyBookings (User - view bookings)
        │
        ├─ /admin                  → AdminDashboard (Admin only)
        │  └─ (Lazy loaded)         [Protected by role guard]
        │
        ├─ /eo                     → EODashboard (EO only)
        │  └─ (Lazy loaded)         [Protected by role guard]
        │
        ├─ /eo/create-event        → CreateEvent (EO only)
        │  └─ (Lazy loaded)         [Protected by role guard]
        │
        ├─ /eo/event/:id/edit      → CreateEvent (EO only)
        │  └─ (Lazy loaded)         [Protected by role guard]
        │
        └─ /analytics              → AnalyticsReports (EO/Admin)
           └─ (Lazy loaded)         [Protected by role guard]
```

### Color-Coded Route Categories

```
Legend:
🟢 PUBLIC ROUTES        - Accessible without login
🔵 AUTHENTICATED ROUTES - Requires valid login
🔴 PROTECTED ROUTES     - Requires specific role
⚡ LAZY-LOADED MODULES  - Loaded on-demand for performance
```

---

## Route Details & Navigation

### Public Routes

#### Route: `/` (Root / Home)
```
Path: /
Component: Home
Status: 🟢 PUBLIC
Lazy Loaded: No
```

**Purpose:** Landing page of the application

**Features:**
- Featured events carousel (Swiper)
- Event discovery section
- Promotional banners
- Navigation to login pages
- General information about the platform

**Navigation Access:**
- Direct URL entry: `http://localhost:4200/`
- Click logo/home link in navigation
- Landing page for first-time visitors

**User Flow:**
```
Home Page
    ↓
User sees featured events
    ↓
Options:
├─ Browse all events → /ticket-list
├─ View event details → /ticket/:id
├─ Login → /login/user
└─ View about → /about
```

---

#### Route: `/about`
```
Path: /about
Component: About
Status: 🟢 PUBLIC
Lazy Loaded: No
```

**Purpose:** Information about the WebTech Ticketing platform

**Features:**
- Company/platform information
- Mission statement
- Features overview
- Contact information
- Links to FAQ and support

**Navigation Access:**
- Footer link "About Us"
- Direct URL: `http://localhost:4200/about`
- Header navigation menu

**Content Sections:**
- Platform overview
- Key features list
- Team information
- Contact details
- Social media links

---

#### Route: `/faq`
```
Path: /faq
Component: Faq
Status: 🟢 PUBLIC
Lazy Loaded: No
```

**Purpose:** Frequently Asked Questions section

**Features:**
- Common questions about ticketing
- Troubleshooting guides
- Platform features explanation
- Policy information
- Support contact

**Navigation Access:**
- Footer link "FAQ"
- Direct URL: `http://localhost:4200/faq`
- Help menu in navigation

**FAQ Categories:**
- General questions
- Account & login
- Ticket purchasing
- Event organization
- Technical support

---

#### Route: `/ticket-list`
```
Path: /ticket-list
Component: TicketList
Status: 🟢 PUBLIC
Lazy Loaded: No
```

**Purpose:** Display all available events for browsing and purchase

**Features:**
- Event listing grid/table
- Search and filter options
- Event details preview
- Price information
- Availability status

**Navigation Access:**
- Header "Browse Events" button
- Home page "View All Events" link
- Direct URL: `http://localhost:4200/ticket-list`

**User Interaction:**
```
Ticket List Page
    ↓
User browses events
    ↓
Options:
├─ Click event → /ticket/:id (view details)
├─ Filter by category, price, date
├─ Search by event name
└─ Sort by popularity, price, date
```

---

### Login Routes

#### Route: `/login/user`
```
Path: /login/user
Component: UserLoginPage
Status: 🟢 PUBLIC (before login) → 🔵 AUTHENTICATED (after login)
Lazy Loaded: No
```

**Purpose:** Login page for regular users/customers

**Features:**
- Username/email input field
- Password input field
- "Remember me" checkbox
- Login button
- "Forgot password" link
- Sign up link

**Navigation Access:**
- Click "User Login" on home page
- Direct URL: `http://localhost:4200/login/user`
- Redirect when unauthorized

**Login Process:**
```
User Login Page (/login/user)
    ↓
User enters credentials
├─ Username: john_user
├─ Password: password123
└─ Click "Sign In"
    ↓
Credentials validated
    ↓
On Success:
├─ User authenticated
├─ Token stored
└─ Redirect to /ticket-list or /my-bookings
    ↓
On Failure:
├─ Error message displayed
├─ Session cleared
└─ User remains on login page
```

**Test Credentials:**
| Field | Value |
|-------|-------|
| Username | john_user |
| Email | john@example.com |
| Password | password123 |

---

#### Route: `/login/admin`
```
Path: /login/admin
Component: AdminLoginPage (from sign-in-page-admin)
Status: 🟢 PUBLIC (before login) → 🔵 AUTHENTICATED (after login)
Lazy Loaded: No
```

**Purpose:** Login page for administrators

**Features:**
- Admin-specific login interface
- Enhanced security features
- Admin notification preferences
- Dashboard access after login

**Navigation Access:**
- Click "Admin Login" on home page
- Direct URL: `http://localhost:4200/login/admin`
- Admin redirect if not logged in

**Login Process:**
```
Admin Login Page (/login/admin)
    ↓
Admin enters credentials
├─ Username: admin
├─ Password: adminpass123
└─ Click "Sign In"
    ↓
Credentials validated (admin role check)
    ↓
On Success:
├─ Admin authenticated
├─ Token stored with admin role
└─ Redirect to /admin (dashboard)
    ↓
On Failure:
├─ Error message displayed
└─ User remains on login page
```

**Test Credentials:**
| Field | Value |
|-------|-------|
| Username | admin |
| Email | admin@auditorium.com |
| Password | adminpass123 |

---

#### Route: `/login/eo`
```
Path: /login/eo
Component: EOLoginPage (from eo-login-page)
Status: 🟢 PUBLIC (before login) → 🔵 AUTHENTICATED (after login)
Lazy Loaded: No
```

**Purpose:** Login page for Event Organizers

**Features:**
- Event Organizer login interface
- Organization verification
- Dashboard access after login
- Event management capabilities

**Navigation Access:**
- Click "Event Organizer Login" on home page
- Direct URL: `http://localhost:4200/login/eo`
- EO redirect if not logged in

**Login Process:**
```
EO Login Page (/login/eo)
    ↓
Event Organizer enters credentials
├─ Username: jane_eo
├─ Password: eopass123
└─ Click "Sign In"
    ↓
Credentials validated (EO role check)
    ↓
On Success:
├─ EO authenticated
├─ Token stored with EO role
└─ Redirect to /eo (dashboard)
    ↓
On Failure:
├─ Error message displayed
└─ User remains on login page
```

**Test Credentials:**
| Field | Value |
|-------|-------|
| Username | jane_eo |
| Email | jane@events.com |
| Password | eopass123 |

---

### User Routes

#### Route: `/ticket/:id`
```
Path: /ticket/:id
Component: TicketBuy
Status: 🔵 AUTHENTICATED (protected)
Route Parameters: id (event ID)
Lazy Loaded: No
```

**Purpose:** Event details page and ticket purchase interface

**Features:**
- Event full details
- High-resolution event image
- Detailed description
- Location and date information
- Ticket pricing
- Available seat count
- Quantity selector
- Purchase button

**Navigation Access:**
- Click event card from /ticket-list
- Click event from /home carousel
- Direct URL: `http://localhost:4200/ticket/eo1` (example with ID)

**Route Parameters:**
```typescript
// Example URLs:
http://localhost:4200/ticket/eo1        // Event with ID: eo1
http://localhost:4200/ticket/event_001  // Event with ID: event_001
http://localhost:4200/ticket/summer2025 // Event with ID: summer2025
```

**Page Workflow:**
```
Ticket Purchase Page (/ticket/:id)
    ↓
Event details loaded from ID parameter
    ↓
Display event information
    ↓
User actions:
├─ View full description
├─ Check location/date
├─ Select ticket quantity
├─ Review total price
└─ Click "Buy Tickets"
    ↓
Purchase processing
    ↓
On Success:
├─ Payment processed (simulated)
├─ Booking confirmation shown
├─ Ticket PDF generated
├─ Confirmation email sent
└─ Redirect to /my-bookings
    ↓
On Failure:
├─ Error message displayed
└─ Retry option provided
```

**Event Details Displayed:**
```
┌─────────────────────────────────┐
│ Event Image                     │
├─────────────────────────────────┤
│ Event Title                     │
│ ⭐ Rating | 👥 Attendees       │
│ 📍 Location: [Address]          │
│ 📅 Date: [Date] | 🕐 [Time]    │
│ 💰 Price: Rp [Amount]          │
│ 🎫 Available: [Number] tickets  │
├─────────────────────────────────┤
│ Description                     │
│ [Full event description text]   │
├─────────────────────────────────┤
│ Quantity: [Selector] tickets    │
│ Total: Rp [Calculated Price]    │
│ [Buy Tickets Button]            │
└─────────────────────────────────┘
```

---

#### Route: `/my-bookings`
```
Path: /my-bookings
Component: MyBookings
Status: 🔵 AUTHENTICATED (protected by auth guard)
Role: User
Lazy Loaded: No
```

**Purpose:** Display user's purchased tickets and bookings

**Features:**
- List of all bookings
- Booking confirmation numbers
- Event details per booking
- Ticket quantity and pricing
- QR code display
- PDF download option
- Booking status
- Cancellation option

**Navigation Access:**
- Click "My Bookings" in user menu
- User profile dropdown menu
- Direct URL: `http://localhost:4200/my-bookings`
- Auto-redirect after successful purchase

**Booking Display:**
```
My Bookings Page (/my-bookings)
    ↓
Fetch all user's bookings
    ↓
Display list of bookings:
├─ Event name
├─ Event date
├─ Number of tickets
├─ Total price paid
├─ Booking reference
├─ Status (Confirmed/Cancelled)
└─ QR code
    ↓
User actions per booking:
├─ Download PDF ticket
├─ View QR code
├─ Share booking
├─ Cancel booking (if eligible)
└─ View event details
```

**Booking Card Structure:**
```
┌─────────────────────────────────┐
│ [Event Image]                   │
├─────────────────────────────────┤
│ Event: [Event Name]             │
│ Date: [Date] | Time: [Time]     │
│ Booking Ref: #ABC123DEF         │
│ Tickets: 3 x Rp 150,000         │
│ Total: Rp 450,000               │
│ Status: ✅ Confirmed            │
├─────────────────────────────────┤
│ [QR Code Image]                 │
├─────────────────────────────────┤
│ [Download PDF] [Cancel]         │
└─────────────────────────────────┘
```

---

### Admin Routes

#### Route: `/admin` 🔴
```
Path: /admin
Component: AdminDashboard
Status: 🔴 PROTECTED (admin role required)
Lazy Loaded: ⚡ Yes (loaded on-demand)
Route Guard: RoleGuard (admin)
```

**Purpose:** Administrator dashboard for platform management

**Features:**
- Analytics dashboard
- Revenue tracking
- Event overview
- Event Organizer management
- Platform statistics
- User management
- System settings

**Navigation Access:**
- Admin login redirects here
- Click "Admin Dashboard" in admin menu
- Direct URL: `http://localhost:4200/admin`

**Access Requirements:**
```typescript
// User must have:
- Authentication: ✅ Logged in
- Role: ✅ role === 'admin'
- Status: ✅ Active account

// If not met:
- Redirect to /login/admin
- Or redirect to home page
```

**Dashboard Sections:**
```
Admin Dashboard (/admin)
    │
    ├─ 📊 Analytics Section
    │  ├─ Revenue chart (Daily/Weekly/Monthly)
    │  ├─ Event count chart
    │  ├─ Ticket sales chart
    │  └─ Key metrics cards
    │
    ├─ 📋 Events Section
    │  ├─ All events across all EOs
    │  ├─ Event status indicators
    │  ├─ Event details
    │  ├─ In-depth analytics per event
    │  └─ Event action menu
    │
    └─ 👥 Event Organizer Management
       ├─ Registered EO list
       ├─ EO information cards
       ├─ Register new EO form
       ├─ EO contact details
       ├─ Remove EO option
       └─ EO activity tracking
```

**Lazy Loading Details:**
```typescript
// Lazy loaded from:
loadComponent: () => 
  import('./admin/admin-dashboard/admin-dashboard')
    .then(m => m.AdminDashboard)

// Loaded when:
- User navigates to /admin route
- Component requested from browser
- Not loaded on application startup
```

---

### Event Organizer Routes

#### Route: `/eo` 🔴
```
Path: /eo
Component: EODashboard
Status: 🔴 PROTECTED (EO role required)
Lazy Loaded: ⚡ Yes (loaded on-demand)
Route Guard: RoleGuard (eo)
```

**Purpose:** Event Organizer main dashboard

**Features:**
- List of EO's events
- Event performance analytics
- Booking management
- Revenue tracking
- Event creation link
- Event editing options
- Analytics per event

**Navigation Access:**
- EO login redirects here
- Click "My Dashboard" in EO menu
- Direct URL: `http://localhost:4200/eo`

**Access Requirements:**
```typescript
// User must have:
- Authentication: ✅ Logged in
- Role: ✅ role === 'eo'
- Status: ✅ Active EO account

// If not met:
- Redirect to /login/eo
- Or redirect to home page
```

**Dashboard Layout:**
```
EO Dashboard (/eo)
    │
    ├─ 👋 Welcome Section
    │  └─ Greeting with EO name
    │
    ├─ 📈 Statistics Section
    │  ├─ Total events created
    │  ├─ Total tickets sold
    │  ├─ Total revenue generated
    │  └─ Average booking size
    │
    ├─ 🎪 My Events Section
    │  ├─ Event cards with status
    │  ├─ Event images
    │  ├─ Ticket info (sold/available)
    │  ├─ Revenue info
    │  ├─ Edit button → /eo/event/:id/edit
    │  ├─ Delete option
    │  └─ Analytics button
    │
    ├─ ➕ Create Event Button
    │  └─ Link to /eo/create-event
    │
    └─ 📊 Quick Analytics
       ├─ Sales trend chart
       ├─ Top performing event
       └─ Upcoming events
```

**Lazy Loading Details:**
```typescript
// Lazy loaded from:
loadComponent: () => 
  import('./eo/eo-dashboard/eo-dashboard')
    .then(m => m.EODashboard)

// Loaded when:
- User navigates to /eo route
- Component requested from browser
- Not loaded on application startup
```

---

#### Route: `/eo/create-event` 🔴
```
Path: /eo/create-event
Component: CreateEvent
Status: 🔴 PROTECTED (EO role required)
Lazy Loaded: ⚡ Yes (loaded on-demand)
Route Guard: RoleGuard (eo)
```

**Purpose:** Create new event form

**Features:**
- Event information form
- Date and time selection
- Ticket configuration
- Image upload
- Form validation
- Event preview
- Publish button

**Navigation Access:**
- "Create Event" button on /eo dashboard
- "+" button in events section
- Direct URL: `http://localhost:4200/eo/create-event`

**Form Sections:**
```
Create Event Form (/eo/create-event)
    │
    ├─ 📝 Basic Information
    │  ├─ Event title
    │  ├─ Event description
    │  ├─ Event category
    │  └─ Event language
    │
    ├─ 📍 Location & Details
    │  ├─ Venue name
    │  ├─ Address
    │  ├─ City/Region
    │  └─ Map preview
    │
    ├─ 📅 Date & Time
    │  ├─ Event date (calendar picker)
    │  ├─ Start time
    │  ├─ End time
    │  ├─ Timezone
    │  └─ Duration calculator
    │
    ├─ 🎫 Ticket Configuration
    │  ├─ Total seats
    │  ├─ Price per ticket
    │  ├─ Early bird pricing
    │  ├─ Group discounts
    │  └─ Ticket types (VIP, Regular)
    │
    ├─ 🖼️ Media & Images
    │  ├─ Upload main image
    │  ├─ Image preview
    │  ├─ Crop/resize options
    │  └─ Alt text
    │
    ├─ 💳 Sales Configuration
    │  ├─ Sales start date
    │  ├─ Sales end date
    │  ├─ Payment methods
    │  └─ Terms & conditions
    │
    └─ ✅ Review & Publish
       ├─ Preview event
       ├─ Check all details
       ├─ Final validation
       └─ Publish button
           ↓
           Event created successfully
           Redirect to /eo
```

**Form Validation:**
```
- Event title: Required, max 200 characters
- Description: Required, min 50 characters
- Location: Required
- Date: Must be future date
- Time: Valid 24-hour format
- Seats: Minimum 1, maximum 10,000
- Price: Minimum Rp 0, maximum Rp 10,000,000
- Image: JPEG/PNG, max 5MB
```

**Lazy Loading Details:**
```typescript
// Lazy loaded from:
loadComponent: () => 
  import('./eo/create-event/create-event')
    .then(m => m.CreateEvent)

// Loaded when:
- User navigates to /eo/create-event
- Component requested from browser
```

---

#### Route: `/eo/event/:id/edit` 🔴
```
Path: /eo/event/:id/edit
Component: CreateEvent (reused)
Status: 🔴 PROTECTED (EO role required)
Lazy Loaded: ⚡ Yes (loaded on-demand)
Route Guard: RoleGuard (eo)
Route Parameters: id (event ID)
```

**Purpose:** Edit existing event

**Features:**
- Pre-populated event form
- All event details editable
- Image update
- Status change
- Delete option
- Save changes button

**Navigation Access:**
- "Edit" button on event card in /eo
- "Edit Event" from event menu
- Direct URL: `http://localhost:4200/eo/event/eo1/edit`

**Route Parameters:**
```typescript
// Example URLs:
http://localhost:4200/eo/event/eo1/edit         // Edit event eo1
http://localhost:4200/eo/event/summer2025/edit  // Edit summer2025 event
http://localhost:4200/eo/event/concert_001/edit // Edit concert_001
```

**Edit Form Behavior:**
```
Edit Event Form (/eo/event/:id/edit)
    │
    ├─ Load event data by ID parameter
    │  └─ Fetch event eo1 details
    │
    ├─ Pre-populate form fields
    │  ├─ Title: [loaded value]
    │  ├─ Description: [loaded value]
    │  ├─ Date: [loaded value]
    │  ├─ Price: [loaded value]
    │  └─ Image: [loaded value]
    │
    ├─ User edits fields
    │  └─ Form validation in real-time
    │
    ├─ Options:
    │  ├─ Save changes
    │  ├─ Discard changes
    │  ├─ Cancel (keep original)
    │  └─ Delete event
    │
    └─ On Save Success:
       ├─ Event updated in database
       ├─ Success message shown
       └─ Redirect to /eo
```

**Editable Fields:**
```
- Event title ✏️
- Description ✏️
- Date & Time ✏️
- Location ✏️
- Price ✏️
- Total seats ✏️
- Event image ✏️
- Status (if allowed) ✏️

Read-only Fields:
- Event ID (auto-generated)
- Created date
- Creator name
```

**Lazy Loading Details:**
```typescript
// Lazy loaded from:
loadComponent: () => 
  import('./eo/create-event/create-event')
    .then(m => m.CreateEvent)

// Loaded when:
- User navigates to /eo/event/:id/edit
- Component requested from browser
```

---

### Analytics Routes

#### Route: `/analytics` 🔴
```
Path: /analytics
Component: AnalyticsReports
Status: 🔴 PROTECTED (EO/Admin role required)
Lazy Loaded: ⚡ Yes (loaded on-demand)
Route Guard: RoleGuard (eo, admin)
```

**Purpose:** Detailed analytics and reporting

**Features:**
- Comprehensive analytics dashboard
- Multiple chart types
- Date range selection
- Export functionality
- Detailed reports
- Trend analysis
- Comparison tools

**Navigation Access:**
- "View Analytics" button from event card
- Analytics menu in user dashboard
- Direct URL: `http://localhost:4200/analytics`

**Analytics Sections:**
```
Analytics Reports (/analytics)
    │
    ├─ 📊 Dashboard Overview
    │  ├─ Key metrics cards
    │  ├─ Performance indicators
    │  ├─ Growth charts
    │  └─ Trend summary
    │
    ├─ 💹 Sales Analytics
    │  ├─ Revenue chart (line, bar, area)
    │  ├─ Booking trend
    │  ├─ Average order value
    │  ├─ Revenue per event
    │  └─ Date range selector
    │
    ├─ 🎫 Ticket Analytics
    │  ├─ Tickets sold per event
    │  ├─ Attendance rate
    │  ├─ Cancellation rate
    │  ├─ Peak booking times
    │  └─ Capacity fill percentage
    │
    ├─ 👥 Customer Analytics
    │  ├─ Total unique customers
    │  ├─ Repeat customer rate
    │  ├─ Customer demographics
    │  ├─ Geographic distribution
    │  └─ Customer lifetime value
    │
    ├─ 🎪 Event Analytics
    │  ├─ Top performing events
    │  ├─ Event comparison
    │  ├─ Event status breakdown
    │  └─ Upcoming events
    │
    ├─ 📥 Export & Reports
    │  ├─ Export to CSV
    │  ├─ Export to PDF
    │  ├─ Generate report
    │  ├─ Schedule reports
    │  └─ Email reports
    │
    └─ 🔍 Filters & Controls
       ├─ Date range picker
       ├─ Event filter
       ├─ Category filter
       ├─ Status filter
       └─ Search functionality
```

**Lazy Loading Details:**
```typescript
// Lazy loaded from:
loadComponent: () => 
  import('./analytics/analytics-reports/analytics-reports')
    .then(m => m.AnalyticsReports)

// Loaded when:
- User navigates to /analytics
- Component requested from browser
```

**Access Control:**
```typescript
// Admin access:
- All platform analytics
- All events analytics
- All users analytics
- System-wide reports

// EO access:
- Own events analytics only
- Own bookings data
- Own revenue reports
- Cannot access other EO data
```

---

## Route Guards & Protection

### Authentication Guard

**Purpose:** Protects routes that require login

**Implementation:**
```typescript
// Redirect flow for unauthenticated users:
Protected Route Accessed
    ↓
Check: User authenticated?
    ├─ No → Redirect to /login/user (or appropriate login)
    └─ Yes → Allow access
```

**Protected Routes:**
- `/ticket/:id` - View ticket purchase
- `/my-bookings` - View bookings
- `/admin` - Admin dashboard
- `/eo` - EO dashboard
- `/eo/create-event` - Create event
- `/eo/event/:id/edit` - Edit event
- `/analytics` - Analytics reports

### Role Guard

**Purpose:** Ensures user has required role for specific routes

**Implementation:**
```typescript
// Role check flow:
Protected Route Accessed
    ↓
Check: User authenticated?
    ├─ No → Redirect to /login/[role]
    └─ Yes → Check: User has required role?
        ├─ No → Redirect to /home (unauthorized)
        └─ Yes → Allow access
```

**Role-Protected Routes:**

| Route | Required Role | Alternative Redirect |
|-------|---------------|----------------------|
| `/admin` | admin | /home (or /login/admin) |
| `/eo` | eo | /home (or /login/eo) |
| `/eo/create-event` | eo | /home |
| `/eo/event/:id/edit` | eo | /home |
| `/analytics` | eo, admin | /home |

---

## Navigation Flows

### Complete User Journey: From Home to Ticket Purchase

```
START
  │
  ├─ Visit http://localhost:4200 ────────→ / (Home)
  │                                        │
  │                                        ├─ Unauthenticated view
  │                                        ├─ See featured events
  │                                        └─ Browse events button
  │
  └─ Click "Browse Events" ────────────→ /ticket-list
                                         │
                                         ├─ View all events
                                         ├─ Search/filter
                                         └─ Click event card
                                             │
                                             └─ Need to login?
                                                ├─ Yes → /login/user
                                                │          │
                                                │          ├─ Enter credentials
                                                │          ├─ Click Sign In
                                                │          └─ On success → continues below
                                                │
                                                └─ No → Skip to next step
                                                    │
                                                    └─ /ticket/:id
                                                       (View event details)
                                                       │
                                                       ├─ See full details
                                                       ├─ Select quantity
                                                       ├─ Click "Buy Tickets"
                                                       └─ Purchase processed
                                                           │
                                                           └─ /my-bookings
                                                              (View confirmation)
                                                              │
                                                              ├─ Download PDF
                                                              ├─ View QR code
                                                              └─ Share booking
```

### Event Organizer Journey: Create & Manage Event

```
START
  │
  ├─ Visit /login/eo ──────────────────→ EOLoginPage
  │                                      │
  │                                      ├─ Enter credentials
  │                                      ├─ Click Sign In
  │                                      └─ On success → /eo
  │                                          │
  │                                          └─ /eo (Dashboard)
  │                                             │
  │                                             ├─ View my events
  │                                             └─ Click "Create Event" button
  │                                                 │
  │                                                 └─ /eo/create-event
  │                                                    (Create Event Form)
  │                                                    │
  │                                                    ├─ Fill event details
  │                                                    ├─ Upload image
  │                                                    ├─ Set pricing
  │                                                    ├─ Click "Publish"
  │                                                    └─ On success → /eo
  │                                                        │
  │                                                        ├─ Event visible in list
  │                                                        ├─ Can edit → /eo/event/:id/edit
  │                                                        └─ Can view analytics → /analytics
  │
  └─ Repeat: Create/Manage multiple events
```

### Admin Journey: Platform Management

```
START
  │
  ├─ Visit /login/admin ──────────────→ AdminLoginPage
  │                                     │
  │                                     ├─ Enter credentials
  │                                     ├─ Click Sign In
  │                                     └─ On success → /admin
  │                                         │
  │                                         └─ /admin (Dashboard)
  │                                            │
  │                                            ├─ View analytics
  │                                            │  ├─ Revenue charts
  │                                            │  ├─ Event stats
  │                                            │  └─ Select metrics
  │                                            │
  │                                            ├─ Review all events
  │                                            │  ├─ Click event
  │                                            │  ├─ View details
  │                                            │  └─ View analytics
  │                                            │
  │                                            └─ Manage Event Organizers
  │                                               ├─ View registered EOs
  │                                               ├─ Click "Register EO" button
  │                                               ├─ Fill registration form
  │                                               ├─ Click "Register"
  │                                               ├─ EO added to system
  │                                               ├─ Welcome email sent
  │                                               └─ EO can login via /login/eo
  │
  └─ Continue: Manage platform operations
```

---

## Route Parameter Reference

### Event ID Parameter (`:id`)

**Used in Routes:**
- `/ticket/:id` - Event details and purchase
- `/eo/event/:id/edit` - Edit event

**Format:**
```typescript
// Event IDs can be:
- Numeric: 123, 456, 789
- Alphanumeric: eo1, event_001, summer2025
- UUID: 550e8400-e29b-41d4-a716-446655440000

// Examples:
http://localhost:4200/ticket/eo1
http://localhost:4200/ticket/event_001
http://localhost:4200/eo/event/eo1/edit
http://localhost:4200/eo/event/summer2025/edit
```

**Accessing in Component:**
```typescript
import { ActivatedRoute } from '@angular/router';

constructor(private route: ActivatedRoute) {
  this.route.params.subscribe(params => {
    const eventId = params['id'];
    console.log('Event ID:', eventId);
    // Load event details using eventId
  });
}
```

---

## Performance: Lazy Loading Benefits

### Lazy-Loaded Routes

```
Routes with Lazy Loading:
├─ /admin              ⚡ AdminDashboard
├─ /eo                 ⚡ EODashboard  
├─ /eo/create-event    ⚡ CreateEvent
├─ /eo/event/:id/edit  ⚡ CreateEvent
└─ /analytics          ⚡ AnalyticsReports
```

### Loading Strategy

```
Initial Bundle Load:
├─ Public routes (Home, About, FAQ, etc.) - 100% loaded
├─ Login pages - 100% loaded
├─ Lazy modules - NOT loaded
└─ Total: ~200KB

When Admin Navigates to /admin:
├─ AdminDashboard component loaded (~50KB)
├─ Dependencies resolved
├─ Bundle increases by ~50KB
└─ Component renders

Benefits:
✅ Faster initial page load (less JS to parse)
✅ Better Time to Interactive (TTI)
✅ Reduced memory usage on first load
✅ User only downloads code they use
```

---

## Summary Table: All Routes

| Route | Component | Public | Auth | Role | Lazy | Purpose |
|-------|-----------|--------|------|------|------|---------|
| `/` | Home | ✅ | ❌ | - | ❌ | Landing page |
| `/about` | About | ✅ | ❌ | - | ❌ | Platform info |
| `/faq` | Faq | ✅ | ❌ | - | ❌ | FAQ section |
| `/ticket-list` | TicketList | ✅ | ❌ | - | ❌ | Browse events |
| `/login/user` | UserLoginPage | ✅ | ❌ | - | ❌ | User login |
| `/login/admin` | AdminLoginPage | ✅ | ❌ | - | ❌ | Admin login |
| `/login/eo` | EOLoginPage | ✅ | ❌ | - | ❌ | EO login |
| `/ticket/:id` | TicketBuy | ❌ | ✅ | user | ❌ | Purchase ticket |
| `/my-bookings` | MyBookings | ❌ | ✅ | user | ❌ | View bookings |
| `/admin` | AdminDashboard | ❌ | ✅ | admin | ⚡ | Admin panel |
| `/eo` | EODashboard | ❌ | ✅ | eo | ⚡ | EO panel |
| `/eo/create-event` | CreateEvent | ❌ | ✅ | eo | ⚡ | Create event |
| `/eo/event/:id/edit` | CreateEvent | ❌ | ✅ | eo | ⚡ | Edit event |
| `/analytics` | AnalyticsReports | ❌ | ✅ | eo/admin | ⚡ | Analytics |

---

## Quick Navigation Reference

### For End Users
```
Home (/home)
  → Browse Events (/ticket-list)
    → View Details (/ticket/:id)
      → Purchase
        → My Bookings (/my-bookings)
```

### For Event Organizers
```
Login (/login/eo)
  → Dashboard (/eo)
    → Create Event (/eo/create-event)
      → Manage (/eo/event/:id/edit)
        → Analytics (/analytics)
```

### For Administrators
```
Login (/login/admin)
  → Dashboard (/admin)
    → View Events
      → Event Analytics (/analytics)
    → Manage Event Organizers
```

---

**Documentation Version:** 1.0  
**Last Updated:** November 30, 2025  
**Angular Version:** 20.3.0  
**Framework:** Angular with TypeScript
