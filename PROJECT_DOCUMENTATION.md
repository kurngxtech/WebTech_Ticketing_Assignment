# Project Documentation Report

**Date:** 2026-01-03
**Project:** Event Management System (EMS)

---

## 🎓 Reviewer Quick Start Guide

> **For lecturers reviewing this project:** Use the database seed script to quickly populate sample data.

```bash
# 1. Install dependencies
cd backend && npm install

# 2. Copy and configure .env (fill in your MongoDB URI)
cp .env.example .env

# 3. Seed the database with sample data
npm run seed

# 4. Start backend server
npm run dev

# 5. In new terminal - start frontend
cd .. && npm install && ng serve
```

**Test Accounts (created by seed script):**

| Role            | Email                  | Password       |
| --------------- | ---------------------- | -------------- |
| Admin           | `admin@auditorium.com` | `adminpass123` |
| Event Organizer | `jane@events.com`      | `eopass123`    |
| Regular User    | `john@example.com`     | `password123`  |

---

## 1. New Web Technologies

The following technologies have been introduced or utilized in the recent development phase (specifically differentiating from standard initial setups).

| Technology / Library       | Type               | Justification for Implementation                                                                                                                                                                    |
| :------------------------- | :----------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Express.js** (`express`) | Backend Framework  | Used to build a robust RESTful API that handles client requests, routing, and middleware integration efficiently. It provides the core structure for the server-side logic.                         |
| **MongoDB & Mongoose**     | Database & ODM     | A NoSQL database was chosen for its flexibility in handling varying event data structures. Mongoose provides schema validation to ensure data consistency for Users, Events, and Bookings.          |
| **Nodemailer**             | Email Service      | Implemented to send transactional emails (Welcome, Booking Confirmation, Waitlist Alerts, Password Reset). Configured with **Gmail** as the SMTP provider for reliable and cost-effective delivery. |
| **Midtrans Client**        | Payment Gateway    | Integrated to handle secure online payments. `midtrans-client` allows for easy transaction implementation and status checks within the Node.js environment.                                         |
| **JWT (JSON Web Tokens)**  | Authentication     | Used for stateless user authentication. Includes access tokens and refresh tokens for better session management.                                                                                    |
| **BcryptJS**               | Security           | Utilized for hashing user passwords before storage, ensuring sensitive data is protected against breaches.                                                                                          |
| **QR Code** (`qrcode`)     | Utility            | Generates unique QR codes for tickets. This allows for digital verification of bookings at event venues.                                                                                            |
| **Angular SSR**            | Frontend Rendering | Server-Side Rendering (SSR) is enabled to improve initial load performance and SEO for public-facing event pages.                                                                                   |
| **Bootstrap 5**            | UI Framework       | ensuring a responsive and mobile-friendly design across all pages without writing extensive custom CSS.                                                                                             |
| **Helmet.js**              | Security           | Adds security headers (CSP, HSTS, X-Frame-Options) to protect against common web vulnerabilities.                                                                                                   |
| **Compression**            | Performance        | Gzip compression middleware reduces API response sizes for faster loading.                                                                                                                          |
| **Node-cron**              | Scheduling         | Handles scheduled tasks like auto-cancelling expired bookings and sending event reminders.                                                                                                          |
| **Ngrok**                  | Development Tool   | Required during development to expose the local server (webhook endpoint) to the Midtrans payment gateway for processing real-time payment notifications.                                           |
| **Activity Logging**       | Audit Trail        | Custom middleware that logs all API requests with response times, user IDs, and action types. Provides pre-built helpers for auth, booking, and payment events.                                     |
| **APM Middleware**         | Monitoring         | Application Performance Monitoring with real-time metrics: request counts, response time percentiles (p50-p99), memory usage, and error tracking.                                                   |
| **MongoDB TTL Indexes**    | Data Management    | Time-To-Live indexes automatically expire activity logs after 90 days, maintaining database efficiency without manual cleanup scripts.                                                              |

---

## 2. Manual Guide: Configuration & Installation

Follow these steps to set up the development environment and run the application.

### Prerequisites

