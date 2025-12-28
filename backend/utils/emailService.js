/**
 * Email Service - Nodemailer with Gmail
 * Handles all email notifications for the EMS system
 */

const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  // Check if email is configured
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('⚠️ Email not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in .env');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
};

/**
 * Send welcome email to newly registered Event Organizer
 */
// Theme constants
const THEME = {
  colors: {
    primary: '#ffd700', // Yellow
    secondary: '#121212', // Dark Black
    accent: '#2d2d2d', // Dark Gray
    text: '#ffffff',
    textMuted: '#b0b0b0',
    bg: '#121212',
    contentBg: '#1e1e1e',
    success: '#ffd700',
    danger: '#ff4444',
  },
  styles: {
    font: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    container: 'max-width: 600px; margin: 0 auto; padding: 20px; background-color: #121212;',
    header:
      'background: #000000; color: #ffd700; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; border-bottom: 2px solid #ffd700;',
    content: 'background: #1e1e1e; padding: 30px; border-radius: 0 0 10px 10px; color: #ffffff;',
    card: 'background: #2d2d2d; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #444;',
    button:
      'display: inline-block; background: #ffd700; color: #000000; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: bold;',
    footer: 'text-align: center; color: #888; font-size: 12px; margin-top: 20px;',
  },
};

/**
 * Send welcome email to newly registered Event Organizer
 */
