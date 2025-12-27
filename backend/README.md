# EMS Backend - Event Management System API

A complete Node.js/Express backend for the Event Management System (EMS) ticketing application. Built with MongoDB, Express.js, JWT authentication, Midtrans payment integration, and Nodemailer for email notifications.

## 📋 Features

- **Authentication System** (JWT-based)

  - User registration/login
  - Admin registers Event Organizers
  - Role-based access control (admin, eo, user)
  - Password change on first login

- **Event Management**

  - CRUD operations for events
  - Ticket category configuration
  - Promotional codes/discounts
  - Seating layout management

- **Booking System**

  - Atomic ticket booking with MongoDB transactions
  - Real-time seat availability
  - QR code generation for tickets
  - Booking cancellation (7-day policy)
  - Check-in validation

- **Payment Integration** (Midtrans Sandbox)

  - Snap payment gateway
  - Payment status webhooks
  - Mock payment for development

- **Waitlist Management**

  - Join waitlist for sold-out events
  - Automatic email notification when available

- **Analytics & Reports**

  - Event revenue/sales analytics
  - Occupancy reports
  - MongoDB Aggregation for complex queries
  - Daily/weekly/monthly breakdowns

- **Email Notifications** (Gmail/Nodemailer)
  - Welcome email for new EOs
  - Booking confirmation with QR
  - Payment receipts
  - Waitlist notifications
  - Cancellation confirmations

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- MongoDB Atlas account (free tier works)
- Gmail account with App Password
- Midtrans Sandbox account

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Copy the example env file and configure:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ems_db

# JWT Secret (change this!)
JWT_SECRET=your_super_secret_key_here

# Gmail (for email notifications)
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_16_char_app_password

# Midtrans Sandbox
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxx
MIDTRANS_IS_PRODUCTION=false

# Frontend URL
FRONTEND_URL=http://localhost:4200
```

### 3. Setup MongoDB Atlas

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free M0 tier)
3. Go to Database Access → Add a database user
4. Go to Network Access → Add your IP address (or 0.0.0.0/0 for development)
5. Go to Database → Connect → Drivers → Copy connection string
6. Replace `<password>` in connection string and paste in `.env`

### 4. Setup Gmail App Password

1. Enable 2-Factor Authentication on your Gmail account
2. Go to Google Account → Security → 2-Step Verification → App passwords
3. Generate a new password for "Mail"
4. Copy the 16-character password to `.env`

### 5. Setup Midtrans Sandbox

1. Create account at [Midtrans Sandbox Dashboard](https://dashboard.sandbox.midtrans.com)
2. Go to Settings → Access Keys
3. Copy Server Key and Client Key to `.env`

### 6. Seed the Database

Populate initial data:

```bash
npm run seed
```

This creates:

- Admin user: `admin@auditorium.com` / `adminpass123`
- EO 1: `jane@events.com` / `eopass123`
- EO 2: `bob@events.com` / `eopass456`
- User: `john@example.com` / `password123`
- 5 sample events with tickets

### 7. Start the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server runs at: `http://localhost:5000`

## 📚 API Documentation

### Authentication

| Method | Endpoint                    | Description       | Auth   |
| ------ | --------------------------- | ----------------- | ------ |
| POST   | `/api/auth/register`        | Register new user | Public |
| POST   | `/api/auth/login`           | Login             | Public |
| POST   | `/api/auth/register-eo`     | Register EO       | Admin  |
| POST   | `/api/auth/change-password` | Change password   | Auth   |
| GET    | `/api/auth/me`              | Get current user  | Auth   |

### Events

| Method | Endpoint                     | Description     | Auth     |
| ------ | ---------------------------- | --------------- | -------- |
| GET    | `/api/events`                | Get all events  | Public   |
| GET    | `/api/events/:id`            | Get event by ID | Public   |
| POST   | `/api/events`                | Create event    | EO/Admin |
| PUT    | `/api/events/:id`            | Update event    | EO/Admin |
| DELETE | `/api/events/:id`            | Delete event    | EO/Admin |
| POST   | `/api/events/:id/promo`      | Add promo code  | EO/Admin |
| POST   | `/api/events/validate-promo` | Validate promo  | Public   |

### Bookings

