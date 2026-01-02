# Project Documentation Report

**Date:** 2025-12-30
**Project:** Event Management System (EMS)

---

## 1. New Web Technologies

The following technologies have been introduced or utilized in the recent development phase (specifically differentiating from standard initial setups).

| Technology / Library       | Type               | Justification for Implementation                                                                                                                                                           |
| :------------------------- | :----------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Express.js** (`express`) | Backend Framework  | Used to build a robust RESTful API that handles client requests, routing, and middleware integration efficiently. It provides the core structure for the server-side logic.                |
| **MongoDB & Mongoose**     | Database & ODM     | A NoSQL database was chosen for its flexibility in handling varying event data structures. Mongoose provides schema validation to ensure data consistency for Users, Events, and Bookings. |
| **Nodemailer**             | Email Service      | Implemented to send transactional emails (Welcome, Booking Confirmation, Waitlist Alerts). Configured with **Gmail** as the SMTP provider for reliable and cost-effective delivery.        |
| **Midtrans Client**        | Payment Gateway    | Integrated to handle secure online payments. `midtrans-client` allows for easy transaction implementation and status checks within the Node.js environment.                                |
| **JWT (JSON Web Tokens)**  | Authentication     | Used for stateless user authentication. It secures API endpoints by verifying user identity without storing session data on the server.                                                    |
| **BcryptJS**               | Security           | Utilized for hashing user passwords before storage, ensuring sensitive data is protected against breaches.                                                                                 |
| **QR Code** (`qrcode`)     | Utility            | Generates unique QR codes for tickets. This allows for digital verification of bookings at event venues.                                                                                   |
| **Angular SSR**            | Frontend Rendering | Server-Side Rendering (SSR) is enabled to improve initial load performance and SEO for public-facing event pages.                                                                          |
| **Bootstrap 5**            | UI Framework       | ensuring a responsive and mobile-friendly design across all pages without writing extensive custom CSS.                                                                                    |
| **Ngrok**                  | Development Tool   | Required during development to expose the local server (webhook endpoint) to the Midtrans payment gateway for processing real-time payment notifications.                                  |

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

# Email Configuration (Google)
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_app_password      # Generate this in Google Account > Security

# Payment Gateway (Midtrans)
MIDTRANS_SERVER_KEY=your_midtrans_server_key
MIDTRANS_CLIENT_KEY=your_midtrans_client_key
MIDTRANS_IS_PRODUCTION=false
```

#### 3. Run the Application

You need to run the backend and frontend servers simultaneously.

**Start Backend:**

```bash
cd backend
npm start
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

#### 2. Event Discovery (User)

- **Browse Events:** The home page displays upcoming events. Use the search bar to filter by name.
- **Event Details:** Click any event card to view full details (Date, Time, Location, Description).
- **Seat Availability:** Real-time availability is shown. If sold out, a "Join Waitlist" option appears.

#### 3. Ticket Booking Flow

1.  Select an event and click "Buy Ticket".
2.  Choose ticket quantity and type.
3.  Proceed to payment (simulated or via Midtrans).
4.  **Confirmation:** Upon success, you will receive an email with your **QR Code Ticket**.
5.  **View Ticket:** Go to "My Bookings" to view or download your ticket.

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

#### 4. Notification Module

- **Triggers:**
  - **Welcome Email:** Sent upon registration.
  - **Booking Confirmation:** Contains unique QR Code.
  - **Payment Receipt:** Proof of transaction.
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
const app = express();
// Middleware Setup
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
// Route Registration
const { registerRoutes } = require('./routes');
registerRoutes(app);
```

**Proof:** `express` is imported and used to initialize the `app` instance, configure global middleware (JSON parsing, CORS), and register application routes.

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
});
```

**Snippet (Transaction):**

```javascript
// backend/controllers/bookingController.js
const session = await mongoose.startSession();
session.startTransaction();
try {
  // Operations on Event and Booking
  await event.save({ session });
  await booking.save({ session });
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
}
```

**Proof:** Mongoose is used to define strict schemas (like `User`) and manage ACID compliant transactions during critical operations like ticket booking.

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
```

**Proof:** The `nodemailer` library is instantiated with Gmail service credentials to create a transporter used for sending all system emails (welcome, confirmation, alerts).

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
// ...
const transaction = await snap.createTransaction(transactionParams);
```

**Proof:** The `midtrans-client` is initialized with server keys to generate Snap tokens, enabling the frontend to display the secure payment popup.

### 4.5. JWT (JSON Web Tokens)

**File:** `backend/controllers/authController.js`
**Role:** Stateless Authentication
**Snippet:**

```javascript
const { generateToken } = require('../middleware/auth');
// Inside login function
const token = generateToken(user);
res.json({ success: true, token });
```

**Proof:** Upon successful login, the server generates a signed JWT (via `generateToken` utility) which is returned to the client for authenticating subsequent requests.

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

### 4.8. Angular SSR

**File:** `src/main.server.ts`
**Role:** Server-Side Rendering Entry Point
**Snippet:**

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { config } from './app/app.config.server';
const bootstrap = (context: BootstrapContext) => bootstrapApplication(App, config, context);
export default bootstrap;
```

**Proof:** The presence of `main.server.ts` and the bootstrapping of the application with server-specific configuration confirms the implementation of Angular Server-Side Rendering.

### 4.9. Ngrok (Development Tunneling)

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