- **Node.js** (v18.x or higher) -> [Download Here](https://nodejs.org/)
- **MongoDB** (Local or Atlas Cloud) -> [Download Here](https://www.mongodb.com/try/download/community)
- **Angular CLI** -> Run `npm install -g @angular/cli`

### Installation Steps

#### 1. Clone & Install Dependencies

Navigate to the project directory and install dependencies for both Frontend and Backend.

**For Frontend:**

```bash
npm install
```

**For Backend:**

```bash
cd backend
npm install
```

#### 2. Environment Configuration (.env)

Copy the provided `.env.example` template and fill in your credentials:

```bash
cd backend
cp .env.example .env
```

Edit the `.env` file with your own values:

| Variable              | Description                      | How to Get                                                        |
| --------------------- | -------------------------------- | ----------------------------------------------------------------- |
| `MONGODB_URI`         | MongoDB Atlas connection string  | [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free tier)  |
| `JWT_SECRET`          | Secret key for JWT tokens        | Generate: `openssl rand -base64 32`                               |
| `GMAIL_USER`          | Gmail address for sending emails | Your Gmail account                                                |
| `GMAIL_APP_PASSWORD`  | Gmail App Password (16 chars)    | [Google App Passwords](https://myaccount.google.com/apppasswords) |
| `MIDTRANS_SERVER_KEY` | Midtrans Sandbox Server Key      | [Midtrans Dashboard](https://dashboard.sandbox.midtrans.com)      |
| `MIDTRANS_CLIENT_KEY` | Midtrans Sandbox Client Key      | Same as above                                                     |

> **Note:** Email and payment features are optional for basic testing. Without these, emails are logged to console and payments can be mocked.

#### 3. Seed the Database (Required for Reviewers)

Populate the database with sample data including test accounts, events, and bookings:

```bash
cd backend
npm run seed
```

This creates the following test accounts:

| Role                  | Email                  | Password       |
| --------------------- | ---------------------- | -------------- |
| **Admin**             | `admin@auditorium.com` | `adminpass123` |
| **Event Organizer 1** | `jane@events.com`      | `eopass123`    |
| **Event Organizer 2** | `bob@events.com`       | `eopass456`    |
| **Regular User**      | `john@example.com`     | `password123`  |

Plus **5 sample events** with ticket categories and **sample bookings** for analytics testing.

#### 4. Run the Application

You need to run the backend and frontend servers simultaneously.

**Start Backend:**

```bash
cd backend
npm run dev
# Output: Server running on port 5000 & MongoDB Connected
```

**Start Frontend:**

```bash
# In a new terminal window, from project root
ng serve
# Access the app at http://localhost:4200
```

---

## 3. User Manuals

### A. General / Group Functionalities

_Core features available to standard users and event organizers._

#### 1. Registration & Login

- **Sign Up:** Navigate to `/signup`. Enter your details. Event Organizers (EO) require admin approval.
- **Login:** Use credentials to access the dashboard.
- **Forgot Password:** Use the "Forgot Password" link to receive a reset code via email.
- **Password Reset:** Click the link in email to set a new password.

#### 2. Event Discovery (User)

- **Browse Events:** The home page displays upcoming events. Use the search bar to filter by name.
- **Event Details:** Click any event card to view full details (Date, Time, Location, Description).
- **Seat Availability:** Real-time availability is shown. If sold out, a "Join Waitlist" option appears.

#### 3. Ticket Booking Flow

1.  Select an event and click "Buy Ticket".
2.  Choose ticket quantity and type.
3.  For seated events, select specific seats from the interactive seat map.
4.  Proceed to payment (via Midtrans).
5.  **Confirmation:** Upon success, you will receive an email with your **QR Code Ticket**.
6.  **View Ticket:** Go to "My Bookings" to view or download your ticket.

#### 4. Event Management (Organizer)

- **Create Event:** Log in as EO. Click "Create Event". Fill in details and upload an image.
- **Edit/Delete:** Manage your existing events from the dashboard.

---

### B. Individual Functionalities

_Specialized features developed as part of recent enhancements._

#### 1. My Bookings & History

- **Access:** Click on the User Profile > "My Bookings".
- **Features:**
  - View a list of all active and past bookings.
  - **QR Code retrieval:** Click on a booking to view the QR code again.
  - **Download:** Option to download the ticket as a PDF.
  - **Cancellation:** Users can cancel a booking (subject to policy), triggering an automatic refund email.

#### 2. Analytics Dashboard (Admin/EO)

- **Access:** Login as Admin/EO -> "Analytics".
- **Reports:**
  - **Sales Charts:** Visual graphs showing ticket sales over time.
  - **Revenue Data:** Total revenue generated per event.
  - **Attendee Demographics:** Breakdown of ticket types sold (VIP vs Regular).

#### 3. Waitlist System

- **Join:** If an event is full, users can join the waitlist.
- **Notification:** When a spot opens up, the system **automatically emails** the top waitlisted user.
- **Priority:** The notified user has a limited window (e.g., 24 hours) to book the ticket before it's offered to the next person.

#### 4. Notification Module (Email-Based)

- **Triggers:**
  - **Welcome Email:** Sent upon registration.
  - **Booking Confirmation:** Contains unique QR Code.
  - **Payment Receipt:** Proof of transaction.
  - **Password Reset:** Secure link to reset password.
  - **Event Reminder:** Sent X days before the event.
  - **Cancellation Alert:** Confirms booking removal.

---

## 4. Implementation Proofs

This section provides code references validating the selected technologies.

### 4.1. Express.js

**File:** `backend/server.js`
**Role:** Core API Framework
**Snippet:**

```javascript
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const app = express();

// Security headers with Helmet.js
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://app.sandbox.midtrans.com'],
      },
    },
  })
);

// Gzip compression
app.use(compression());

// Middleware Setup
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Route Registration
const { registerRoutes } = require('./routes');
registerRoutes(app);
```

**Proof:** `express` is imported and used with security middleware (Helmet, Compression), configure global middleware, and register application routes.

### 4.2. MongoDB & Mongoose

**File:** `backend/models/User.js` & `backend/controllers/bookingController.js`
**Role:** Database Modeling & Transaction Management
**Snippet (Schema):**

```javascript
// backend/models/User.js
const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['admin', 'eo', 'user'], default: 'user' },
  // Password reset fields
  passwordResetToken: { type: String, default: null },
  passwordResetExpires: { type: Date, default: null },
  // Refresh token for JWT refresh flow
  refreshToken: { type: String, default: null, select: false },
});
```

**Snippet (Transaction):**

```javascript
// backend/controllers/bookingController.js
const session = await mongoose.startSession();
session.startTransaction();
try {
  // Check for existing pending booking to prevent duplicates
  const existingPendingBooking = await Booking.findOne({
    userId,
    eventId,
    ticketCategoryId,
    status: 'pending',
    paymentStatus: 'pending',
  }).session(session);

  if (existingPendingBooking) {
    await session.abortTransaction();
    return res.json({ success: true, booking: existingPendingBooking, existing: true });
  }

  // Operations on Event and Booking
  await event.save({ session });
  await booking.save({ session });
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
}
```

**Proof:** Mongoose is used to define strict schemas (like `User`) with password reset and refresh token fields, and manage ACID compliant transactions during critical operations like ticket booking with duplicate prevention.

### 4.3. Nodemailer (Email Service)

**File:** `backend/utils/emailService.js`
**Role:** Transactional Email Notifications
**Snippet:**

```javascript
const nodemailer = require('nodemailer');
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
};

// Password Reset Email
const sendPasswordResetEmail = async (email, fullName, resetUrl) => {
  const transporter = createTransporter();
  const mailOptions = {
    from: `"EMS - Event Management System" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: '🔐 Password Reset Request - EMS',
    html: `...`, // Themed HTML template
  };
  await transporter.sendMail(mailOptions);
};
```

**Proof:** The `nodemailer` library is instantiated with Gmail service credentials to create a transporter used for sending all system emails (welcome, confirmation, password reset, alerts).

### 4.4. Midtrans Client (Payment)

**File:** `backend/controllers/paymentController.js`
**Role:** Payment Gateway Integration
**Snippet:**

```javascript
const midtransClient = require('midtrans-client');
const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

// Check for existing pending payment to prevent duplicates
const existingPayment = await Payment.findOne({
  bookingId: booking._id,
  transactionStatus: 'pending',
});

if (existingPayment && existingPayment.snapToken) {
  return res.json({
    success: true,
    payment: { orderId: existingPayment.orderId, snapToken: existingPayment.snapToken },
    existing: true,
  });
}

const transaction = await snap.createTransaction(transactionParams);
```

**Proof:** The `midtrans-client` is initialized with server keys to generate Snap tokens, with duplicate payment prevention logic.

### 4.5. JWT (JSON Web Tokens) with Refresh Tokens

**File:** `backend/controllers/authController.js`
**Role:** Stateless Authentication with Token Refresh
**Snippet:**

```javascript
const { generateToken } = require('../middleware/auth');

// Login with refresh token generation
exports.login = async (req, res) => {
  const user = await User.findByCredentials(username, password);
  const token = generateToken(user);
  const refreshToken = user.generateRefreshToken();
  await user.save();
  res.json({ success: true, token, refreshToken });
};

// Refresh token endpoint
exports.refreshToken = async (req, res) => {
  const user = await User.findByRefreshToken(refreshToken);
  const accessToken = generateToken(user);
  const newRefreshToken = user.generateRefreshToken();
  await user.save();
  res.json({ success: true, token: accessToken, refreshToken: newRefreshToken });
};
```

**Proof:** JWT is used for authentication with refresh token support for better session management.

### 4.6. BcryptJS (Security)

**File:** `backend/models/User.js`
**Role:** Password Hashing
**Snippet:**

```javascript
const bcrypt = require('bcryptjs');
// Pre-save hook to hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
```

**Proof:** `bcryptjs` is used in a Mongoose pre-save hook to automatically hash user passwords before they are stored in the database, ensuring security.

### 4.7. QR Code Implementation

**File:** `backend/utils/qrGenerator.js`
**Role:** Ticket Verification
**Snippet:**

```javascript
const QRCode = require('qrcode');
const generateQRCodeDataURL = async (data) => {
  return await QRCode.toDataURL(data, { errorCorrectionLevel: 'M' });
};
const generateQRData = (booking, event) => {
  return `EMS|${booking._id}|${event._id}|${booking.ticketCategoryId}|...`;
};
```

**Proof:** The `qrcode` library is used to convert bookings data into scannable images (Data URLs), which are then embedded in emails and tickets.

### 4.8. Angular SSR with Route Preloading

**File:** `src/main.server.ts` & `src/app/app.config.ts`
**Role:** Server-Side Rendering & Performance
**Snippet:**

```typescript
// app.config.ts - Route preloading strategy
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideClientHydration(withEventReplay()),
  ],
};
```

**Proof:** Angular SSR is implemented with `PreloadAllModules` strategy for faster navigation between routes.

### 4.9. Helmet.js (Security Headers)

**File:** `backend/server.js`
**Role:** Security Headers
**Snippet:**

```javascript
const helmet = require('helmet');
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://app.sandbox.midtrans.com'],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: ["'self'", 'https://api.sandbox.midtrans.com'],
        frameSrc: ["'self'", 'https://app.sandbox.midtrans.com'],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);
