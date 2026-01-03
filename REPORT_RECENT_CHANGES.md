# Project Changes Report

**Date Generated:** 2026-01-03
**Scope:** Recent implementation updates

## Summary

Major architecture improvements, security enhancements, performance optimizations, and UX improvements have been implemented in the past session.

---

## 🎓 For Reviewers: Database Setup

Run `npm run seed` in the `backend/` folder to populate sample data:

```bash
cd backend
npm run seed
```

This creates test accounts, sample events, and bookings. See `backend/README.md` for detailed setup instructions.

---

## Recent Changes

### Phase 1: Bug Fixes ✅

#### Double Booking Prevention

- **Frontend:** Added `paymentInProgress` lock in `ticket-buy.ts` to prevent multiple payment submissions
- **Backend:** Added duplicate booking check in `bookingController.js` - returns existing pending booking instead of creating new one
- **Backend:** Added duplicate payment check in `paymentController.js` - returns existing snapToken if payment already pending

#### Ticket Quantity Validation

- Added `validateQuantity` method to clamp user input within valid range
- Enhanced `addToCart` to check cart contents against remaining tickets

---

### Phase 2: Security Enhancements ✅

#### Helmet.js Security Headers

- **File:** `backend/server.js`
- Added Content Security Policy (CSP)
- Added X-Frame-Options, HSTS, XSS protection
- Configured to allow Midtrans integration domains

#### Password Reset Flow

- **Files:** `backend/models/User.js`, `backend/controllers/authController.js`, `backend/routes/auth.js`
- Added `passwordResetToken` and `passwordResetExpires` fields to User model
- New endpoints:
  - `POST /api/auth/forgot-password` - Send reset email
  - `POST /api/auth/reset-password/:token` - Reset password with token
- Added themed email template `sendPasswordResetEmail` in `emailService.js`

#### JWT Refresh Tokens

- **Files:** `backend/models/User.js`, `backend/controllers/authController.js`
- Added `refreshToken` and `refreshTokenExpires` fields to User model
- New endpoints:
  - `POST /api/auth/refresh-token` - Get new access token
  - `POST /api/auth/logout` - Invalidate refresh token
- Implements token rotation for enhanced security

---

### Phase 3: Performance Optimizations ✅

#### Compression Middleware

- **File:** `backend/server.js`
- Added gzip compression for responses > 1KB
- Configurable compression level (6)

#### Route Preloading

- **File:** `src/app/app.config.ts`
- Added `PreloadAllModules` strategy for faster lazy-loaded route navigation

---

### Phase 4: Architecture Improvements ✅

#### Database Migration System

- **Files:** `backend/migrations/index.js`, `backend/migrations/001_add_activity_logs.js`
- Created migration tracking system in MongoDB
- Supports up/down migrations
- First migration: Activity logs collection with indexes

#### Activity Logging

- **Files:** `backend/models/ActivityLog.js`, `backend/middleware/activityLogger.js`
- Tracks user actions (login, register, booking, payment)
- Records API requests with response times
- Automatic TTL cleanup (90 days)

#### APM (Application Performance Monitoring)

- **File:** `backend/middleware/apm.js`
- Tracks request timing (average, p50, p90, p95, p99)
- Memory usage monitoring
- Error rate tracking
- Top paths by request count

#### Enhanced Health Checks

- **File:** `backend/server.js`
- New endpoints:
  - `/api/health` - Basic health
  - `/api/health/detailed` - DB status, memory, uptime
  - `/api/health/ready` - Kubernetes readiness probe
  - `/api/health/live` - Kubernetes liveness probe
  - `/api/metrics` - APM metrics

#### Cron Job Service

- **File:** `backend/services/cronService.js`
- Hourly: Auto-cancel expired pending bookings (24h timeout)
- Daily 9AM: Send event reminders
- Weekly Sunday 3AM: Clean up old activity logs

---

### Phase 5: Frontend UX Improvements ✅

#### Skeleton Loaders

- **Files:** `src/app/components/skeleton/skeleton-card.ts`, `src/app/components/skeleton/skeleton-list.ts`
- Reusable skeleton card with configurable image height, lines, button
- Skeleton list for grid or list layouts

#### Breadcrumb Navigation

- **File:** `src/app/components/breadcrumb/breadcrumb.ts`
- Accessible navigation with home icon
- Responsive design

#### Lazy Loading Directive

- **File:** `src/app/components/lazy-load.directive.ts`
- Uses IntersectionObserver for efficient image loading
- Placeholder support
- Native `loading="lazy"` attribute

#### Seat Map Close Button Fix

- **Files:** `ticket-buy.html`, `ticket-buy.css`
- Moved close button to overlay level (dark background area)
- Fixed positioning at top-right corner

---

## New Files Created

### Backend

| File                                  | Purpose                    |
| ------------------------------------- | -------------------------- |
| `models/ActivityLog.js`               | Activity logging schema    |
| `middleware/activityLogger.js`        | Request logging middleware |
| `middleware/apm.js`                   | Performance monitoring     |
| `migrations/index.js`                 | Migration system           |
| `migrations/001_add_activity_logs.js` | First migration            |
| `services/cronService.js`             | Scheduled tasks            |

### Frontend

| File                                   | Purpose                 |
| -------------------------------------- | ----------------------- |
| `components/skeleton/skeleton-card.ts` | Skeleton card component |
| `components/skeleton/skeleton-list.ts` | Skeleton list component |
| `components/breadcrumb/breadcrumb.ts`  | Breadcrumb navigation   |
| `components/lazy-load.directive.ts`    | Image lazy loading      |

---

## Modified Files

### Backend

- `server.js` - Security headers, compression, health checks
- `models/User.js` - Password reset, refresh token fields
- `controllers/authController.js` - New auth endpoints
- `controllers/bookingController.js` - Duplicate booking prevention
- `controllers/paymentController.js` - Duplicate payment prevention
- `routes/auth.js` - New routes
- `utils/emailService.js` - Password reset email template

### Frontend

- `app.config.ts` - Route preloading
- `ticket-buy/ticket-buy.ts` - Payment lock
- `ticket-buy/ticket-buy.html` - Close button repositioned
- `ticket-buy/ticket-buy.css` - Close button styling

---

## Testing Endpoints

### Health Checks

```bash
curl http://localhost:5000/api/health/detailed
```

### Metrics

```bash
curl http://localhost:5000/api/metrics
```

---

_End of Report_
