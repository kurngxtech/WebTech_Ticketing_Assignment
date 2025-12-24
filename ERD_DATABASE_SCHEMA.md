# Entity Relationship Diagram (ERD) & Database Schema

## Table of Contents
1. [Visual ERD Diagram](#visual-erd-diagram)
2. [Detailed Schema Definitions](#detailed-schema-definitions)
3. [Relationships Explained](#relationships-explained)
4. [Data Flow Examples](#data-flow-examples)
5. [Database Indexes](#database-indexes)

---

## Visual ERD Diagram

### High-Level Architecture

```
                                    ┌─────────────────┐
                                    │     USERS       │
                                    │                 │
                                    │ ★ id (PK)       │
                                    │ • username      │
                                    │ • email (UQ)    │
                                    │ • password      │
                                    │ • role          │
                                    │ • fullName      │
                                    │ • phone         │
                                    │ • organizationName (EO only)
                                    │ • createdAt     │
                                    └────────┬────────┘
                                             │
                     ┌───────────────────────┼───────────────────────┐
                     │                       │                       │
                     │ (creates)             │ (creates)             │ (registers)
                     │                       │                       │
        ┌────────────▼─────────────┐   ┌────▼──────────────────┐   ┌────▼──────────────┐
        │       EVENTS            │   │    BOOKINGS           │   │  WAITLIST         │
        │                         │   │                       │   │                   │
        │ ★ id (PK)              │   │ ★ id (PK)            │   │ ★ id (PK)        │
        │ • title                 │   │ • eventId (FK) ────┐  │   │ • eventId (FK) ──┐
        │ • description           │   │ • userId (FK) ─┐   │  │   │ • userId (FK) ──┐
        │ • date                  │   │ • ticketCategoryId  │  │   │ • ticketCategoryId
        │ • time                  │   │ • quantity      │   │  │   │ • quantity       │
        │ • location              │   │ • pricePerTicket    │  │   │ • registeredAt   │
        │ • price (min)           │   │ • totalPrice    │   │  │   │ • notified       │
        │ • organizerId (FK) ──┐  │   │ • discountApplied   │  │   └───────┬──────────┘
        │ • status              │  │   │ • status        │   │  │           │
        │ • createdAt           │  │   │ • bookingDate   │   │  │           │
        │ • updatedAt           │  │   │ • qrCode        │   │  │   (next in queue when
        │ └──────┐              │  │   │ • checkedIn     │   │  │    slot available)
        │        │              │  │   │ • checkedInAt   │   │  │
        └────────┼──────────────┘  │   └───────┬─────────┘   │
                 │                 │           │            │
                 │                 └─────┬─────┘            │
                 │                       │                  │
        (has 1..many)         (references)        (references)
                 │                       │                  │
                 │                       └──────────┬───────┘
                 │                                  │
        ┌────────▼──────────────┐        ┌──────────▼────────┐
        │  TICKET_CATEGORIES   │        │  PROMOTIONAL_CODES │
        │                      │        │                    │
        │ ★ id (PK)           │        │ ★ id (PK)         │
        │ • eventId (FK) ────┐ │        │ • code (UQ)       │
        │ • type             │ │        │ • discountPercentage
        │ • price            │ │        │ • expiryDate      │
        │ • total            │ │        │ • maxUsage        │
        │ • sold             │ │        │ • usedCount       │
        │ • section          │ │        │ • eventId (FK) ──┐
        │ └───────┬──────────┘ │        │ • applicableTicketTypes
        │         │            │        └──────────────────┘
        │         │            │
        │         └────────┬───┘
        │                  │
        │      (belongs to event)
        │                  │
        └──────────────────┘

┌────────────────────────┐
│ SEATING_SECTIONS       │
│                        │
│ ★ id (PK)             │
│ • eventId (FK)        │
│ • name                │
│ • rows                │
│ • seatsPerRow         │
│ • availableSeats[]    │
└────────────────────────┘

        ↓
┌──────────────────┐
│ SEATS (Nested)   │
│                  │
│ • id             │
│ • row            │
│ • column         │
│ • isOccupied     │
│ • bookingId      │
└──────────────────┘

┌────────────────────────┐
│ ANALYTICS              │
│ (Denormalized)        │
│                        │
│ ★ id (PK)             │
│ • eventId (FK)        │
│ • totalRevenue        │
│ • totalTicketsSold    │
│ • occupancyRate       │
│ • byTicketType{}      │
│ • bookingsByDate{}    │
│ • generatedAt         │
└────────────────────────┘
```

---

## Detailed Schema Definitions

### 1. USERS Table

**Purpose:** Store all user accounts (Admin, Event Organizers, Regular Users)

```sql
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,  -- Hashed in production
    role ENUM('admin', 'eo', 'user') NOT NULL DEFAULT 'user',
    fullName VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    organizationName VARCHAR(100),  -- NULL for non-EO users
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    lastLoginAt TIMESTAMP,
    isActive BOOLEAN DEFAULT TRUE,
    
    INDEX idx_role (role),
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_createdAt (createdAt)
);
```

**TypeScript Interface:**
```typescript
export interface User {
    id: string;                    // Unique user ID
    username: string;              // Login username (unique)
    email: string;                 // Email address (unique)
    password: string;              // Hashed password (production)
    role: 'admin' | 'eo' | 'user'; // User role
    fullName: string;              // Display name
    phone?: string;                // Phone number
    organizationName?: string;     // EO organization name
    createdAt: string;             // Account creation date (ISO)
    updatedAt?: string;            // Last update date
}
```

**Sample Data:**
```json
{
    "id": "admin1",
    "username": "admin",
    "email": "admin@auditorium.com",
    "password": "$2b$10$...",  // Bcrypt hash
    "role": "admin",
    "fullName": "Admin User",
    "phone": "08100000000",
    "createdAt": "2025-01-01T10:00:00Z"
}

{
    "id": "eo1",
    "username": "jane_eo",
    "email": "jane@events.com",
    "password": "$2b$10$...",
    "role": "eo",
    "fullName": "Jane Event Organizer",
    "phone": "08198765432",
    "organizationName": "Creative Events Inc",
    "createdAt": "2025-01-05T14:30:00Z"
}

{
    "id": "user1",
    "username": "john_user",
    "email": "john@example.com",
    "password": "$2b$10$...",
    "role": "user",
    "fullName": "John Attendee",
    "phone": "08123456789",
    "createdAt": "2025-01-10T09:15:00Z"
}
```

---

### 2. EVENTS Table

**Purpose:** Store all events created by Event Organizers

```sql
CREATE TABLE events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL,
    time VARCHAR(20) NOT NULL,  -- e.g., "19:00 - 22:00"
    location VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2),       -- Minimum ticket price
    organizerId VARCHAR(36) NOT NULL,
    imageUrl VARCHAR(500),
    status ENUM('draft', 'active', 'completed', 'cancelled') DEFAULT 'draft',
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (organizerId) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_organizerId (organizerId),
    INDEX idx_date (date),
    INDEX idx_status (status),
    INDEX idx_createdAt (createdAt),
    FULLTEXT INDEX idx_title_description (title, description)
);
```

**TypeScript Interface:**
```typescript
export interface EventItem {
    id: number;                                    // Unique event ID
    title: string;                                 // Event name
    description: string;                           // Event details
    date: string;                                  // Event date (ISO)
    time: string;                                  // Time range (e.g., "19:00 - 22:00")
    location: string;                              // Venue name/address
    price?: number;                                // Starting/minimum price
    organizer: string;                             // EO display name
    organizerId: string;                           // EO user ID (FK)
    img?: string;                                  // Image URL
    tickets: TicketCategory[];                     // Ticket types (1..many)
    seatingLayout?: SeatSection[];                 // Optional seating
    promotionalCodes?: PromotionalCode[];          // Associated promos
    status: 'draft' | 'active' | 'completed' | 'cancelled';
    createdAt: string;                             // Creation timestamp
    updatedAt: string;                             // Update timestamp
}
```

**Sample Data:**
```json
{
    "id": 0,
    "title": "Violin Concert",
    "description": "100+ Violins Live in Concert",
    "date": "2025-12-10",
    "time": "16:00 - 23:00",
    "location": "Gelora Bung Karno",
    "price": 350,
    "organizer": "Sounderful Org",
    "organizerId": "eo1",
    "imageUrl": "/login-image/orchestra-dark.jpeg",
    "status": "active",
    "createdAt": "2025-01-05T14:30:00Z",
    "updatedAt": "2025-01-05T14:30:00Z"
}
```

---

### 3. TICKET_CATEGORIES Table

**Purpose:** Define different ticket types and pricing for each event

```sql
CREATE TABLE ticket_categories (
    id VARCHAR(36) PRIMARY KEY,
    eventId INT NOT NULL,
    type VARCHAR(50) NOT NULL,           -- e.g., "VIP", "Regular", "Student"
    price DECIMAL(10, 2) NOT NULL,       -- Price in IDR/USD
    totalSeats INT NOT NULL,              -- Total capacity
    soldSeats INT DEFAULT 0,              -- Currently sold
    section VARCHAR(50),                 -- Seating section
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE,
    UNIQUE KEY unique_event_type (eventId, type),
    INDEX idx_eventId (eventId),
    INDEX idx_section (section)
);
```

**TypeScript Interface:**
```typescript
export interface TicketCategory {
    id: string;              // Unique ticket ID
    type: string;            // e.g., "VIP", "Regular"
    price: number;           // Price in currency
    total: number;           // Total seats available
    sold: number;            // Currently sold
    section?: string;        // Auditorium section (e.g., "A", "VIP")
}
```

**Sample Data:**
```json
{
    "id": "vip",
    "eventId": 0,
    "type": "VIP",
    "price": 500,
    "totalSeats": 50,
    "soldSeats": 5,
    "section": "VIP"
}

{
    "id": "reg",
    "eventId": 0,
    "type": "Regular",
    "price": 350,
    "totalSeats": 500,
    "soldSeats": 120,
    "section": "GENERAL"
}
```

---

### 4. BOOKINGS Table

**Purpose:** Record all ticket purchases and orders

```sql
CREATE TABLE bookings (
    id VARCHAR(36) PRIMARY KEY,
    eventId INT NOT NULL,
    userId VARCHAR(36) NOT NULL,
    ticketCategoryId VARCHAR(36) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    pricePerTicket DECIMAL(10, 2) NOT NULL,
    totalPrice DECIMAL(10, 2) NOT NULL,
    discountApplied DECIMAL(5, 2) DEFAULT 0,  -- Discount percentage
    status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
    bookingDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    qrCode LONGTEXT,                          -- QR code data (base64)
    checkedIn BOOLEAN DEFAULT FALSE,
    checkedInAt TIMESTAMP NULL,
    paymentMethod VARCHAR(50),                -- e.g., "credit_card", "transfer"
    
    FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (ticketCategoryId) REFERENCES ticket_categories(id),
    INDEX idx_userId (userId),
    INDEX idx_eventId (eventId),
    INDEX idx_status (status),
    INDEX idx_bookingDate (bookingDate),
    INDEX idx_checkedIn (checkedIn)
);
```

**TypeScript Interface:**
```typescript
export interface Booking {
    id: string;                         // Unique booking ID
    eventId: number;                    // Event reference (FK)
    userId: string;                     // User reference (FK)
    ticketCategoryId: string;           // Ticket type (FK)
    quantity: number;                   // Number of tickets
    pricePerTicket: number;             // Individual price
    totalPrice: number;                 // Final price (with discounts)
    discountApplied: number;            // Discount percentage applied
    status: 'pending' | 'confirmed' | 'cancelled';
    bookingDate: string;                // Order timestamp (ISO)
    qrCode?: string;                    // QR code for check-in
    checkedIn?: boolean;                // Check-in status
    checkedInAt?: string;               // Check-in timestamp
}
```

**Sample Data:**
```json
{
    "id": "booking_001",
    "eventId": 0,
    "userId": "user1",
    "ticketCategoryId": "vip",
    "quantity": 2,
    "pricePerTicket": 500,
    "totalPrice": 950,  // 500 × 2 - 50 discount
    "discountApplied": 5,
    "status": "confirmed",
    "bookingDate": "2025-01-15T10:30:00Z",
    "qrCode": "data:image/png;base64,...",
    "checkedIn": false
}
```

---

### 5. WAITLIST Table

**Purpose:** Manage queue for sold-out tickets

```sql
CREATE TABLE waitlist (
    id VARCHAR(36) PRIMARY KEY,
    eventId INT NOT NULL,
    userId VARCHAR(36) NOT NULL,
    ticketCategoryId VARCHAR(36) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    registeredAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notified BOOLEAN DEFAULT FALSE,
    notifiedAt TIMESTAMP NULL,
    conversionId VARCHAR(36),  -- References booking if converted
    
    FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (ticketCategoryId) REFERENCES ticket_categories(id),
    UNIQUE KEY unique_waitlist (eventId, userId, ticketCategoryId),
    INDEX idx_eventId (eventId),
    INDEX idx_userId (userId),
    INDEX idx_notified (notified)
);
```

**TypeScript Interface:**
```typescript
export interface WaitlistEntry {
    id: string;                 // Unique waitlist entry ID
    eventId: number;            // Event reference (FK)
    userId: string;             // User reference (FK)
    ticketCategoryId: string;   // Ticket type (FK)
    quantity: number;           // Requested quantity
    registeredAt: string;       // Registration timestamp (ISO)
    notified: boolean;          // Notification sent status
}
```

**Sample Data:**
```json
{
    "id": "waitlist_001",
    "eventId": 0,
    "userId": "user1",
    "ticketCategoryId": "reg",
    "quantity": 3,
    "registeredAt": "2025-01-20T14:15:00Z",
    "notified": false
}
```

---

### 6. TICKET_CATEGORIES (Nested Seating) Table

**Purpose:** Define seating sections within events

```sql
CREATE TABLE seating_sections (
    id VARCHAR(36) PRIMARY KEY,
    eventId INT NOT NULL,
    sectionName VARCHAR(50) NOT NULL,   -- e.g., "VIP", "A", "B"
    rows INT NOT NULL,
    seatsPerRow INT NOT NULL,
    totalSeats INT NOT NULL,
    availableSeats INT NOT NULL,
    
    FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE,
    UNIQUE KEY unique_section (eventId, sectionName),
    INDEX idx_eventId (eventId)
);

-- Nested seats table
CREATE TABLE seats (
    id VARCHAR(36) PRIMARY KEY,
    sectionId VARCHAR(36) NOT NULL,
    rowNumber VARCHAR(5) NOT NULL,
    seatNumber INT NOT NULL,
    isOccupied BOOLEAN DEFAULT FALSE,
    bookingId VARCHAR(36),
    
    FOREIGN KEY (sectionId) REFERENCES seating_sections(id) ON DELETE CASCADE,
    FOREIGN KEY (bookingId) REFERENCES bookings(id),
    UNIQUE KEY unique_seat (sectionId, rowNumber, seatNumber),
    INDEX idx_isOccupied (isOccupied)
);
```

**TypeScript Interface:**
```typescript
export interface SeatSection {
    id: string;                         // Unique section ID
    name: string;                       // Section name
    rows: number;                       // Number of rows
    seatsPerRow: number;                // Seats per row
    availableSeats: Seat[];             // Array of seats
}

export interface Seat {
    id: string;                         // Unique seat ID
    row: string;                        // Row letter (e.g., "A", "B")
    column: number;                     // Seat number in row
    section: string;                    // Section reference
    isOccupied: boolean;                // Occupancy status
    bookingId?: string;                 // Booking reference if occupied
}
```

---

### 7. PROMOTIONAL_CODES Table

**Purpose:** Manage discount codes for tickets

```sql
CREATE TABLE promotional_codes (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    discountPercentage DECIMAL(5, 2) NOT NULL,
    expiryDate DATE NOT NULL,
    maxUsage INT NOT NULL DEFAULT 100,
    usedCount INT DEFAULT 0,
    eventId INT,                    -- NULL = all events, specific = this event only
    applicableTicketTypes JSON,      -- Array of ticket type IDs
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    createdBy VARCHAR(36),
    
    FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (createdBy) REFERENCES users(id),
    UNIQUE KEY unique_code (code),
    INDEX idx_eventId (eventId),
    INDEX idx_expiryDate (expiryDate),
    INDEX idx_code (code)
);
```

**TypeScript Interface:**
```typescript
export interface PromotionalCode {
    code: string;                        // Coupon code (e.g., "SAVE20")
    discountPercentage: number;          // Discount percentage (0-100)
    expiryDate: string;                  // Expiration date (ISO)
    applicableTicketTypes?: string[];    // Applicable ticket IDs (empty = all)
    maxUsage: number;                    // Maximum usage count
    usedCount: number;                   // Current usage count
}
```

**Sample Data:**
```json
{
    "id": "promo_001",
    "code": "SAVE20",
    "discountPercentage": 20,
    "expiryDate": "2025-12-31",
    "maxUsage": 100,
    "usedCount": 25,
    "eventId": 0,
    "applicableTicketTypes": ["vip", "reg"]
}
```

---

### 8. ANALYTICS Table (Denormalized)

**Purpose:** Pre-calculated analytics for reports and dashboards

```sql
CREATE TABLE analytics (
    id VARCHAR(36) PRIMARY KEY,
    eventId INT NOT NULL UNIQUE,
    totalRevenue DECIMAL(15, 2) DEFAULT 0,
    totalTicketsSold INT DEFAULT 0,
    totalSeatsOccupied INT DEFAULT 0,
    occupancyRate DECIMAL(5, 2) DEFAULT 0,  -- Percentage
    byTicketType JSON,                       -- {ticketId: {sold, revenue}}
    bookingsByDate JSON,                     -- {date: {count, revenue}}
    generatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE,
    INDEX idx_eventId (eventId),
    INDEX idx_updatedAt (updatedAt)
);
```

**TypeScript Interface:**
```typescript
export interface EventAnalytics {
    eventId: number;                        // Event reference (FK)
    totalRevenue: number;                   // Total revenue in IDR
    totalTicketsSold: number;               // Total tickets sold
    totalSeatsOccupied: number;             // Total seats occupied
    occupancyRate: number;                  // Percentage (0-100)
    byTicketType: {                         // Revenue per ticket type
        [ticketId: string]: {
            sold: number;
            revenue: number;
        };
    };
    bookingsByDate: {                       // Bookings by date
        [date: string]: {
            count: number;
            revenue: number;
        };
    };
}
```

---

## Relationships Explained

### 1. User → Events (One-to-Many)
```
One User (Event Organizer) can create Many Events
────────────────────────────────────────────────

users (admin/eo)
    │
    └─ 1:N ──→ events
       organizerId
       
Example:
├─ Jane (eo1) creates:
│  ├─ Event #1: Violin Concert
│  ├─ Event #2: Orchestra Night
│  └─ Event #3: Music Festival
│
└─ Bob (eo2) creates:
   ├─ Event #4: Theater Show
   └─ Event #5: Drama Festival
```

### 2. Event → Ticket Categories (One-to-Many)
```
One Event has Many Ticket Categories
──────────────────────────────────────

events
    │
    └─ 1:N ──→ ticket_categories
       eventId

Example:
Event: Violin Concert
├─ VIP Ticket (id: vip)
│  ├─ Price: 500
│  ├─ Total: 50
│  └─ Sold: 5
│
├─ Regular Ticket (id: reg)
│  ├─ Price: 350
│  ├─ Total: 500
│  └─ Sold: 120
│
└─ Student Ticket (id: student)
   ├─ Price: 250
   ├─ Total: 100
   └─ Sold: 30
```

### 3. User → Bookings (One-to-Many)
```
One User can make Many Bookings
────────────────────────────────

users
    │
    └─ 1:N ──→ bookings
       userId

Example:
User: John Attendee (user1)
├─ Booking #1: 2 VIP tickets for Violin Concert
├─ Booking #2: 1 Regular ticket for Orchestra Night
└─ Booking #3: 3 Regular tickets for Music Festival
```

### 4. Event → Bookings (One-to-Many)
```
One Event has Many Bookings
─────────────────────────────

events
    │
    └─ 1:N ──→ bookings
       eventId

Example:
Event: Violin Concert (id: 0)
├─ Booking #1: John × 2 VIP tickets
├─ Booking #2: Jane × 4 Regular tickets
├─ Booking #3: Bob × 1 VIP ticket
└─ Booking #4: Alice × 3 Regular tickets
```

### 5. Ticket Category → Bookings (One-to-Many)
```
One Ticket Type has Many Bookings
──────────────────────────────────

ticket_categories
    │
    └─ 1:N ──→ bookings
       ticketCategoryId

Example:
Ticket: VIP (for Violin Concert)
├─ Booking #1: John × 2
├─ Booking #2: Bob × 1
└─ Booking #3: Maria × 2
```

### 6. User → Waitlist (One-to-Many)
```
One User can have Many Waitlist Entries
──────────────────────────────────────────

users
    │
    └─ 1:N ──→ waitlist
       userId

Example:
User: John Attendee (user1)
├─ Waitlist #1: Violin Concert - VIP (qty: 2)
├─ Waitlist #2: Orchestra Night - Regular (qty: 1)
└─ Waitlist #3: Music Festival - Regular (qty: 3)
```

### 7. Event → Waitlist (One-to-Many)
```
One Event can have Many Waitlist Entries
──────────────────────────────────────────

events
    │
    └─ 1:N ──→ waitlist
       eventId

Example:
Event: Violin Concert (sold out)
├─ Waitlist #1: John (qty: 2, position: 1)
├─ Waitlist #2: Maria (qty: 1, position: 2)
└─ Waitlist #3: Peter (qty: 3, position: 3)
```

### 8. Event → Promotional Codes (One-to-Many)
```
One Event can have Many Promotional Codes
───────────────────────────────────────────

events
    │
    └─ 1:N ──→ promotional_codes
       eventId (nullable - NULL means all events)

Example:
Event: Violin Concert
├─ Promo: SAVE20 (20% off)
├─ Promo: STUDENT10 (10% off for students)
└─ Promo: EARLYBIRD15 (15% off for early birds)
```

### 9. Event → Analytics (One-to-One)
```
One Event has One Analytics Record
──────────────────────────────────

events
    │
    └─ 1:1 ──→ analytics
       eventId (unique)

Example:
Event: Violin Concert (id: 0)
    ↓
Analytics Record:
├─ Total Revenue: Rp 180,000,000
├─ Total Tickets Sold: 200
├─ Occupancy Rate: 85%
└─ By Ticket Type: {vip: {sold: 50, revenue: 25M}, reg: {sold: 150, revenue: 52.5M}}
```

### 10. Event → Seating Sections (One-to-Many)
```
One Event can have Many Seating Sections
─────────────────────────────────────────

events
    │
    └─ 1:N ──→ seating_sections
       eventId

    seating_sections
    │
    └─ 1:N ──→ seats
       sectionId

Example:
Event: Violin Concert
├─ Section: VIP
│  ├─ Seat A1, A2, A3... (occupied)
│  ├─ Seat B1, B2, B3... (available)
│  └─ Seat C1, C2, C3... (occupied)
│
├─ Section: Premium
│  └─ Seats D1-D50, E1-E50
│
└─ Section: General
   └─ Seats F1-F100, G1-G100
```

---

## Data Flow Examples

### Example 1: User Creates Account and Buys Ticket

```
STEP 1: Registration
┌──────────────────────────────┐
│ User fills registration form │
└──────────────────────────────┘
                ↓
        ┌───────────────┐
        │  users        │
        │  INSERT       │
        │  john_user    │
        └───────────────┘


STEP 2: Browse Events
┌──────────────────────────────┐
│ User sees available events   │
└──────────────────────────────┘
                ↓
        ┌───────────────┐
        │  events       │
        │  SELECT       │
        │  status=active│
        └───────────────┘


STEP 3: View Event Details
┌──────────────────────────────────┐
│ User clicks on Violin Concert    │
└──────────────────────────────────┘
                ↓
        ┌─────────────────────────┐
        │  events + bookings      │
        │  LEFT JOIN              │
        │  events.id = 0          │
        └─────────────────────────┘
                ↓
        ┌──────────────────────────┐
        │  ticket_categories       │
        │  WHERE eventId = 0       │
        │  ├─ VIP: 50 total, 5 sold │
        │  ├─ Reg: 500 total, 120 sold
        │  └─ Student: 100 total, 30 sold
        └──────────────────────────┘


STEP 4: Select Ticket & Quantity
┌────────────────────────────────────┐
│ User selects: 2 × VIP @ 500 = 1000 │
└────────────────────────────────────┘


STEP 5: Apply Promo Code
┌──────────────────────────┐
│ User enters: SAVE20      │
└──────────────────────────┘
                ↓
        ┌────────────────────────────┐
        │  promotional_codes         │
        │  WHERE code = 'SAVE20'     │
        │  AND expiryDate >= TODAY   │
        │                            │
        │  Result: 20% discount      │
        │  Final Price: 1000 - 200 = 800
        └────────────────────────────┘


STEP 6: Process Payment
┌──────────────────────────┐
│ User selects: Credit Card│
│ Price: Rp 800,000       │
└──────────────────────────┘


STEP 7: Create Booking
┌──────────────────────────────────┐
│  bookings                        │
│  INSERT                          │
│  ├─ id: booking_001              │
│  ├─ eventId: 0                   │
│  ├─ userId: user1                │
│  ├─ ticketCategoryId: vip        │
│  ├─ quantity: 2                  │
│  ├─ totalPrice: 800              │
│  ├─ status: confirmed            │
│  └─ qrCode: [generated]          │
└──────────────────────────────────┘
                ↓
        ┌────────────────────────┐
        │  ticket_categories     │
        │  UPDATE sold += 2      │
        │  WHERE id = 'vip'      │
        │                        │
        │  Before: sold = 5      │
        │  After: sold = 7       │
        └────────────────────────┘


STEP 8: Update Analytics
┌──────────────────────────────────┐
│  analytics                       │
│  UPDATE eventId = 0              │
│  ├─ totalRevenue += 800          │
│  ├─ totalTicketsSold += 2        │
│  ├─ occupancyRate recalculate    │
│  └─ bookingsByDate['2025-01-15'] │
│     += {count: 1, revenue: 800}  │
└──────────────────────────────────┘


STEP 9: Generate Ticket
┌──────────────────────────────┐
│ Generate QR Code             │
│ Generate PDF Ticket          │
│ Send Confirmation Email      │
└──────────────────────────────┘


RESULT: Booking Complete ✅
┌───────────────────────────────────────────┐
│ Booking Confirmation                      │
│ ─────────────────────────────────────────│
│ Event: Violin Concert                    │
│ Date: 2025-12-10                         │
│ Tickets: 2 × VIP                         │
│ Total: Rp 800,000                        │
│ QR Code: [QR_DATA]                       │
│ Reference: booking_001                   │
└───────────────────────────────────────────┘
```

---

### Example 2: Event Becomes Sold Out → Waitlist Processing

```
SCENARIO: Regular Tickets become sold out

STEP 1: Last Regular Ticket Sold
┌────────────────────────────────┐
│  ticket_categories             │
│  WHERE eventId = 0 AND id='reg'│
│                                │
│  Before: sold = 119            │
│  After: sold = 120 (SOLD OUT)  │
└────────────────────────────────┘


STEP 2: User Attempts to Buy Regular Ticket
┌──────────────────────────────────┐
│ Check availability:              │
│ total - sold = 500 - 120 = 0     │
│                                  │
│ Result: SOLD OUT ❌              │
└──────────────────────────────────┘


STEP 3: User Joins Waitlist
┌──────────────────────────────────┐
│  waitlist                        │
│  INSERT                          │
│  ├─ id: waitlist_001             │
│  ├─ eventId: 0                   │
│  ├─ userId: user2                │
│  ├─ ticketCategoryId: reg        │
│  ├─ quantity: 3                  │
│  ├─ registeredAt: [NOW]          │
│  └─ notified: false              │
└──────────────────────────────────┘


STEP 4: Cancellation Occurs
Scenario: User cancels booking for 3 Regular tickets
┌──────────────────────────────────┐
│  bookings                        │
│  UPDATE status = 'cancelled'     │
│  WHERE id = 'booking_xyz'        │
└──────────────────────────────────┘
            ↓
┌──────────────────────────────────┐
│  ticket_categories               │
│  UPDATE sold -= 3                │
│  WHERE id = 'reg'                │
│                                  │
│  Before: sold = 120 (SOLD OUT)  │
│  After: sold = 117 (3 available) │
└──────────────────────────────────┘


STEP 5: Process Waitlist
┌──────────────────────────────────┐
│ Check: Are there waitlisted?     │
│ SELECT FROM waitlist             │
│ WHERE eventId = 0                │
│ AND ticketCategoryId = 'reg'     │
│ ORDER BY registeredAt ASC        │
│                                  │
│ Result: user2 (qty: 3) ← First   │
└──────────────────────────────────┘


STEP 6: Auto-Create Booking for Waitlisted User
┌──────────────────────────────────┐
│ Check: Available = 3 tickets     │
│ Requested = 3 tickets            │
│                                  │
│ ✅ Quantity matches!             │
└──────────────────────────────────┘
            ↓
┌──────────────────────────────────┐
│  bookings                        │
│  INSERT (auto-created)           │
│  ├─ userId: user2                │
│  ├─ quantity: 3                  │
│  ├─ status: pending (awaiting payment)
│  └─ conversionId: waitlist_001   │
└──────────────────────────────────┘


STEP 7: Notify Waitlisted User
┌──────────────────────────────────┐
│ Send notification email:         │
│ "Great news! Your tickets are    │
│  now available. Complete your    │
│  payment within 24 hours."       │
│                                  │
│ Update waitlist record:          │
│ notified = true                  │
│ notifiedAt = [NOW]               │
└──────────────────────────────────┘


STEP 8: User Completes Payment
User pays → Booking status changes to 'confirmed'
→ Ticket availability updated
→ Analytics updated
→ Confirmation email sent


RESULT: Waitlist Conversion Complete ✅
```

---

## Database Indexes

### Performance-Critical Indexes

```sql
-- Authentication & User Lookup
CREATE INDEX idx_users_email ON users(email);           -- Login lookups
CREATE INDEX idx_users_username ON users(username);     -- Login lookups
CREATE INDEX idx_users_role ON users(role);             -- Role-based filtering

-- Event Discovery
CREATE INDEX idx_events_status ON events(status);       -- Show active events
CREATE INDEX idx_events_date ON events(date);           -- Sort by date
CREATE INDEX idx_events_organizerId ON events(organizerId);  -- EO's events
CREATE FULLTEXT INDEX idx_events_search ON events(title, description);

-- Booking Lookups
CREATE INDEX idx_bookings_userId ON bookings(userId);   -- User's bookings
CREATE INDEX idx_bookings_eventId ON bookings(eventId); -- Event bookings
CREATE INDEX idx_bookings_status ON bookings(status);   -- Filter by status
CREATE INDEX idx_bookings_date ON bookings(bookingDate); -- Sort by date

-- Ticket Availability
CREATE INDEX idx_tickets_eventId ON ticket_categories(eventId);
CREATE INDEX idx_tickets_type ON ticket_categories(type);

-- Waitlist Management
CREATE INDEX idx_waitlist_eventId ON waitlist(eventId);
CREATE INDEX idx_waitlist_userId ON waitlist(userId);
CREATE INDEX idx_waitlist_notified ON waitlist(notified);

-- Analytics
CREATE INDEX idx_analytics_eventId ON analytics(eventId);
CREATE INDEX idx_analytics_updated ON analytics(updatedAt);

-- Seating
CREATE INDEX idx_seats_occupied ON seats(isOccupied);
CREATE INDEX idx_seats_bookingId ON seats(bookingId);
```

### Query Optimization Examples

```sql
-- Slow: O(n) - Full table scan
SELECT * FROM bookings WHERE userId = 'user1';

-- Fast: O(log n) - Index used
SELECT * FROM bookings WHERE userId = 'user1';  -- idx_bookings_userId


-- Slow: O(n²) - No join index
SELECT e.title, COUNT(b.id) as ticket_count
FROM events e
LEFT JOIN bookings b ON e.id = b.eventId
WHERE e.status = 'active';

-- Fast: O(log n + n log n) - Indexed joins
SELECT e.title, COUNT(b.id) as ticket_count
FROM events e
LEFT JOIN bookings b ON e.id = b.eventId
WHERE e.status = 'active'  -- Uses idx_events_status
GROUP BY e.id;
```

---

## Scalability Considerations

### Current Architecture Limitations

```
Current Setup (In-memory/Mock):
├─ DataEventService holds all data in RAM
├─ No persistence between browser reloads
├─ No multi-user sync (single browser instance)
├─ Memory scales with data size
└─ Maximum ~10,000 events before performance issues
```

### Production-Ready Architecture

```
Migration Path:

Phase 1: Add Database Layer (MySQL/PostgreSQL)
├─ Replace MOCK_EVENTS/MOCK_USERS with database queries
├─ Implement connection pooling
├─ Add transaction support for bookings
└─ Setup automated backups

Phase 2: API Layer (Node.js + Express)
├─ Create RESTful API endpoints
├─ Add authentication tokens (JWT)
├─ Implement rate limiting
├─ Add request validation

Phase 3: Caching Layer (Redis)
├─ Cache hot events (popular tickets)
├─ Cache user sessions
├─ Cache analytical reports
└─ TTL-based invalidation

Phase 4: Message Queue (RabbitMQ/Kafka)
├─ Async email notifications
├─ Event-driven waitlist processing
├─ Analytics aggregation
└─ Payment processing webhooks

Phase 5: Monitoring & Optimization
├─ Query performance monitoring
├─ Database indexing analysis
├─ Cache hit ratios
└─ Real-time dashboards
```

### Estimated Data Volume

```
Per Year (Assuming 10,000 events):
├─ Users: ~50,000 (0.5MB)
├─ Events: ~10,000 (5MB)
├─ Bookings: ~500,000 (50MB)
├─ Waitlist: ~50,000 (5MB)
├─ Analytics: ~10,000 (5MB)
└─ Total: ~65MB (easily fits in memory for testing)

Large Scale (1M events/year):
├─ Users: ~5,000,000 (25MB)
├─ Events: ~1,000,000 (500MB)
├─ Bookings: ~50,000,000 (5GB)
├─ Waitlist: ~5,000,000 (500MB)
├─ Analytics: ~1,000,000 (500MB)
└─ Total: ~6.5GB (requires database, caching)
```

---

## Summary: Key Relationships

| Relationship | Type | Purpose |
|---|---|---|
| User → Events | 1:N | EO creates multiple events |
| Event → Tickets | 1:N | Event has multiple ticket types |
| User → Bookings | 1:N | User makes multiple bookings |
| Event → Bookings | 1:N | Event receives many bookings |
| Ticket → Bookings | 1:N | Each ticket type has many bookings |
| User → Waitlist | 1:N | User can be on multiple waitlists |
| Event → Waitlist | 1:N | Event has multiple waitlist entries |
| Event → Promos | 1:N | Event has multiple discount codes |
| Event → Analytics | 1:1 | Event has one analytics record |
| Event → Seating | 1:N | Event has multiple seating sections |

---

**Database Version:** 1.0  
**Last Updated:** November 30, 2025  
**Compatible With:** Angular 20 + TypeScript  
**Deployment:** MySQL/PostgreSQL (production ready)