```

**Proof:** Helmet.js is used to add security headers including Content Security Policy configured to allow Midtrans integration.

### 4.10. Compression Middleware

**File:** `backend/server.js`
**Role:** Response Compression
**Snippet:**

```javascript
const compression = require('compression');
app.use(
  compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    },
  })
);
```

**Proof:** Compression middleware is used to gzip responses larger than 1KB for improved performance.

### 4.11. Node-cron (Scheduled Tasks)

**File:** `backend/services/cronService.js`
**Role:** Scheduled Background Jobs
**Snippet:**

```javascript
const cron = require('node-cron');

const initCronJobs = () => {
  // Cancel expired bookings every hour
  cron.schedule('0 * * * *', async () => {
    await cancelExpiredBookings();
  });

  // Send event reminders daily at 9 AM
  cron.schedule('0 9 * * *', async () => {
    await sendEventReminders();
  });
};

const cancelExpiredBookings = async () => {
  const expiredBookings = await Booking.find({
    status: 'pending',
    paymentStatus: 'pending',
    bookingDate: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  });
  // Cancel and restore tickets...
};
```

**Proof:** Node-cron is used to schedule background jobs like auto-cancelling expired bookings and sending event reminders.

### 4.12. Ngrok (Development Tunneling)

**File:** `backend/controllers/paymentController.js`
**Role:** Exposing Local Webhooks
**Snippet:**

```javascript
// backend/controllers/paymentController.js
// ...
// This endpoint receives notifications from Midtrans
exports.handleNotification = async (req, res) => {
  const notificationJson = req.body;
  const statusResponse = await coreApi.transaction.notification(notificationJson);
  // ... updates booking status
};
```

**Proof:** The `handleNotification` method receives asynchronous webhooks from the Midtrans server. Since Midtrans cannot call `localhost`, **Ngrok** is utilized to create a secure public URL (e.g., `https://random-id.ngrok-free.app`) that tunnels traffic to this endpoint during development/testing.

