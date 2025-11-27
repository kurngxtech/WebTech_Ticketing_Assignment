# EVENT MANAGEMENT SYSTEM - ENTITY RELATIONSHIP DIAGRAM (ERD)

## Visual ERD (ASCII Art)

```
╔════════════════════════════════════════════════════════════════════════════╗
║                    HELP EVENTS - DATABASE ARCHITECTURE                     ║
╚════════════════════════════════════════════════════════════════════════════╝


┌─────────────────────────────────────────────────────────────────────────┐
│  USERS (Authentication & Authorization)                                 │
├─────────────────────────────────────────────────────────────────────────┤
│ PK  id                    VARCHAR(36)                                    │
│     username              VARCHAR(50)  UNIQUE                           │
│     email                 VARCHAR(100) UNIQUE                           │
│     password              VARCHAR(255)                                  │
│     role                  ENUM('admin', 'eo', 'user')                   │
│     fullName              VARCHAR(100)                                  │
│     phone                 VARCHAR(20)                                   │
│     organizationName      VARCHAR(100)  [For EO only]                   │
│     createdAt             TIMESTAMP                                     │
│     updatedAt             TIMESTAMP                                     │
└─────────────────────────────────────────────────────────────────────────┘
                    │
        ┌───────────┼──────────┬──────────┐
        │           │          │          │
        │ 1:Many    │ 1:Many   │ 1:Many   │
        ▼           ▼          ▼          ▼


┌────────────────────────────┐  ┌──────────────────────────┐  ┌──────────────────────┐
│ EVENTS (Event Management)  │  │ BOOKINGS (Ticket Orders) │  │ WAITLIST (Queue Mgmt)│
├────────────────────────────┤  ├──────────────────────────┤  ├──────────────────────┤
│ PK  id         INT         │  │ PK  id      VARCHAR(36) │  │ PK  id  VARCHAR(36) │
│ FK  organizerId VARCHAR(36)│  │ FK  eventId      INT    │  │ FK  eventId      INT│
│     title      VARCHAR(200)│  │ FK  userId  VARCHAR(36) │  │ FK  userId VARCHAR36│
│     description TEXT       │  │ FK  ticketCategoryId   │  │ FK  ticketCategoryId│
│     date       DATE        │  │     quantity     INT    │  │     quantity     INT│
│     time       VARCHAR(20) │  │     pricePerTicket DEC │  │     registeredAt TS │
│     location   VARCHAR(200)│  │     totalPrice   DEC    │  │     notified   BOOL │
│     imageUrl   VARCHAR(500)│  │     discountApplied DEC │  │     position     INT│
│     status     ENUM        │  │     status       ENUM   │  └──────────────────────┘
│     createdAt  TIMESTAMP   │  │     bookingDate  TS     │
│     updatedAt  TIMESTAMP   │  │     qrCode       VARCHAR│
│                            │  │     checkedIn    BOOL   │
│                            │  │     checkedInAt  TS     │
│                            │  │     paymentMethod VARCHAR│
└────────────────────────────┘  └──────────────────────────┘


        EVENTS (1)
        │
        ├─────────────────┬──────────────────┐
        │ 1:Many          │ 1:Many           │
        ▼                 ▼                  ▼

┌────────────────────────┐  ┌───────────────────────┐  ┌──────────────────────────┐
│ TICKET_CATEGORIES      │  │ SEATING_SECTIONS      │  │ PROMOTIONAL_CODES        │
│ (Ticket Types)         │  │ (Auditorium Layout)   │  │ (Discount Coupons)       │
├────────────────────────┤  ├───────────────────────┤  ├──────────────────────────┤
│ PK  id   VARCHAR(36)   │  │ PK  id  VARCHAR(36)   │  │ PK  id      VARCHAR(36) │
│ FK  eventId      INT   │  │ FK  eventId      INT  │  │ FK  eventId (Optional)  │
│     type VARCHAR(50)   │  │     sectionName VCHAR │  │     code    VARCHAR(50) │
│     price        DEC   │  │     totalRows     INT │  │     discountPercent DEC │
│     totalSeats   INT   │  │     seatsPerRow   INT │  │     expiryDate     DATE │
│     soldSeats    INT   │  │     totalSeats   INT  │  │     applicableTickTypes │
│     section   VARCHAR  │  │     occupiedSeats INT │  │     maxUsage       INT  │
│     createdAt  TIMESTAMP   └───────────────────────┘  │     usedCount      INT  │
└────────────────────────┘                              │     isActive      BOOL  │
                                                        │     createdAt     TIMESTAMP
                                                        └──────────────────────────┘


                              BOOKINGS (FK eventId)
                                    │
                              1:Many│
                                    ▼
┌──────────────────────────────────────────────────────┐
│ ANALYTICS (Reports & Metrics)                       │
├──────────────────────────────────────────────────────┤
│ PK  id                      INT                      │
│ FK  eventId                 INT                      │
│     period                  DATE                     │
│     totalRevenue            DECIMAL(15,2)           │
│     ticketsSoldCount        INT                      │
│     occupancyRate           DECIMAL(5,2)            │
│     bookingsCount           INT                      │
│     averagePrice            DECIMAL(15,2)           │
│     createdAt               TIMESTAMP               │
│ UK  (eventId, period)                               │
└──────────────────────────────────────────────────────┘
```

