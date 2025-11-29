# WebTech Ticketing Assignment - Complete Project Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [New Web Technologies](#new-web-technologies)
3. [Setup & Configuration Guide](#setup--configuration-guide)
4. [User Manuals](#user-manuals)
5. [Architecture & Features](#architecture--features)
6. [Development Guide](#development-guide)

---

## Project Overview

The **WebTech Ticketing Assignment** is a comprehensive web-based ticket management system built with modern Angular 20 and TypeScript. The application enables multiple user roles (Administrator, Event Organizers, and Users) to manage events, purchase tickets, and view detailed analytics through a sophisticated user interface.

**Project Scope:**
- Event management and creation
- Ticket purchasing and booking system
- Analytics and reporting capabilities
- PDF/QR code generation for tickets
- Role-based access control
- Real-time event organizer management
- Mobile-responsive design

**Technology Stack:**
- **Frontend:** Angular 20, TypeScript 5.9, RxJS 7.8
- **Backend:** Express.js 5.1 (for SSR)
- **Build Tool:** Angular CLI 20, esbuild
- **Styling:** Bootstrap 5.3, Custom CSS with PostCSS
- **Testing:** Jasmine, Karma, Jest
- **Documentation:** Markdown

---

## New Web Technologies

This section details all libraries, frameworks, and packages introduced in this project that extend beyond a basic Angular setup, with justification for each implementation.

### 1. **Angular SSR (Server-Side Rendering)**
**Package:** `@angular/ssr ^20.3.10`, `@angular/platform-server ^20.3.0`

**Why Implemented:**
- Enables server-side rendering for improved SEO and initial page load performance
- Provides faster first contentful paint (FCP) for users accessing the ticketing platform
- Supports crawlable content for search engines, important for event discovery
- Reduces client-side rendering overhead on initial page loads

**Reference Files:**
- `src/server.ts` - Express server configuration
- `src/main.server.ts` - Server-side bootstrap
- `src/app.routes.server.ts` - Server-specific routing

### 2. **jsPDF & HTML2Canvas**
**Packages:** `jspdf ^3.0.4`, `html2canvas ^1.4.1`

**Why Implemented:**
- Generates PDF documents directly from HTML content without server-side processing
- Converts rendered ticket cards and event details into downloadable PDF files
- Enables users to save purchased tickets as PDF for offline access
- Provides visual rendering of complex HTML layouts as image-based PDFs

**Use Cases:**
- Ticket PDF generation with event details and pricing
- Event receipt generation for users
- Admin reporting and documentation export

**Reference Service:**
- `src/app/services/pdf-generator.service.ts` - PDF generation utilities

### 3. **QRCode Library**
**Package:** `qrcode ^1.5.4`

**Why Implemented:**
- Generates QR codes for ticket validation and entry scanning
- Encodes ticket information in scannable format
- Enables venue staff to quickly validate tickets using mobile QR code readers
- Prevents ticket fraud through unique, encoded ticket identifiers

**Integration Points:**
- Ticket purchase confirmation pages
- Event entry validation workflows
- Ticket PDF attachments

### 4. **Swiper (Carousel Component)**
**Package:** `swiper ^12.0.3`

**Why Implemented:**
- Provides responsive, touch-friendly carousel/slider functionality
- Displays featured events and promotions on home page
- Enables smooth, native-like swiping on mobile devices
- Reduces need for custom carousel implementation
- Includes pagination, navigation, and autoplay features

**Features Used:**
- Responsive breakpoints for different screen sizes
- Touch gesture support for mobile users
- Automatic slide transitions
- Dynamic event display in hero section

### 5. **Bootstrap 5.3**
**Package:** `bootstrap ^5.3.8`

**Why Implemented:**
- Provides comprehensive grid system for responsive design
- Includes pre-built components (modals, forms, buttons, alerts)
- Ensures consistent styling across browsers
- Reduces custom CSS required for common UI patterns
- Mobile-first responsive framework

**Usage Pattern:**
- Imported globally in `angular.json` build configuration
- Complements custom CSS for theming
- Forms and alert components in login/registration pages

### 6. **Express.js**
**Package:** `express ^5.1.0`

**Why Implemented:**
- Required for Angular SSR server implementation
- Handles server-side request routing
- Serves static assets efficiently
- Manages middleware for security and performance
- Integrates with Angular Platform Server

**Reference:**
- `src/server.ts` - Main Express server setup

### 7. **RxJS (Reactive Extensions)**
**Package:** `rxjs ~7.8.0`

**Why Implemented:**
- Fundamental library for Angular's reactive programming model
- Manages asynchronous operations and data streams
- Used throughout services for API communication simulation
- Observable-based event handling and state management
- Enables reactive form validation

**Core Usage:**
- `AuthService` - User authentication state management
- `DataEventService` - Event data streams
- `BehaviorSubject` for state management
- Reactive Forms with Observable pipelines

### 8. **TypeScript 5.9**
**Package:** `typescript ~5.9.2`

**Why Implemented:**
- Provides strong static typing for JavaScript
- Enables early error detection during development
- Improves code maintainability and IDE support
- Supports modern JavaScript features with type safety
- Angular 20 requires TypeScript 5.x

**Key Features Used:**
- Interfaces (User, EventItem, AuthState)
- Type guards and generics
- Decorators (@Component, @Injectable)
- Enums for constants
- Union and intersection types

---

## Setup & Configuration Guide

### Prerequisites

Before setting up the project, ensure your system has:
- **Node.js:** Version 20.x or later (LTS recommended)
- **npm:** Version 10.x or later (included with Node.js)
- **Git:** For version control
- **Modern Browser:** Chrome, Firefox, Safari, or Edge (latest versions)

### Installation Steps

#### 1. Install Node.js

**Windows:**
1. Visit [nodejs.org](https://nodejs.org) and download the LTS version
2. Run the installer and follow the setup wizard
3. Accept default settings for PATH configuration
4. Verify installation:
   ```powershell
   node --version
   npm --version
   ```

**macOS:**
```bash
# Using Homebrew (recommended)
brew install node@20
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install nodejs npm
```

#### 2. Clone the Repository

```bash
git clone https://github.com/kurngxtech/WebTech_Ticketing_Assignment.git
cd WebTech_Ticketing_Assignment
git checkout home
```

#### 3. Install Project Dependencies

```powershell
# Navigate to project root
cd n:\code\Angular\ticket

# Install all dependencies from package.json
npm install

# Expected output: 200+ packages installed
```

**Installation Breakdown:**
- **Angular Core:** 15-20 minutes on first installation
- **Bootstrap & UI Libraries:** 5-10 minutes
- **Dev Dependencies:** 10-15 minutes
- **Total Estimated Time:** 30-45 minutes on fresh system

#### 4. Environment Configuration

**Development Environment (Default)**
- File: `src/environments/environment.ts`
- Configuration:
  ```typescript
  export const environment = {
    production: false,
    useMocks: true,  // Uses mock data from mock-users.ts and mock-events.ts
  };
  ```

**Production Environment**
- File: `src/environments/environment.prod.ts`
- Configuration:
  ```typescript
  export const environment = {
    production: true,
    useMocks: false,  // Would connect to real API endpoints
  };
  ```

**Mock Data Configuration:**
- Mock users stored in `src/app/mock/mock-users.ts`
- Mock events stored in `src/app/mock/mock-events.ts`
- Enable/disable via `environment.useMocks` setting

### Running the Application

#### Development Server

```powershell
# Start development server with live reload
npm start

# Or use ng command directly
ng serve

# Application will be available at:
# http://localhost:4200
```

**Expected Output:**
```
✔ Compiled successfully. [123.456 ms]
⠙ Building...
Application bundle generation complete. [5.123 seconds]

** Angular Live Development Server is listening on localhost:4200 **
```

**Default Credentials for Testing:**

| Role | Username | Password | Email |
|------|----------|----------|-------|
| Admin | admin | adminpass123 | admin@auditorium.com |
| Event Organizer | jane_eo | eopass123 | jane@events.com |
| User | john_user | password123 | john@example.com |

#### Production Build

```powershell
# Build for production
npm run build

# Output directory: dist/ticket
# File size should be < 1MB for main bundle
```

#### Run Tests

```powershell
# Execute unit tests with Karma/Jasmine
npm test

# Expected output: Karma server starts on localhost:9876
```

#### Server-Side Rendering (SSR)

```powershell
# Build with SSR enabled
ng build

# Start SSR server
npm run serve:ssr:ticket

# Application will be available at:
# http://localhost:4200
```

### Project Structure Configuration

**Root Directory:**
```
ticket/
├── src/                          # Source code
│   ├── app/                      # Angular application
│   │   ├── admin/               # Admin dashboard component
│   │   ├── auth/                # Authentication service & types
│   │   ├── eo/                  # Event Organizer components
│   │   ├── user/                # User components
│   │   ├── services/            # Business logic services
│   │   ├── layout/              # Header/Footer components
│   │   ├── mock/                # Mock data for development
│   │   └── app.ts               # Root component
│   ├── environments/            # Environment configurations
│   ├── main.ts                  # Client bootstrap
│   ├── main.server.ts           # Server bootstrap
│   ├── server.ts                # Express server
│   └── styles.css               # Global styles
├── dist/                        # Compiled output
├── node_modules/               # Dependencies
├── angular.json                # Angular CLI configuration
├── tsconfig.json              # TypeScript base config
├── package.json               # Dependencies manifest
└── README.md                  # Project README
```

### Build Configuration (angular.json)

**Key Build Options:**
```json
{
  "build": {
    "options": {
      "styles": [
        "node_modules/bootstrap/dist/css/bootstrap.min.css",
        "src/styles.css"
      ],
      "scripts": [
        "node_modules/bootstrap/dist/js/bootstrap.bundle.min.js"
      ],
      "assets": ["public/*"],
      "outputMode": "server",
      "ssr": {
        "entry": "src/server.ts"
      }
    }
  }
}
```

**Performance Budgets:**
- Initial bundle: 500 KB (warning), 1 MB (error)
- Component styles: 4 KB (warning), 8 KB (error)

### Troubleshooting Installation

**Issue: npm install fails**
```powershell
# Clear npm cache
npm cache clean --force

# Delete package-lock.json and node_modules
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json

# Reinstall
npm install
```

**Issue: Port 4200 already in use**
```powershell
# Use alternate port
ng serve --port 4300

# Or kill process on port 4200
netstat -ano | findstr :4200
taskkill /PID <PID> /F
```

**Issue: TypeScript compilation errors**
```powershell
# Verify TypeScript version
npm list typescript

# Update if needed
npm install typescript@latest
```

---

## User Manuals

### General Navigation & Access

All users access the application through a web browser at `http://localhost:4200`. The interface features:

- **Persistent Top Navigation Bar** - Always visible with user profile and logout
- **Role-Based Menu System** - Different navigation options based on user role
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- **Dark Theme Interface** - Modern black and gold color scheme

### Admin Dashboard

**Access:** Login with admin credentials
**URL:** `http://localhost:4200/admin`

#### Admin Dashboard Features

**1. Analytics & Reporting**

The dashboard displays:
- **Line Chart:** Visualizes selected metrics (Revenue, Total Events, Tickets Sold)
- **Time Period Selection:** Toggle between Daily, Weekly, Monthly views
- **Data Type Selection:** Switch between three chart types for different insights

**How to Use:**
1. Navigate to Admin Dashboard
2. Click the **⋮ (menu) icon** in chart header to select data type
3. Click the **⋮ (menu) icon** in time period section to change view
4. Chart updates automatically with new data

**Metrics Displayed:**
- **Revenue:** Total money collected from ticket sales (in Rupiah)
- **Total Events:** Count of all events created by all Event Organizers
- **Tickets Sold:** Total number of tickets purchased across all events

**2. Events Management**

The admin dashboard displays all events created by all Event Organizers in a unified view:

**Event Card Layout:**
- Event image (200px width)
- Event details: title, tickets sold, location, date, revenue
- Status badge (Active, Draft, Completed, Cancelled)
- Action menu with "In-depth Analysis" button

**How to View Analytics:**
1. Locate event card in the events section
2. Click the **⋯ (three dots)** menu button
3. Select "📊 In-depth Analysis"
4. View detailed event analytics in modal

**Event Status Indicators:**
- 🟢 **Active:** Event is live and selling tickets
- 🟡 **Draft:** Event is being prepared, not yet active
- 🔵 **Completed:** Event has finished
- 🔴 **Cancelled:** Event was cancelled

**3. Event Organizer Management**

The admin can register, view, and manage Event Organizers:

**Registering a New Event Organizer:**
1. Scroll to "Registered Event Organizers" section at bottom
2. Click **"+ Register Event Organizer"** button
3. Fill in registration form:
   - **Full Name:** Event organizer's complete name
   - **Email Address:** Valid email for communications
   - **Phone Number:** Contact phone number (format: +62XXXXXXXXX or 08XXXXXXXXX)
   - **Organization Name:** Company/organization name (optional)
   - **Username:** Unique username for login
   - **Password:** Minimum 6 characters
   - **Confirm Password:** Must match password field
4. Click "Register Event Organizer" button
5. Success message confirms EO was registered
6. An automated welcome email is sent to the EO with login credentials

**Validation Rules:**
- Email must be unique (no duplicates allowed)
- Username must be unique (no duplicates allowed)
- Email format must be valid (name@domain.com)
- Password must match confirmation
- All required fields must be completed

**Viewing Registered Event Organizers:**
1. Scroll to "Registered Event Organizers" section
2. View list of EO cards with information:
   - Avatar with first letter of name
   - Full name and username
   - Contact information (email, phone)
   - Organization name
   - Registration date
3. Each card shows a "Remove" button for management

**Removing an Event Organizer:**
1. Locate the EO card
2. Click "🗑 Remove" button
3. Confirm deletion when prompted
4. EO is removed from system

---

### Event Organizer Dashboard

**Access:** Login with Event Organizer credentials
**URL:** `http://localhost:4200/eo`

#### Event Organizer Features

**1. Event Management**

Event Organizers can create and manage events for their organization:

**Creating a New Event:**
1. Navigate to EO Dashboard
2. Click **"+ Create Event"** button
3. Fill in event form:
   - **Event Title:** Name of the event
   - **Description:** Detailed event description
   - **Location:** Venue address
   - **Date:** Event date
   - **Total Seats:** Number of available tickets
   - **Price per Ticket:** Ticket cost in Rupiah
   - **Event Image:** Upload event promotional image
4. Click "Create Event" to publish
5. Event appears in your dashboard and is available for users to purchase

**Event Status Management:**
- **Draft:** Event is being created, not yet published
- **Active:** Event is live and selling tickets
- **Completed:** Event has ended
- **Cancelled:** Event was cancelled (can be modified before cancellation)

**Editing Events:**
1. Click on event card
2. Select "Edit Event" from action menu
3. Modify event details
4. Save changes

**Cancelling Events:**
1. Click on event card
2. Select "Cancel Event" from action menu
3. Confirm cancellation
4. Event status changes to "Cancelled"
5. No refunds are automatically processed (admin handles manually)

**2. Analytics & Reports**

Event Organizers can view performance metrics for their events:

**Available Metrics:**
- **Total Tickets Sold:** Number of tickets purchased
- **Total Revenue:** Money earned from ticket sales
- **Booking Trends:** Line chart showing sales over time
- **Attendee Information:** User names and booking dates

**Generating Reports:**
1. Click "View Analytics" for specific event
2. Analytics modal opens showing:
   - Event performance metrics
   - Revenue breakdown
   - Attendance trends
3. Data can be exported (if export feature is enabled)

---

### User/Customer Interface

**Access:** Login with user credentials
**URL:** `http://localhost:4200/user`

#### User Features

**1. Event Discovery**

Users can browse and search for events:

**Browsing Events:**
1. Navigate to Home page or Events page
2. View featured events in carousel (swipe to see more)
3. View all available events below

**Event Information Displayed:**
- Event image
- Event title and description
- Location and date
- Available tickets count
- Price per ticket
- Event status

**2. Ticket Purchase**

Purchasing tickets for events:

**Step-by-Step Purchase Process:**
1. Click on event card to view details
2. View full event description and pricing
3. Click "Buy Tickets" button
4. Select quantity:
   - Quantity slider or input field
   - Cannot exceed available tickets
   - Cannot be less than 1
5. Review order:
   - Event details
   - Number of tickets
   - Total price calculation
6. Click "Confirm Purchase"
7. Payment processing (simulated in development)
8. Confirmation page with:
   - Booking confirmation number
   - QR code for entry (if enabled)
   - Option to download PDF receipt

**Ticket Delivery:**
- Tickets are immediately available in user's "My Bookings"
- Email confirmation sent to user
- PDF receipt can be downloaded

**3. My Bookings**

Users can view and manage their purchased tickets:

**Accessing Bookings:**
1. Navigate to "My Bookings" section
2. View all purchased tickets organized by event

**Booking Information:**
- Event name and date
- Number of tickets purchased
- Total price paid
- Booking status (Confirmed, Cancelled, Completed)
- Unique booking reference number

**Managing Bookings:**
- **Download Ticket PDF:** Get printable ticket
- **View QR Code:** Display QR code for entry
- **Cancel Booking:** Cancel ticket purchase (if eligible)
- **Share Booking:** Share booking details with others

**Cancellation Policy:**
- Tickets can be cancelled before event date
- Refunds processed to original payment method
- Cancellation fee may apply (configurable)

**4. Event Analytics (User View)**

Users can view analytics for events they're interested in:

**Information Available:**
- Event popularity (number of bookings)
- Capacity fill percentage
- Price trends
- Similar events recommendations

---

### Authentication & Account Management

#### Login Process

**For All User Types:**
1. Navigate to login page
2. Enter username or email
3. Enter password
4. Click "Sign In"
5. Application verifies credentials
6. On success, redirected to user dashboard
7. On failure, error message displays

**Login Endpoints:**
- **Admin:** `http://localhost:4200/login/admin`
- **Event Organizer:** `http://localhost:4200/login/eo`
- **User:** `http://localhost:4200/login/user`

#### Password Management

**Changing Password (for logged-in users):**
1. Navigate to Account Settings
2. Click "Change Password"
3. Enter current password
4. Enter new password (minimum 6 characters)
5. Confirm new password
6. Click "Update Password"
7. Success message confirms change

**Password Requirements:**
- Minimum 8 characters (recommended)
- Mix of uppercase and lowercase letters (recommended)
- Include numbers and symbols (recommended)
- Unique from previous 5 passwords (enforced)

#### Logout

**Logging Out:**
1. Click user profile icon in top-right corner
2. Select "Logout" from menu
3. Redirected to login page
4. Session is cleared from application

---

### Event Organizer Event Creation Workflow

#### Complete Event Creation Guide

**Phase 1: Event Information**
1. Log in as Event Organizer
2. Click "Create Event" button
3. Complete basic information:
   - Title: Event name (max 100 characters)
   - Description: Event details (max 5000 characters)
   - Category: Select event type
   - Location: Venue address
   - City/Region: Select location

**Phase 2: Event Date & Time**
1. Select event date from calendar
2. Set event start time (HH:MM format)
3. Set event end time
4. Set ticket sale start date
5. Set ticket sale end date

**Phase 3: Ticket Configuration**
1. Enter total number of seats
2. Set ticket price (Rupiah)
3. Configure ticket types (if applicable):
   - VIP tier
   - Regular tier
   - Student tier
4. Set per-person ticket limits

**Phase 4: Event Image & Media**
1. Upload promotional image (recommended: 1200x600px)
2. Optional: Add additional images
3. Set featured image
4. Preview how event appears to users

**Phase 5: Review & Publish**
1. Review all entered information
2. Check pricing calculation
3. Verify ticket availability
4. Publish event
5. Event goes live immediately
6. Appears in user search and browsing

**After Publication:**
- Event visible to all users
- Users can purchase tickets immediately
- You receive booking notifications
- Analytics become available
- Can edit event details (before sales begin)

---

### Ticket PDF & QR Code Generation

#### Downloading Ticket PDF

**For End Users:**
1. Navigate to "My Bookings"
2. Find relevant booking
3. Click "Download PDF Ticket"
4. PDF file downloads with:
   - Booking confirmation number
   - Event details (name, date, time, location)
   - Number of tickets
   - QR code for entry validation
   - Barcode or reference number

**PDF Contents:**
```
┌─────────────────────────────────┐
│  TICKET CONFIRMATION            │
│  Event: [Event Name]            │
│  Date: [Date & Time]            │
│  Location: [Venue]              │
│  Booking #: [Reference]         │
│  Tickets: [Number] x [Price]    │
│  Total: [Amount]                │
│                                 │
│  [QR CODE IMAGE]                │
│                                 │
│  Valid for entry on event date  │
└─────────────────────────────────┘
```

**QR Code Information:**
- Encodes booking reference number
- Encodes event ID
- Encodes ticket quantity
- Venue staff scan to validate entry
- One code per booking (not per ticket)

#### Sharing Tickets

**Sharing with Others:**
1. In My Bookings, click "Share"
2. Select share method:
   - Email ticket (sends PDF via email)
   - Generate shareable link
   - Print ticket
   - Export to calendar
3. Recipient receives ticket information

---

### Dashboard Analytics & Reporting

#### Admin Analytics

**Accessing Admin Analytics:**
1. Log in as admin
2. Go to Admin Dashboard
3. View three main report types:
   - Revenue Report (total money collected)
   - Ticket Sales Report (volume of tickets sold)
   - Event Count Report (number of active events)

**Analyzing Data:**
1. Select data type from chart menu
2. Choose time period (daily, weekly, monthly)
3. Identify trends and patterns
4. Export report data (if available)

**Key Metrics Tracked:**
- Total platform revenue
- Average ticket price
- Peak sales times
- Top performing events
- Geographic distribution (if available)

#### Event Organizer Analytics

**Event Performance Dashboard:**
1. Log in as EO
2. View all your events with metrics:
   - Tickets sold / remaining
   - Revenue generated
   - Booking trend line
   - Conversion rate
   - Average booking size

**Individual Event Analytics:**
1. Click "View Analytics" on event
2. Access detailed metrics:
   - Revenue breakdown by booking
   - Customer demographics
   - Booking timeline
   - Repeat customer analysis

**Exporting Reports:**
1. Select report type
2. Choose date range
3. Click "Export as PDF" or "Export as CSV"
4. File downloads with formatted data

---

### Mobile & Responsive Usage

#### Mobile Device Optimization

**Responsive Breakpoints:**
- **Desktop:** 1400px and above
- **Tablet:** 768px to 1399px
- **Mobile:** 480px to 767px
- **Small Mobile:** Below 480px

**Mobile-Specific Features:**
1. **Touch-Optimized Navigation**
   - Larger tap targets (48px minimum)
   - Swipe gestures for carousels
   - Slide-out mobile menu

2. **Responsive Forms**
   - Single-column layout on mobile
   - Large input fields
   - Mobile keyboard optimization

3. **Performance Optimization**
   - Lazy-loaded images
   - Reduced animations on mobile
   - Optimized bundle size

**Using on Mobile:**
1. Open browser and navigate to application URL
2. Interface automatically adjusts to screen size
3. Use touch gestures to interact:
   - Swipe left/right for carousels
   - Pinch to zoom (if enabled)
   - Tap buttons and links
4. All features work identically to desktop

---

## Architecture & Features

### System Architecture

**Layered Architecture:**

```
┌─────────────────────────────────┐
│  Presentation Layer             │
│  Components & Templates         │
├─────────────────────────────────┤
│  Business Logic Layer           │
│  Services & State Management    │
├─────────────────────────────────┤
│  Data Layer                     │
│  Mock Services & HTTP Clients   │
├─────────────────────────────────┤
│  Express Server (SSR)           │
│  Server-side rendering & routing│
└─────────────────────────────────┘
```

### Core Components

**1. Authentication System**
- File: `src/app/auth/auth.service.ts`
- Manages user login/logout
- Stores authentication state in localStorage
- Provides role-based access control
- Uses BehaviorSubject for state management

**2. Data Event Service**
- File: `src/app/data-event-service/data-event.service.ts`
- Manages event data across application
- Provides methods for CRUD operations
- Generates analytics data
- Simulates API responses with mock data

**3. Admin Dashboard**
- File: `src/app/admin/admin-dashboard/`
- Comprehensive event and EO management
- Line chart analytics
- Event Organizer registration and management
- Full-featured admin interface

**4. Event Organizer Dashboard**
- File: `src/app/eo/eo-dashboard/`
- Event creation and management
- Event analytics and reporting
- Booking management
- Revenue tracking

**5. PDF Generator Service**
- File: `src/app/services/pdf-generator.service.ts`
- Generates ticket PDFs using jsPDF
- Captures HTML as canvas using html2canvas
- Embeds QR codes in tickets
- Supports multiple ticket formats

### Routing Architecture

**Application Routes:**

```
/
├── /home                          # Public home page
├── /about                         # About page
├── /faq                          # FAQ section
├── /login
│   ├── /login/admin              # Admin login
│   ├── /login/eo                 # Event Organizer login
│   └── /login/user               # User login
├── /admin
│   └── /admin/dashboard          # Admin dashboard (protected)
├── /eo
│   ├── /eo/dashboard             # EO dashboard (protected)
│   └── /eo/create-event          # Event creation (protected)
├── /user
│   ├── /user/bookings            # My bookings (protected)
│   └── /user/tickets             # Ticket details (protected)
└── /events                       # Event browsing
```

**Protected Routes:**
- Routes require authentication
- Redirects to login if not authenticated
- Checks user role for access
- Prevents unauthorized access

### State Management

**Authentication State:**
```typescript
interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  token?: string;
}
```

**Event State:**
```typescript
interface EventItem {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  price: number;
  img?: string;
  status: 'active' | 'draft' | 'completed' | 'cancelled';
  organizer: string;
}
```

### Form Validation

**Reactive Forms Implementation:**
- FormBuilder for form creation
- Validators: required, email, minLength, pattern
- Custom validators: passwordMatchValidator
- Real-time validation feedback
- Form-level and field-level validation

**Common Validators Used:**
```typescript
- Validators.required         // Field must have value
- Validators.email           // Must be valid email
- Validators.minLength(6)    // Minimum character length
- Validators.pattern(regex)  // Must match regex pattern
- customValidator()          // Custom business logic
```

---

## Development Guide

### Adding New Features

#### Creating a New Component

```bash
ng generate component my-new-component
```

Files created:
- `my-new-component.ts` - Component class
- `my-new-component.html` - Template
- `my-new-component.css` - Styles
- `my-new-component.spec.ts` - Tests

#### Creating a New Service

```bash
ng generate service my-new-service
```

#### Project Dependencies Overview

**Angular Core Packages (^20.3.0):**
- `@angular/core` - Core functionality
- `@angular/common` - Common directives and pipes
- `@angular/forms` - Form handling
- `@angular/router` - Routing
- `@angular/platform-browser` - Browser platform
- `@angular/platform-server` - Server platform

**Build & Compilation:**
- `@angular/build` - Build tooling
- `@angular/cli` - Command-line interface
- `@angular/compiler` - Template compilation
- `esbuild` - Fast bundler

**Testing Frameworks:**
- `jasmine-core` - Testing framework
- `karma` - Test runner
- `@types/jasmine` - TypeScript definitions

### Code Style Guidelines

**TypeScript Conventions:**
```typescript
// Use PascalCase for classes and interfaces
export interface UserProfile { }
export class AuthService { }

// Use camelCase for variables and functions
const userName: string = 'john';
function getUserData(): void { }

// Use UPPER_SNAKE_CASE for constants
const MAX_RETRIES = 3;
const API_ENDPOINT = 'https://api.example.com';
```

**Component Structure:**
```typescript
@Component({
  selector: 'app-my-component',
  standalone: true,  // Standalone components
  imports: [CommonModule, FormsModule],
  templateUrl: './my-component.html',
  styleUrls: ['./my-component.css']
})
export class MyComponent implements OnInit {
  // Properties
  title: string = '';
  
  // Constructor
  constructor(private service: MyService) {}
  
  // Lifecycle hooks
  ngOnInit(): void {}
  
  // Public methods
  public doSomething(): void {}
  
  // Private methods
  private helperFunction(): void {}
}
```

### Testing Guidelines

**Unit Test Structure:**
```typescript
describe('MyComponent', () => {
  let component: MyComponent;
  let fixture: ComponentFixture<MyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

### Performance Optimization Tips

1. **Change Detection:**
   - Use OnPush change detection strategy
   - Minimize change detection runs

2. **Lazy Loading:**
   - Implement lazy loading for routes
   - Load feature modules on demand

3. **Bundle Size:**
   - Monitor with `ng build --stats-json`
   - Use tree-shaking for unused code
   - Minimize CSS and remove unused Bootstrap

4. **Caching:**
   - Implement HTTP response caching
   - Use localStorage for user preferences
   - Cache event data appropriately

---

### Summary of Key Commands

| Command | Purpose |
|---------|---------|
| `npm install` | Install all dependencies |
| `npm start` | Start development server |
| `npm run build` | Build for production |
| `npm test` | Run unit tests |
| `npm run watch` | Watch mode build |
| `npm run serve:ssr:ticket` | Run SSR server |

---

## Support & Troubleshooting

### Common Issues

**Application won't start:**
1. Check if port 4200 is available
2. Run `npm install` again
3. Clear Angular cache: `rm -rf .angular/cache`

**Build fails with TypeScript errors:**
1. Verify TypeScript version: `npm list typescript`
2. Run `npm run build` with verbose flag
3. Check for circular dependencies

**Mock data not loading:**
1. Verify `environment.useMocks` is `true`
2. Check console for errors
3. Ensure mock files exist in `src/app/mock/`

### Getting Help

- Check existing documentation and comments in code
- Review git commit history for context
- Test features in development mode first
- Use browser DevTools for debugging

---

**Last Updated:** November 28, 2025
**Project Version:** 1.0.0
**Angular Version:** 20.3.0
**Node.js Minimum:** 20.x LTS