### 4.13. Activity Logging System

**File:** `backend/middleware/activityLogger.js` & `backend/models/ActivityLog.js`
**Role:** User Action Tracking & Audit Trail
**Snippet (Middleware):**

```javascript
// backend/middleware/activityLogger.js
const ActivityLog = require('../models/ActivityLog');

// Express middleware to log API requests (logs after response)
const requestLogger = (options = {}) => {
  return (req, res, next) => {
    const startTime = Date.now();
    const originalEnd = res.end;

    res.end = function (chunk, encoding) {
      res.end = originalEnd;
      res.end(chunk, encoding);

      const responseTime = Date.now() - startTime;

      // Log the request
      ActivityLog.log({
        userId: req.userId || null,
        action: 'api_request',
        resource: 'system',
        details: { query: req.query, body: sanitizeBody(req.body) },
        ipAddress: getClientIP(req),
        statusCode: res.statusCode,
        responseTime,
      });
    };
    next();
  };
};

// Pre-made helpers for common actions
const logAuth = {
  login: (req, userId, success) => logActivity(req, 'login', 'user', userId, { success }),
  register: (req, userId, email) => logActivity(req, 'register', 'user', userId, { email }),
};

const logPayment = {
  success: (req, paymentId, orderId) =>
    logActivity(req, 'payment_success', 'payment', paymentId, { orderId }),
  failed: (req, paymentId, reason) =>
    logActivity(req, 'payment_failed', 'payment', paymentId, { reason }),
};
```

