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
cd n:\code\Angular\ticket
npm install
```

**For Backend:**

```bash
cd backend
npm install
```

#### 2. Environment Configuration (.env)

Create a `.env` file in the `backend/` directory with the following keys:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/ems_db  # Or your MongoDB Atlas URI
JWT_SECRET=your_super_secure_secret_key
FRONTEND_URL=http://localhost:4200

# Email Configuration (Google)
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_app_password      # Generate this in Google Account > Security

# Payment Gateway (Midtrans)
MIDTRANS_SERVER_KEY=your_midtrans_server_key
MIDTRANS_CLIENT_KEY=your_midtrans_client_key
MIDTRANS_IS_PRODUCTION=false

# Optional: Activity Logging
ENABLE_ACTIVITY_LOGGING=true
LOG_ONLY_ERRORS=false
```

#### 3. Run the Application

You need to run the backend and frontend servers simultaneously.

**Start Backend:**

```bash
cd backend
npm run dev
# Output should confirm: Server running on port 5000 & MongoDB Connected
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