---

## Relationships Explanation

### 1. USERS ↔ EVENTS (One-to-Many)
- One user (Admin/EO) → Many events
- Relationship: `events.organizerId = users.id`
- Cascade Delete: Delete user → Delete their events

### 2. EVENTS ↔ TICKET_CATEGORIES (One-to-Many)
- One event → Multiple ticket types (VIP, Regular, Early Bird)
- Relationship: `ticket_categories.eventId = events.id`
- Cascade Delete: Delete event → Delete ticket categories

### 3. EVENTS ↔ SEATING_SECTIONS (One-to-Many)
- One event → Multiple seating sections (VIP, PREMIUM, GENERAL)
- Relationship: `seating_sections.eventId = events.id`
- Cascade Delete: Delete event → Delete sections

### 4. EVENTS ↔ PROMOTIONAL_CODES (One-to-Many)
- One event → Multiple promo codes
- Relationship: `promotional_codes.eventId = events.id`
- Optional: Codes can be global (eventId = NULL)
- Cascade Delete: Delete event → Delete codes

### 5. EVENTS ↔ BOOKINGS (One-to-Many)
- One event → Many bookings
- Relationship: `bookings.eventId = events.id`
- Cascade Delete: Delete event → Delete bookings

### 6. USERS ↔ BOOKINGS (One-to-Many)
- One user → Many bookings
- Relationship: `bookings.userId = users.id`
- Cascade Delete: Delete user → Delete bookings

### 7. TICKET_CATEGORIES ↔ BOOKINGS (One-to-Many)
- One ticket type → Many bookings
- Relationship: `bookings.ticketCategoryId = ticket_categories.id`
- No cascade (keep booking records)

### 8. EVENTS ↔ WAITLIST (One-to-Many)
- One event → Multiple waitlist entries
- Relationship: `waitlist.eventId = events.id`
- Cascade Delete: Delete event → Delete waitlist entries

### 9. USERS ↔ WAITLIST (One-to-Many)
- One user → Multiple waitlist entries
- Relationship: `waitlist.userId = users.id`
- Cascade Delete: Delete user → Delete waitlist entries

### 10. EVENTS ↔ ANALYTICS (One-to-Many)
- One event → Many analytics records (per day/week/month)
- Relationship: `analytics.eventId = events.id`
- Unique: (eventId, period) prevents duplicates

---

## Data Integrity Rules

### Primary Keys (Unique Identifiers)
```
users.id                    → UUID (auto-generated)
events.id                   → Auto-increment INT
ticket_categories.id        → UUID (e.g., 'vip_event1')
bookings.id                 → UUID (auto-generated)
waitlist.id                 → UUID (auto-generated)
promotional_codes.id        → UUID (auto-generated)
seating_sections.id         → UUID (auto-generated)
analytics.id                → Auto-increment INT
```