**Snippet (Model):**

```javascript
// backend/models/ActivityLog.js
const activityLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  action: {
    type: String,
    enum: ['login', 'logout', 'register', 'booking_create', 'booking_cancel',
           'payment_create', 'payment_success', 'payment_failed', 'event_create', ...],
  },
  resource: { type: String, enum: ['user', 'event', 'booking', 'payment', 'waitlist', 'system'] },
  resourceId: { type: mongoose.Schema.Types.ObjectId },
  ipAddress: { type: String },
  userAgent: { type: String },
  responseTime: { type: Number },
  timestamp: { type: Date, default: Date.now },
}, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // Auto-delete after 90 days

// TTL Index for automatic cleanup
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
```

**Proof:** Activity logging middleware intercepts all API requests, captures response times, and stores audit trails in MongoDB. Pre-made helpers (`logAuth`, `logPayment`, `logBooking`) simplify action-specific logging. TTL indexes auto-delete old logs after 90 days.

---

### 4.14. APM (Application Performance Monitoring)

**File:** `backend/middleware/apm.js`
**Role:** Real-time Performance Metrics
**Snippet:**

```javascript
// backend/middleware/apm.js

// In-memory metrics storage
const metrics = {
  requests: { total: 0, success: 0, errors: 0, byPath: {}, byMethod: {} },
  response: { totalTime: 0, count: 0, slowest: 0, slowestPath: '' },
  memory: { samples: [], maxHeapUsed: 0 },
  uptime: { startTime: Date.now() },
  errors: { recent: [], byType: {} },
};

// Express middleware for APM
const apmMiddleware = (options = {}) => {
  return (req, res, next) => {
    const startTime = process.hrtime.bigint();

    const originalEnd = res.end;
    res.end = function (chunk, encoding) {
      const responseTimeMs = Number(process.hrtime.bigint() - startTime) / 1e6;

      metrics.requests.total++;
      if (res.statusCode >= 400) metrics.requests.errors++;
      else metrics.requests.success++;

      // Track by path for slow endpoint identification
      const pathKey = `${req.method} ${req.path}`;
      if (!metrics.requests.byPath[pathKey]) {
        metrics.requests.byPath[pathKey] = { count: 0, totalTime: 0, errors: 0 };
      }
      metrics.requests.byPath[pathKey].count++;
      metrics.requests.byPath[pathKey].totalTime += responseTimeMs;

      originalEnd.call(res, chunk, encoding);
    };
    next();
  };
};

// Get current metrics with percentiles
const getMetrics = () => ({
  timestamp: new Date().toISOString(),
  uptime: { ms: Date.now() - metrics.uptime.startTime },
  requests: {
    total: metrics.requests.total,
    errorRate: `${((metrics.requests.errors / metrics.requests.total) * 100).toFixed(2)}%`,
  },
  response: {
    averageMs: (metrics.response.totalTime / metrics.response.count).toFixed(2),
    p99: getPercentile(99),
  },
  memory: { heapUsed: formatBytes(process.memoryUsage().heapUsed) },
});
```

