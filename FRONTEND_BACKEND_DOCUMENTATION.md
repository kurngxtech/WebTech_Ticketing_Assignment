# Frontend ↔ Backend Documentation (Summary)

Date: November 26, 2025

This file provides a concise bridge between the front-end demo implementation and a recommended backend API design. Use this when you decide to replace the front-end mocks with real server endpoints.

## Goals
- Describe minimal HTTP API surface the frontend expects.
- Provide example request/response contracts.
- Outline database entities (high-level ERD) and migration path.

## Environment flag
- `environment.useMocks` (boolean) — when `true`, frontend loads `src/app/mock/*` datasets; when `false`, the app is expected to call HTTP endpoints.

## Recommended API endpoints (minimal)

Auth
- POST `/api/auth/login`
  - Request: { username: string, password: string }
  - Response: { token: string, user: User }

- POST `/api/auth/register-user`
  - Request: { fullName, email, phone, password }
  - Response: { user }

- POST `/api/auth/register-eo`
  - Request: { fullName, email, phone, organizationName }
  - Response: { user }

Events
- GET `/api/events` → list of events
- GET `/api/events/:id` → details for event
- POST `/api/events` → create event (EO)
- PUT `/api/events/:id` → update event
- DELETE `/api/events/:id` → delete event

Bookings
- POST `/api/bookings` → create booking
  - Request: { eventId, ticketCategoryId, quantity, userId }
  - Response: { booking }
- GET `/api/bookings?userId=` → bookings for user
- POST `/api/bookings/:id/cancel` → cancel booking

Waitlist
- POST `/api/waitlist` → join
- DELETE `/api/waitlist/:id` → leave

Promotional codes
- POST `/api/events/:id/promotions` → add promo
- POST `/api/events/:id/promotions/validate` → validate code

Payments (example)
- POST `/api/payments/charge` → accepts a payment request and returns transaction status

## Example Auth response
Request:
```
POST /api/auth/login
{ "username": "john_user", "password": "password123" }
```
Response:
```
{ "token": "ey...", "user": { "id": "user1", "username": "john_user", "email": "john@example.com", "role": "user" } }
```

## High-level ERD (entities and key fields)
- User: id, username, email, passwordHash, role, fullName, phone, organizationName, createdAt
- Event: id, title, description, organizerId (FK -> User), date, time, location, status, createdAt
- TicketCategory: id, eventId (FK), type, price, total, sold
- Booking: id, eventId (FK), userId (FK), ticketCategoryId (FK), quantity, totalPrice, status, qrCode, createdAt
- WaitlistEntry: id, eventId, userId, ticketCategoryId, quantity, registeredAt, notified
- PromotionalCode: id, eventId, code, discountPercentage, expiryDate, maxUsage, usedCount

## Persistence & DB suggestions
- PostgreSQL or MySQL for relational constraints (bookings, inventory)
- Use transactions for create booking + decrement ticket availability to avoid oversell
- Index `events.date`, `bookings.userId`, `promotional.code`

## Migration plan (quick)
1. Build API endpoints matching the routes above.
2. Replace mock loaders in front-end with `HttpClient` calls (guard with `environment.useMocks`).
3. Implement JWT auth and an `AuthInterceptor` that adds `Authorization` header.
4. Create database schema and add migration scripts.
5. Run integration tests and perform booking concurrency tests.

## Additional considerations
- QR generation: generate server-side and return URL/data to front-end.
- Payment: use a payment gateway sandbox for testing (Stripe/ Midtrans / etc). Keep front-end generic (receive a payment token or success callback).
- Notifications: use server-side email + push strategy; front-end only shows UI confirmations.

---

If you'd like, I can scaffold an Express + SQLite minimal backend with these endpoints so you can test integration locally. Ask and I'll scaffold it into a new `server/` folder and provide start instructions.