### Foreign Keys (Referential Integrity)
```
✓ events.organizerId → users.id
✓ bookings.eventId → events.id
✓ bookings.userId → users.id
✓ bookings.ticketCategoryId → ticket_categories.id
✓ waitlist.eventId → events.id
✓ waitlist.userId → users.id
✓ waitlist.ticketCategoryId → ticket_categories.id
✓ ticket_categories.eventId → events.id
✓ seating_sections.eventId → events.id
✓ promotional_codes.eventId → events.id (optional)
✓ analytics.eventId → events.id
```

### Unique Constraints
```
✓ users.username (no duplicate usernames)
✓ users.email (no duplicate emails)
✓ promotional_codes.code (no duplicate code strings)
✓ ticket_categories.eventId + section (one section per event)
✓ seating_sections.eventId (one section per event)
✓ waitlist.eventId + userId + ticketCategoryId (prevent duplicate waitlist)
✓ analytics.eventId + period (one record per day/period)
```

### Enums
```
users.role:
  ├─ 'admin'      (System administrator)
  ├─ 'eo'         (Event organizer)
  └─ 'user'       (Regular attendee)

events.status:
  ├─ 'draft'      (Not published)
  ├─ 'active'     (Accepting bookings)
  ├─ 'completed'  (Event finished)
  └─ 'cancelled'  (Event cancelled)

bookings.status:
  ├─ 'pending'    (Awaiting payment)
  ├─ 'confirmed'  (Payment received)
  └─ 'cancelled'  (Booking cancelled)

bookings.paymentMethod:
  ├─ 'credit_card'   (Visa, Mastercard)
  ├─ 'debit'         (Debit card)
  ├─ 'e_wallet'      (GoPay, OVO, Dana)
  └─ 'bank_transfer' (Direct bank transfer)
```

---

## Sample Data Relationships

### Example 1: Event Booking Flow

```
USER (john_user)
  ↓
CREATES BOOKING → TICKET_CATEGORY (VIP, price: 500k, sold: 45/50)
  ↓
PAYMENT PROCESSED → BOOKING created with status 'confirmed'
  ↓
QR_CODE GENERATED → Can be used for CHECK_IN at event
  ↓
ON EVENT DAY → BOOKING.checkedIn = true, BOOKING.checkedInAt = timestamp


ANALYTICS:
  event.tickets['vip'].sold = 46 (from 45)
  analytics.totalRevenue += 400k (500k - 20% discount with SAVE20)
  analytics.ticketsSoldCount += 1
  analytics.occupancyRate = 46/50 = 92%
```

### Example 2: Waitlist to Booking

```
USER (jane_user) JOINS WAITLIST
  ↓
WAITLIST entry created: position = 5
  ↓
ANOTHER USER CANCELS BOOKING → tickets available
  ↓
SYSTEM CHECKS WAITLIST → finds position 1 user
  ↓
SEND EMAIL NOTIFICATION → "Your requested tickets are available!"
  ↓
USER HAS 24 HOURS TO COMPLETE BOOKING
  ↓
IF BOOKS: Remove from WAITLIST, notify next user (position 2)
IF DOESN'T BOOK: Notify next user (position 2)
  ↓
WAITLIST.position decrements for remaining users (5→4→3→2→1)
```

### Example 3: Event Creation & Reporting

```
EO (jane_eo) CREATES EVENT
  ↓
EVENT created: status = 'active'
  ├─ 3 TICKET_CATEGORIES: VIP (50 seats), Regular (500), Early Bird (50)
  ├─ 4 SEATING_SECTIONS: VIP, PREMIUM, GENERAL, PROMO
  └─ 3 PROMOTIONAL_CODES: SAVE20, HALFPRICE, DISC10
  ↓
USERS BOOK TICKETS → BOOKINGS created
  ↓
DAILY JOB RUNS → Creates ANALYTICS record
  ├─ Count total bookings (e.g., 150)
  ├─ Calculate total revenue (e.g., 45,000,000)
  ├─ Calculate occupancy (e.g., 230/600 = 38.3%)
  └─ Record in ANALYTICS.period = today
  ↓
EO VIEWS REPORTS → Sees metrics for their event
  ├─ Revenue: 45,000,000
  ├─ Tickets sold: VIP (45), Regular (150), Early Bird (35)
  ├─ Occupancy: 38.3%
  └─ Top performer: Regular tickets (150 sold)
```