**Proof:** The APM middleware tracks request counts, response times, memory usage, and error rates in real-time. It provides percentile calculations (p50, p90, p95, p99) for performance analysis and identifies the slowest endpoints. This enables proactive performance monitoring.

---

### 4.15. Scheduled Tasks (Cron Service)

**File:** `backend/services/cronService.js`
**Role:** Automated Background Jobs
**Snippet:**

```javascript
// backend/services/cronService.js
const cron = require('node-cron');
const mongoose = require('mongoose');

// Auto-cancel expired pending bookings (runs every hour)
const cancelExpiredBookings = async () => {
  const session = await mongoose.startSession();
  session.startTransaction();

  const expirationTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
  const expiredBookings = await Booking.find({
    status: 'pending',
    paymentStatus: 'pending',
    bookingDate: { $lt: expirationTime },
  }).session(session);

  for (const booking of expiredBookings) {
    booking.status = 'cancelled';
    booking.cancellationReason = 'Payment not completed within 24 hours';
    await booking.save({ session });

    // Restore tickets to event inventory
    const event = await Event.findById(booking.eventId).session(session);
    event.tickets[ticketIndex].sold -= booking.quantity;
    await event.save({ session });

    // Notify waitlist when tickets become available
    const waitlistEntries = await Waitlist.getNextInLine(event._id, booking.ticketCategoryId, 1);
    for (const entry of waitlistEntries) {
      await sendWaitlistNotification(entryUser.email, entryUser.fullName, event, ticketType);
    }
  }

  await session.commitTransaction();
};

// Initialize all cron jobs
const initCronJobs = () => {
  cron.schedule('0 * * * *', cancelExpiredBookings); // Every hour
  cron.schedule('0 9 * * *', sendEventReminders); // Daily at 9 AM
  cron.schedule('0 3 * * 0', cleanupOldLogs); // Weekly on Sundays at 3 AM
};
```

**Proof:** Node-cron schedules three automated jobs: (1) hourly cleanup of unpaid bookings with ticket restoration and waitlist notification, (2) daily event reminders at 9 AM, and (3) weekly activity log cleanup. All database operations use transactions for ACID compliance.

---

### 4.16. Currency Conversion (MYR to IDR)

**File:** `backend/controllers/paymentController.js`
**Role:** Multi-currency Payment Support
**Snippet:**

```javascript
// Currency conversion rate: MYR to IDR (Jan 2026 market rate)
const MYR_TO_IDR_RATE = 3650;

// Convert MYR to IDR for Midtrans (only accepts IDR)
const convertMYRToIDR = (amountMYR) => {
  return Math.round(amountMYR * MYR_TO_IDR_RATE);
};

// Create payment transaction with currency conversion
exports.createPayment = async (req, res) => {
  // Prices stored in MYR in database
  const grossAmountIDR = convertMYRToIDR(booking.totalPrice);
  const pricePerTicketIDR = convertMYRToIDR(booking.pricePerTicket);

  // Midtrans transaction uses IDR amounts
  const transactionParams = {
    transaction_details: {
      order_id: orderId,
      gross_amount: grossAmountIDR, // IDR for Midtrans
    },
    item_details: [
      {
        price: pricePerTicketIDR, // IDR for Midtrans
        quantity: booking.quantity,
        name: `${event.title} - ${ticketType} Ticket`,
      },
    ],
  };

  // Local payment record stores MYR for display
  const payment = new Payment({
    grossAmount: booking.totalPrice, // MYR for user display
    // ... other fields
  });
};
```