| Method | Endpoint                     | Description     | Auth     |
| ------ | ---------------------------- | --------------- | -------- |
| POST   | `/api/bookings`              | Create booking  | User     |
| GET    | `/api/bookings/:id`          | Get booking     | Auth     |
| GET    | `/api/bookings/user/:userId` | User's bookings | Auth     |
| POST   | `/api/bookings/:id/cancel`   | Cancel booking  | Auth     |
| POST   | `/api/bookings/:id/checkin`  | Check-in        | EO/Admin |

### Payments

| Method | Endpoint                        | Description        | Auth   |
| ------ | ------------------------------- | ------------------ | ------ |
| POST   | `/api/payments/create`          | Create payment     | User   |
| POST   | `/api/payments/notification`    | Midtrans webhook   | Public |
| GET    | `/api/payments/:orderId/status` | Get status         | Auth   |
| POST   | `/api/payments/mock-complete`   | Mock payment (dev) | Auth   |

### Waitlist

| Method | Endpoint                        | Description     | Auth     |
| ------ | ------------------------------- | --------------- | -------- |
| POST   | `/api/waitlist`                 | Join waitlist   | User     |
| DELETE | `/api/waitlist/:id`             | Leave waitlist  | User     |
| GET    | `/api/waitlist/user/:userId`    | User's waitlist | Auth     |
| POST   | `/api/waitlist/notify/:eventId` | Notify waitlist | EO/Admin |

### Analytics

| Method | Endpoint                        | Description      | Auth     |
| ------ | ------------------------------- | ---------------- | -------- |
| GET    | `/api/analytics/event/:eventId` | Event analytics  | EO/Admin |
| GET    | `/api/analytics/auditorium`     | Auditorium stats | Admin    |
| GET    | `/api/analytics/revenue`        | Revenue report   | EO/Admin |
| GET    | `/api/analytics/occupancy`      | Occupancy report | EO/Admin |
| GET    | `/api/analytics/sales`          | Sales report     | EO/Admin |

## 🔒 Authentication

All protected routes require a Bearer token:

```http
Authorization: Bearer <jwt_token>
```

Get token from login response:

```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'email@example.com', password: 'pass' }),
});
const { token } = await response.json();
```

## 💳 Payment Flow

1. User creates booking → `POST /api/bookings`
2. Get Snap token → `POST /api/payments/create`
3. Show Midtrans Snap popup in frontend
4. User completes payment
5. Midtrans sends webhook → `POST /api/payments/notification`
6. Booking status updated, email sent

## 📁 Project Structure

```
backend/
├── config/
│   └── db.js              # MongoDB connection
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   ├── eventController.js
│   ├── bookingController.js
│   ├── waitlistController.js
│   ├── paymentController.js
│   └── analyticsController.js
├── middleware/
│   ├── auth.js            # JWT authentication
│   └── errorHandler.js
├── models/
│   ├── User.js
│   ├── Event.js
│   ├── Booking.js
│   ├── Waitlist.js
│   └── Payment.js
├── routes/
│   ├── auth.js
│   ├── users.js
│   ├── events.js
│   ├── bookings.js
│   ├── waitlist.js
│   ├── payments.js
│   └── analytics.js
├── seed/
│   └── seedData.js        # Database seeder
├── utils/
│   ├── emailService.js    # Nodemailer/Gmail
│   ├── qrGenerator.js     # QR code generation
│   └── helpers.js
├── .env.example
├── package.json
├── README.md
└── server.js              # Entry point
```

## 🧪 Testing

Use Postman or curl to test endpoints:

```bash
# Health check
curl http://localhost:5000/api/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@auditorium.com","password":"adminpass123"}'

# Get events
curl http://localhost:5000/api/events
```

## 📧 Email Testing

If Gmail is not configured, emails are mocked and logged to console. Configure Gmail App Password for real email sending.

## 🎯 Marking Scheme Alignment

| Criteria                | Implementation                                                           |
| ----------------------- | ------------------------------------------------------------------------ |
| **MongoDB (35M)**       | Full CRUD, Aggregation Pipeline for analytics, Transactions for bookings |
| **Express/Node (30M)**  | Complete REST API, JWT auth, Middleware, Error handling                  |
| **Notification Plugin** | Nodemailer with Gmail (Google Plugin requirement)                        |

## 📄 License

MIT