---

## Query Examples

### Get Event with All Related Data
```sql
SELECT 
  e.*,
  COUNT(DISTINCT tc.id) as ticket_types,
  COUNT(DISTINCT b.id) as total_bookings,
  SUM(b.totalPrice) as total_revenue,
  COUNT(DISTINCT ss.id) as seating_sections
FROM events e
LEFT JOIN ticket_categories tc ON tc.eventId = e.id
LEFT JOIN bookings b ON b.eventId = e.id AND b.status = 'confirmed'
LEFT JOIN seating_sections ss ON ss.eventId = e.id
WHERE e.id = 1
GROUP BY e.id;
```

### Get Occupancy Rate
```sql
SELECT 
  e.title,
  e.date,
  COUNT(b.id) as tickets_sold,
  SUM(tc.total) as total_seats,
  (COUNT(b.id) / SUM(tc.total) * 100) as occupancy_rate
FROM events e
LEFT JOIN ticket_categories tc ON tc.eventId = e.id
LEFT JOIN bookings b ON b.eventId = e.id AND b.ticketCategoryId = tc.id AND b.status = 'confirmed'
WHERE e.organizerId = 'eo1'
GROUP BY e.id, e.title;
```

### Get Revenue by Ticket Type
```sql
SELECT 
  tc.type,
  COUNT(b.id) as tickets_sold,
  SUM(b.totalPrice) as revenue,
  AVG(b.totalPrice) as avg_price
FROM ticket_categories tc
LEFT JOIN bookings b ON b.ticketCategoryId = tc.id AND b.status = 'confirmed'
WHERE tc.eventId = 1
GROUP BY tc.id, tc.type;
```

### Get Waitlist Status
```sql
SELECT 
  u.fullName,
  u.email,
  tc.type,
  w.quantity,
  w.position,
  w.registeredAt
FROM waitlist w
JOIN users u ON u.id = w.userId
JOIN ticket_categories tc ON tc.id = w.ticketCategoryId
WHERE w.eventId = 1
ORDER BY w.position ASC;
```

---

## Indexes for Performance

```sql
-- User lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);

-- Event queries
CREATE INDEX idx_events_organizerId ON events(organizerId);
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_status ON events(status);

-- Booking queries
CREATE INDEX idx_bookings_eventId ON bookings(eventId);
CREATE INDEX idx_bookings_userId ON bookings(userId);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_bookingDate ON bookings(bookingDate);

-- Waitlist queries
CREATE INDEX idx_waitlist_eventId ON waitlist(eventId);
CREATE INDEX idx_waitlist_userId ON waitlist(userId);

-- Analytics queries
CREATE INDEX idx_analytics_eventId_period ON analytics(eventId, period);

-- Promo code lookups
CREATE INDEX idx_promo_code ON promotional_codes(code);
CREATE INDEX idx_promo_eventId ON promotional_codes(eventId);
```

---

## Scalability Considerations

### Current Design Supports:
- ✅ 1000s of events
- ✅ 10,000s of bookings per event
- ✅ Multiple concurrent users
- ✅ Complex analytics queries

### Future Scaling:
- Add read replicas for analytics queries
- Partition bookings table by event_id
- Cache frequently accessed data in Redis
- Archive old events to separate table
- Implement event log for audit trail

---

## Data Migration Path

### From Mock (Current) to Real DB:
1. Create PostgreSQL database with schema
2. Run migrations to create tables
3. Export mock data from Angular service
4. Insert mock data into PostgreSQL
5. Update AuthService to call API
6. Update DataEventService to call API
7. Verify all queries work
8. Test thoroughly

### From Development to Production:
1. Setup production database (encrypted, backed up)
2. Configure connection pooling
3. Setup automated backups (daily + hourly)
4. Configure replication (if multi-region)
5. Setup monitoring and alerts
6. Test disaster recovery

---

**Entity Relationship Diagram Version**: 1.0  
**Last Updated**: November 26, 2025  
**Status**: Ready for Implementation