**Proof:** The system stores all prices in MYR (Malaysian Ringgit) for local users but converts to IDR (Indonesian Rupiah) when communicating with Midtrans, as Midtrans only processes IDR transactions. Conversion is done server-side to ensure accuracy.

---

### 4.17. Payment Webhook Handling

**File:** `backend/controllers/paymentController.js`
**Role:** Real-time Payment Status Updates
**Snippet:**

```javascript
// POST /api/payments/notification - Handle Midtrans webhook
exports.handleNotification = async (req, res) => {
  const notificationJson = req.body;

  // Verify notification signature with Midtrans SDK
  const statusResponse = await coreApi.transaction.notification(notificationJson);
  const {
    order_id: orderId,
    transaction_status: transactionStatus,
    fraud_status: fraudStatus,
  } = statusResponse;

  const payment = await Payment.findOne({ orderId });
  await payment.updateFromNotification(statusResponse);

  const booking = await Booking.findById(payment.bookingId);

  // Handle different transaction statuses
  if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
    if (fraudStatus === 'accept' || !fraudStatus) {
      booking.status = 'confirmed';
      booking.paymentStatus = 'completed';
      booking.paymentMethod = statusResponse.payment_type;

      // Send confirmation email with QR code (prevent duplicate sends)
      if (!payment.emailSent) {
        await sendPaymentReceipt(user.email, user.fullName, payment, booking, event);
        payment.emailSent = true;
        await payment.save();
      }
    }
  } else if (['deny', 'cancel', 'expire'].includes(transactionStatus)) {
    booking.status = 'cancelled';
    booking.paymentStatus = 'failed';

    // Restore tickets to inventory
    event.tickets[ticketIndex].sold -= booking.quantity;
    await event.save();
  } else if (transactionStatus === 'pending') {
    booking.paymentStatus = 'pending';
    // Update expiry based on payment method (QRIS: 15min, VA: 24hr)
    if (statusResponse.expiry_time) {
      booking.expiresAt = new Date(statusResponse.expiry_time);
    }
  }

  await booking.save();
  res.status(200).json({ success: true });
};
```

**Proof:** The webhook endpoint receives real-time notifications from Midtrans for all payment status changes. It verifies signatures, updates both Payment and Booking records, sends confirmation emails (with duplicate prevention), and handles payment failures by restoring ticket inventory.

---

### 4.18. Database Indexing Strategy

**File:** Various model files (`Booking.js`, `Payment.js`, `ActivityLog.js`, etc.)
**Role:** Query Performance Optimization
**Snippet:**

```javascript
// backend/models/Booking.js - Indexes for faster queries
bookingSchema.index({ eventId: 1 }); // Event bookings lookup
bookingSchema.index({ userId: 1 }); // User bookings lookup
bookingSchema.index({ status: 1 }); // Filter by status
bookingSchema.index({ bookingDate: -1 }); // Recent bookings first
bookingSchema.index({ qrCode: 1 }); // QR code verification lookup

// backend/models/Payment.js
paymentSchema.index({ bookingId: 1 }); // Payment-booking association
paymentSchema.index({ userId: 1 }); // User payment history
paymentSchema.index({ transactionStatus: 1 }); // Filter by status

// backend/models/ActivityLog.js
activityLogSchema.index({ userId: 1 }); // User activity lookup
activityLogSchema.index({ action: 1 }); // Filter by action type
activityLogSchema.index({ resource: 1, resourceId: 1 }); // Resource history
activityLogSchema.index({ timestamp: -1 }); // Recent logs first
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // TTL
```

**Proof:** Strategic MongoDB indexes are applied to all frequently queried fields, ensuring O(log n) lookup times for user bookings, payment status checks, and activity logs. TTL indexes on ActivityLog auto-expire documents after 90 days, maintaining database efficiency