const sendWelcomeEmail = async (email, fullName, username, temporaryPassword) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.log('📧 [MOCK] Welcome email would be sent to:', email);
    return { success: true, mock: true };
  }

  const mailOptions = {
    from: `"EMS - Event Management System" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: '🎫 Welcome to Event Management System - Your Account is Ready!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: ${THEME.styles.font}; background-color: ${THEME.colors.bg}; margin: 0; padding: 0; }
          .container { ${THEME.styles.container} }
          .header { ${THEME.styles.header} }
          .content { ${THEME.styles.content} }
          .credentials { ${THEME.styles.card} border-left: 4px solid ${THEME.colors.primary}; }
          .btn { ${THEME.styles.button} }
          .footer { ${THEME.styles.footer} }
          h1, h2, h3 { color: ${THEME.colors.primary}; }
          p { color: ${THEME.colors.text}; }
          strong { color: ${THEME.colors.primary}; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎫 Welcome to EMS!</h1>
            <p style="color: #fff;">Event Management System</p>
          </div>
          <div class="content">
            <h2>Hello, ${fullName}!</h2>
            <p>Your Event Organizer account has been successfully created by the administrator.</p>
            
            <div class="credentials">
              <h3>📋 Your Login Credentials</h3>
              <p><strong>Username:</strong> ${username}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Temporary Password:</strong> <span style="color: #fff; background: #000; padding: 2px 6px; border-radius: 4px;">${temporaryPassword}</span></p>
            </div>
            
            <p style="color: ${THEME.colors.danger}">⚠️ <strong>Important:</strong> Please change your password after your first login for security.</p>
            
            <center>
              <a href="${process.env.FRONTEND_URL}/login" class="btn">Login Now</a>
            </center>
            
            <div class="footer">
              <p>This email was sent by EMS - Event Management System</p>
              <p>If you didn't expect this email, please contact support.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent to:', email);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send booking confirmation email with QR code
 */
const sendBookingConfirmation = async (email, fullName, bookingDetails, eventDetails) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.log('📧 [MOCK] Booking confirmation email would be sent to:', email);
    return { success: true, mock: true };
  }

  // Generate QR code URL using Google Charts API
  const qrData = encodeURIComponent(bookingDetails.qrCode || bookingDetails.id);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}&bgcolor=ffffff&color=000000`;

  const mailOptions = {
    from: `"EMS - Event Management System" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `🎟️ Booking Confirmed - ${eventDetails.title}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: ${THEME.styles.font}; background-color: ${
      THEME.colors.bg
    }; margin: 0; padding: 0; }
          .container { ${THEME.styles.container} }
          .header { ${THEME.styles.header} }
          .content { ${THEME.styles.content} }
          .ticket-card { ${THEME.styles.card} border: 2px dashed ${THEME.colors.primary}; }
          .qr-section { text-align: center; padding: 20px; background: #fff; border-radius: 8px; margin-top: 20px; }
          .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .detail-item { padding: 10px; background: #000; border-radius: 5px; color: #fff; }
          .security-box { background: #1a1a2e; border: 1px solid #e94560; border-radius: 8px; padding: 15px; margin-top: 20px; }
          .security-title { color: #e94560; margin: 0 0 10px 0; font-size: 14px; }
          .security-list { margin: 0; padding-left: 20px; font-size: 12px; color: #ccc; }
          .footer { ${THEME.styles.footer} }
          h1, h2, h3 { color: ${THEME.colors.primary}; }
          p { color: ${THEME.colors.text}; }
          .label { color: ${THEME.colors.textMuted}; font-size: 0.9em; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎟️ Booking Confirmed!</h1>
            <p style="color: #fff;">Your tickets are ready</p>
          </div>
          <div class="content">
            <h2>Hello, ${fullName}!</h2>
            <p>Thank you for your booking. Here are your ticket details:</p>
            
            <div class="ticket-card">
              <h3>📅 ${eventDetails.title}</h3>
              <div class="details-grid">
                <div class="detail-item">
                  <div class="label">Date</div>
                  <div>${eventDetails.date}</div>
                </div>
                <div class="detail-item">
                  <div class="label">Time</div>
                  <div>${eventDetails.time}</div>
                </div>
                <div class="detail-item">
                  <div class="label">Location</div>
                  <div>${eventDetails.location}</div>
                </div>
                <div class="detail-item">
                  <div class="label">Tickets</div>
                  <div>${bookingDetails.quantity}x ${bookingDetails.ticketType}</div>
                </div>
              </div>
              
              <div class="qr-section">
                <p style="color: #000; margin: 0 0 15px 0;"><strong>Your Entry QR Code</strong></p>
                <img src="${qrCodeUrl}" alt="QR Code" style="width: 200px; height: 200px; border: 2px solid #000; border-radius: 8px;" />
                <p style="color: #666; font-size: 12px; margin: 10px 0 0 0;"><strong>Booking ID:</strong> ${
                  bookingDetails.id
                }</p>
                <p style="color: #888; font-size: 11px; margin: 5px 0 0 0;"><em>Present this QR code at the venue entrance</em></p>
              </div>
              
              <p style="text-align: center; font-size: 20px; color: ${
                THEME.colors.primary
              }; margin-top: 20px;">
                <strong>Total Paid: $${bookingDetails.totalPrice.toFixed(2)}</strong>
              </p>
            </div>
            
            <!-- Security Tips Section -->
            <div class="security-box">
              <p class="security-title">🔒 SECURITY TIPS - Protect Yourself from Scams</p>
              <ul class="security-list">
                <li><strong>Never share</strong> your QR code with anyone except venue staff</li>
                <li>Official emails only come from <strong>${
                  process.env.GMAIL_USER || 'our official domain'
                }</strong></li>
                <li>We will <strong>never ask</strong> for your password or payment details via email</li>
                <li>Verify the event details match what you booked before attending</li>
                <li>Report suspicious emails to our support team immediately</li>
              </ul>
            </div>
            
            <div class="footer">
              <p>⚠️ Cancellation Policy: Bookings can be cancelled up to 7 days before the event.</p>
              <p>This email was sent by EMS - Event Management System</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Booking confirmation sent to:', email);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send booking confirmation:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send waitlist notification when tickets become available
 */
const sendWaitlistNotification = async (email, fullName, eventDetails, ticketType) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.log('📧 [MOCK] Waitlist notification would be sent to:', email);
    return { success: true, mock: true };
  }

  const mailOptions = {
    from: `"EMS - Event Management System" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `🔔 Tickets Available - ${eventDetails.title}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: ${THEME.styles.font}; background-color: ${THEME.colors.bg}; margin: 0; padding: 0; }
          .container { ${THEME.styles.container} }
          .header { ${THEME.styles.header} }
          .content { ${THEME.styles.content} }
          .alert-box { ${THEME.styles.card} border-left: 4px solid ${THEME.colors.primary}; background: #2d2d2d; }
          .btn { ${THEME.styles.button} }
          .footer { ${THEME.styles.footer} }
          h1, h2, h3 { color: ${THEME.colors.primary}; }
          p { color: ${THEME.colors.text}; }
          strong { color: ${THEME.colors.primary}; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 Great News!</h1>
            <p style="color: #fff;">Tickets are now available</p>
          </div>
          <div class="content">
            <h2>Hello, ${fullName}!</h2>
            <p>Tickets for <strong>${eventDetails.title}</strong> are now available!</p>
            
            <div class="alert-box">
              <p style="margin: 0;">⏰ <strong>Act fast!</strong> You have 24 hours to complete your purchase before your spot is given to the next person on the waitlist.</p>
            </div>
            
            <div style="background: #000; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Event:</strong> ${eventDetails.title}</p>
              <p style="margin: 5px 0;"><strong>Date:</strong> ${eventDetails.date}</p>
              <p style="margin: 5px 0;"><strong>Ticket Type:</strong> ${ticketType}</p>
            </div>
            
            <center>
              <a href="${process.env.FRONTEND_URL}/ticket/${eventDetails.id}" class="btn">Book Now</a>
            </center>
            
            <div class="footer">
              <p>This email was sent by EMS - Event Management System</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Waitlist notification sent to:', email);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send waitlist notification:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send waitlist join confirmation email
 */
const sendWaitlistJoinConfirmation = async (email, fullName, eventDetails, ticketType) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.log('📧 [MOCK] Waitlist join confirmation would be sent to:', email);
    return { success: true, mock: true };
  }

  const mailOptions = {
    from: `"EMS - Event Management System" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `📋 Waitlist Confirmation - ${eventDetails.title}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: ${THEME.styles.font}; background-color: ${THEME.colors.bg}; margin: 0; padding: 0; }
          .container { ${THEME.styles.container} }
          .header { ${THEME.styles.header} }
          .content { ${THEME.styles.content} }
          .info-box { ${THEME.styles.card} border-left: 4px solid ${THEME.colors.primary}; }
          .footer { ${THEME.styles.footer} }
          h1, h2, h3 { color: ${THEME.colors.primary}; }
          p { color: ${THEME.colors.text}; }
          strong { color: ${THEME.colors.primary}; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Waitlist Confirmed</h1>
            <p style="color: #fff;">You're on the list!</p>
          </div>
          <div class="content">
            <h2>Hello, ${fullName}!</h2>
            <p>You have been successfully added to the waitlist.</p>
            
            <div class="info-box">
              <p><strong>Event:</strong> ${eventDetails.title}</p>
              <p><strong>Date:</strong> ${eventDetails.date}</p>
              <p><strong>Ticket Type:</strong> ${ticketType}</p>
            </div>
            
            <p>📧 <strong>What happens next?</strong></p>
            <ul style="color: #ccc;">
              <li>We'll notify you immediately when tickets become available</li>
              <li>You'll have 24 hours to complete your purchase</li>
              <li>First come, first served - act fast when notified!</li>
            </ul>
            
            <div class="footer">
              <p>This email was sent by EMS - Event Management System</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Waitlist join confirmation sent to:', email);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send waitlist join confirmation:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send payment receipt with QR code
 */
const sendPaymentReceipt = async (
  email,
  fullName,
  paymentDetails,
  bookingDetails,
  eventDetails
) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.log('📧 [MOCK] Payment receipt would be sent to:', email);
    return { success: true, mock: true };
  }

  // Generate QR code URL
  const qrData = encodeURIComponent(bookingDetails.qrCode || bookingDetails.id);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${qrData}&bgcolor=ffffff&color=000000`;
  const signInUrl = `${process.env.FRONTEND_URL}/login`;

  const mailOptions = {
    from: `"EMS - Event Management System" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `💳 Payment Receipt - ${eventDetails.title}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: ${THEME.styles.font}; background-color: ${
      THEME.colors.bg
    }; margin: 0; padding: 0; }
          .container { ${THEME.styles.container} }
          .header { ${THEME.styles.header} }
          .content { ${THEME.styles.content} }
          .receipt { ${THEME.styles.card} }
          .receipt-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #444; }
          .total { font-size: 20px; color: ${
            THEME.colors.primary
          }; font-weight: bold; border-top: 2px solid ${
      THEME.colors.primary
    }; border-bottom: none; margin-top: 10px; padding-top: 20px; }
          .qr-section { text-align: center; padding: 20px; background: #fff; border-radius: 8px; margin-top: 20px; }
          .btn { ${THEME.styles.button} }
          .footer { ${THEME.styles.footer} }
          h1, h2, h3 { color: ${THEME.colors.primary}; }
          p { color: ${THEME.colors.text}; }
          span { color: ${THEME.colors.text}; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💳 Payment Receipt</h1>
            <p style="color: #fff;">Transaction Successful</p>
          </div>
          <div class="content">
            <h2>Thank you, ${fullName}!</h2>
            <p>Your payment has been processed successfully.</p>
            
            <div class="receipt">
              <h3 style="border-bottom: 1px solid #444; padding-bottom: 10px;">Receipt Details</h3>
              <div class="receipt-row">
                <span style="color: #aaa;">Order ID:</span>
                <span>${paymentDetails.orderId}</span>
              </div>
              <div class="receipt-row">
                <span style="color: #aaa;">Event:</span>
                <span>${eventDetails.title}</span>
              </div>
              <div class="receipt-row">
                <span style="color: #aaa;">Date:</span>
                <span>${eventDetails.date || 'TBA'}</span>
              </div>
              <div class="receipt-row">
                <span style="color: #aaa;">Time:</span>
                <span>${eventDetails.time || 'TBA'}</span>
              </div>
              <div class="receipt-row">
                <span style="color: #aaa;">Location:</span>
                <span>${eventDetails.location || 'TBA'}</span>
              </div>
              <div class="receipt-row">
                <span style="color: #aaa;">Tickets:</span>
                <span>${bookingDetails.quantity}x ${bookingDetails.ticketType}</span>
              </div>
              <div class="receipt-row">
                <span style="color: #aaa;">Payment Method:</span>
                <span>${paymentDetails.paymentType || 'N/A'}</span>
              </div>
              <div class="receipt-row total">
                <span>Total Amount:</span>
                <span>$${paymentDetails.grossAmount.toFixed(2)}</span>
              </div>
            </div>
            
            <!-- QR Code Section -->
            <div class="qr-section">
              <p style="color: #000; margin: 0 0 15px 0;"><strong>Your Entry QR Code</strong></p>
              <img src="${qrCodeUrl}" alt="QR Code" style="width: 180px; height: 180px; border: 2px solid #000; border-radius: 8px;" />
              <p style="color: #666; font-size: 12px; margin: 10px 0 0 0;"><strong>Booking ID:</strong> ${
                bookingDetails.id
              }</p>
              <p style="color: #888; font-size: 11px; margin: 5px 0 0 0;"><em>Present this QR code at the venue entrance</em></p>
            </div>
            
            <center>
              <a href="${signInUrl}" class="btn">Sign In to View Bookings</a>
            </center>
            
            <div class="footer">
              <p>This is your official payment receipt.</p>
              <p>This email was sent by EMS - Event Management System</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Payment receipt sent to:', email);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send payment receipt:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send cancellation confirmation
 */
const sendCancellationConfirmation = async (email, fullName, bookingDetails, eventDetails) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.log('📧 [MOCK] Cancellation confirmation would be sent to:', email);
    return { success: true, mock: true };
  }

  const mailOptions = {
    from: `"EMS - Event Management System" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `❌ Booking Cancelled - ${eventDetails.title}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: ${THEME.styles.font}; background-color: ${
      THEME.colors.bg
    }; margin: 0; padding: 0; }
          .container { ${THEME.styles.container} }
          .header { ${THEME.styles.header} border-bottom: 2px solid ${THEME.colors.danger}; }
          .content { ${THEME.styles.content} }
          .cancelled-box { ${THEME.styles.card} border-left: 4px solid ${THEME.colors.danger}; }
          .footer { ${THEME.styles.footer} }
          h1, h2, h3 { color: ${THEME.colors.danger}; }
          p { color: ${THEME.colors.text}; }
          strong { color: ${THEME.colors.primary}; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="color: ${THEME.colors.danger}">❌ Booking Cancelled</h1>
          </div>
          <div class="content">
            <h2>Hello, ${fullName}</h2>
            <p>Your booking has been successfully cancelled.</p>
            
            <div class="cancelled-box">
              <p><strong>Booking ID:</strong> ${bookingDetails.id}</p>
              <p><strong>Event:</strong> ${eventDetails.title}</p>
              <p><strong>Tickets:</strong> ${bookingDetails.quantity}x ${
      bookingDetails.ticketType
    }</p>
              <p><strong>Refund Amount:</strong> <span style="color: #fff;">$${bookingDetails.totalPrice.toFixed(
                2
              )}</span></p>
            </div>
            
            <p>Your refund will be processed within 5-7 business days.</p>
            
            <div class="footer">
              <p>This email was sent by EMS - Event Management System</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Cancellation confirmation sent to:', email);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send cancellation confirmation:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send pending payment notification - reminds user to complete purchase
 */
const sendPendingPaymentNotification = async (
  email,
  fullName,
  bookingDetails,
  eventDetails,
  paymentUrl
) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.log('📧 [MOCK] Pending payment notification would be sent to:', email);
    return { success: true, mock: true };
  }

  // Use frontend URL if paymentUrl not provided
  const completePaymentUrl = paymentUrl || `${process.env.FRONTEND_URL}/bookings`;

  const mailOptions = {
    from: `"EMS - Event Management System" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `⏳ Complete Your Payment - ${eventDetails.title}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: ${THEME.styles.font}; background-color: ${
      THEME.colors.bg
    }; margin: 0; padding: 0; }
          .container { ${THEME.styles.container} }
          .header { background: #000000; color: #ff9800; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; border-bottom: 2px solid #ff9800; }
          .content { ${THEME.styles.content} }
          .warning-box { ${THEME.styles.card} border-left: 4px solid #ff9800; background: #2d2d2d; }
          .booking-info { ${THEME.styles.card} }
          .btn { display: inline-block; background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: #000; padding: 15px 40px; text-decoration: none; border-radius: 8px; margin-top: 20px; font-weight: bold; font-size: 16px; }
          .btn:hover { opacity: 0.9; }
          .security-box { background: #1a1a2e; border: 1px solid #e94560; border-radius: 8px; padding: 15px; margin-top: 20px; }
          .security-title { color: #e94560; margin: 0 0 10px 0; font-size: 14px; }
          .security-list { margin: 0; padding-left: 20px; font-size: 12px; color: #ccc; }
          .footer { ${THEME.styles.footer} }
          h1, h2, h3 { color: #ff9800; }
          p { color: ${THEME.colors.text}; }
          strong { color: #ff9800; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏳ Payment Pending</h1>
            <p style="color: #fff;">Complete your purchase to secure your tickets</p>
          </div>
          <div class="content">
            <h2>Hello, ${fullName}!</h2>
            <p>Your booking is currently <strong>awaiting payment</strong>. Please complete the payment to confirm your tickets.</p>
            
            <div class="warning-box">
              <p style="margin: 0;">⏰ <strong>Important:</strong> Your tickets are reserved for a limited time. Complete payment soon to avoid losing your booking.</p>
            </div>
            
            <div class="booking-info">
              <h3>📋 Booking Details</h3>
              <p><strong>Event:</strong> ${eventDetails.title}</p>
              <p><strong>Date:</strong> ${eventDetails.date}</p>
              <p><strong>Time:</strong> ${eventDetails.time}</p>
              <p><strong>Tickets:</strong> ${bookingDetails.quantity}x ${
      bookingDetails.ticketType
    }</p>
              <p style="font-size: 18px; color: #ff9800;"><strong>Amount Due: $${bookingDetails.totalPrice.toFixed(
                2
              )}</strong></p>
            </div>
            
            <center>
              <a href="${completePaymentUrl}" class="btn">Complete Payment Now</a>
            </center>
            
            <!-- Security Tips Section -->
            <div class="security-box">
              <p class="security-title">🔒 SECURITY REMINDER</p>
              <ul class="security-list">
                <li>Only complete payments through our <strong>official website</strong></li>
                <li>Check the URL starts with <strong>${
                  process.env.FRONTEND_URL || 'https://'
                }</strong></li>
                <li>We will <strong>never ask</strong> for your full card details via email</li>
                <li>If you didn't make this booking, please ignore this email</li>
                <li>Contact support if you receive suspicious payment requests</li>
              </ul>
            </div>
            
            <div class="footer">
              <p>If you've already completed payment, please disregard this email.</p>
              <p>This email was sent by EMS - Event Management System</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Pending payment notification sent to:', email);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send pending payment notification:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send event date approaching notification to waitlisted users
 */
const sendEventDateApproachingNotification = async (
  email,
  fullName,
  eventDetails,
  daysUntilEvent
) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.log('📧 [MOCK] Event approaching notification would be sent to:', email);
    return { success: true, mock: true };
  }

  const mailOptions = {
    from: `"EMS - Event Management System" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `⏰ Event Reminder - ${eventDetails.title} is in ${daysUntilEvent} day(s)!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: ${THEME.styles.font}; background-color: ${
      THEME.colors.bg
    }; margin: 0; padding: 0; }
          .container { ${THEME.styles.container} }
          .header { background: #000000; color: #ff9800; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; border-bottom: 2px solid #ff9800; }
          .content { ${THEME.styles.content} }
          .alert-box { ${THEME.styles.card} border-left: 4px solid #ff9800; background: #2d2d2d; }
          .btn { ${THEME.styles.button} background: #ff9800; }
          .footer { ${THEME.styles.footer} }
          h1, h2, h3 { color: #ff9800; }
          p { color: ${THEME.colors.text}; }
          strong { color: #ff9800; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Event Reminder</h1>
            <p style="color: #fff;">The event is approaching!</p>
          </div>
          <div class="content">
            <h2>Hello, ${fullName}!</h2>
            <p>This is a reminder that <strong>${
              eventDetails.title
            }</strong> is happening in <strong>${daysUntilEvent} day(s)</strong>!</p>
            
            <div class="alert-box">
              <p style="margin: 0;">📋 <strong>You are on the waitlist</strong> for this event. Tickets may become available if other attendees cancel their bookings.</p>
            </div>
            
            <div style="background: #000; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Event:</strong> ${eventDetails.title}</p>
              <p style="margin: 5px 0;"><strong>Date:</strong> ${eventDetails.date}</p>
              <p style="margin: 5px 0;"><strong>Time:</strong> ${eventDetails.time || 'TBA'}</p>
              <p style="margin: 5px 0;"><strong>Location:</strong> ${
                eventDetails.location || 'TBA'
              }</p>
            </div>
            
            <p>We recommend checking the event page regularly for ticket availability. If tickets become available, you will be notified immediately!</p>
            
            <center>
              <a href="${process.env.FRONTEND_URL}/ticket/${
      eventDetails.id
    }" class="btn">Check Availability</a>
            </center>
            
            <div class="footer">
              <p>You received this because you are on the waitlist for this event.</p>
              <p>This email was sent by EMS - Event Management System</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Event approaching notification sent to:', email);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send event approaching notification:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendWelcomeEmail,
  sendBookingConfirmation,
  sendWaitlistNotification,
  sendWaitlistJoinConfirmation,
  sendPaymentReceipt,
  sendCancellationConfirmation,
  sendPendingPaymentNotification,
  sendEventDateApproachingNotification,
};
