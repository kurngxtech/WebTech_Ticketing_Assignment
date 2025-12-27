# EMS - Event Management System: Production Deployment Guide

## Prerequisites

- Node.js v18+
- MongoDB Atlas account (or local MongoDB)
- Midtrans account (payment gateway)
- Gmail account with App Password enabled

---

## 1. Installation

```bash
# Clone repository
git clone <repo-url>
cd ticket

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
```

---

## 2. Environment Configuration

Create `backend/.env`:

```env
# Database
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/ems?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your-super-secret-key-min-32-characters
JWT_EXPIRES_IN=7d

# Midtrans Payment Gateway
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxx  # Use production key for prod
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxx
MIDTRANS_IS_PRODUCTION=false  # Set to true for production

# Email (Gmail with App Password)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx

# URLs
FRONTEND_URL=http://localhost:4200  # Update for production
PORT=5000
NODE_ENV=development  # Set to 'production' for prod
```

---

## 3. Development Mode

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd ..
ng serve
```

Access at: `http://localhost:4200`

---

## 4. Production Build

### Frontend

```bash
ng build --configuration=production
```

Output: `dist/ticket/browser/` folder

### Backend

```bash
cd backend
NODE_ENV=production node server.js
```

---

## 5. Deployment Options

### Frontend Hosting

- **Vercel**: `npx vercel --prod`
- **Netlify**: Drag & drop `dist/ticket/browser/`
- **Firebase Hosting**: `firebase deploy`

### Backend Hosting

- **Railway**: Push to Git, auto-deploy
- **Render**: Connect repo, set env vars
- **Heroku**: `git push heroku main`
- **AWS/GCP/Azure**: Use VM or container service

---

## 6. Security Checklist

- [ ] Use HTTPS for all connections
- [ ] Set strong JWT_SECRET (32+ random chars)
- [ ] Configure MongoDB Atlas Network Access (IP whitelist)
- [ ] Never commit `.env` file
- [ ] Set CORS to only allow your frontend domain
- [ ] Enable rate limiting on API
- [ ] Validate all user inputs server-side

---

## 7. Post-Deployment Verification

| Feature             | Test                               |
| ------------------- | ---------------------------------- |
| User Registration   | Create new account                 |
| User Login          | Login with credentials             |
| Event Creation (EO) | Create event with tickets          |
| Event Browsing      | View events on home page           |
| Ticket Purchase     | Complete payment via Midtrans      |
| Payment Receipt     | Check email for receipt            |
| My Bookings         | View bookings with QR code         |
| Check-in (Admin)    | Scan QR code                       |
| Waitlist            | Join waitlist for sold-out tickets |

---

## 8. Technology Stack

| Layer    | Technology                        |
| -------- | --------------------------------- |
| Frontend | Angular 18, TypeScript, Bootstrap |
| Backend  | Node.js, Express.js               |
| Database | MongoDB Atlas                     |
| Payment  | Midtrans                          |
| Email    | Nodemailer + Gmail                |
| Auth     | JWT                               |
| QR Code  | qrcode (npm)                      |
| PDF      | jsPDF                             |
