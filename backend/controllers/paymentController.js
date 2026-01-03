// Payment Controller - Handles Midtrans integration (MYR to IDR conversion)

const midtransClient = require('midtrans-client');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const User = require('../models/User');
const { generateOrderId } = require('../utils/helpers');
const { sendBookingConfirmation, sendPaymentReceipt } = require('../utils/emailService');

// Currency conversion rate: MYR to IDR
// This is an approximate rate. For production, consider using a real-time API
const MYR_TO_IDR_RATE = 3500;

// Convert MYR to IDR for Midtrans
const convertMYRToIDR = (amountMYR) => {
  return Math.round(amountMYR * MYR_TO_IDR_RATE);
};

// Convert IDR to MYR (for display)
const convertIDRToMYR = (amountIDR) => {
  return amountIDR / MYR_TO_IDR_RATE;
};

// Initialize Midtrans Snap
const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

// Initialize Midtrans Core API for status check
const coreApi = new midtransClient.CoreApi({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

// POST /api/payments/create - Create payment (get Snap token)
exports.createPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const userId = req.userId;

    // Get booking
    const booking = await Booking.findById(bookingId).populate(
      'eventId',
      'title date time location tickets'
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check authorization
    if (booking.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    // Check if already paid
    if (booking.paymentStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Booking already paid',
      });
    }

    // Check for existing pending payment
    const existingPayment = await Payment.findOne({
      bookingId: booking._id,
      transactionStatus: 'pending',
    });

    if (existingPayment && existingPayment.snapToken) {
      // Return existing payment instead of creating duplicate
      return res.json({
        success: true,
        message: 'Existing payment found',
        payment: {
          orderId: existingPayment.orderId,
          snapToken: existingPayment.snapToken,
          snapRedirectUrl: existingPayment.snapRedirectUrl,
          grossAmount: booking.totalPrice,
          clientKey: process.env.MIDTRANS_CLIENT_KEY,
        },
        existing: true,
      });
    }

    // Get user
    const user = await User.findById(userId);

    // Get event and ticket details
    const event = booking.eventId;
    const ticketType =
      event.tickets.find((t) => t.id === booking.ticketCategoryId)?.type || 'Standard';

    // Generate unique order ID
    const orderId = generateOrderId();

    // Convert MYR to IDR for Midtrans (Midtrans only accepts IDR)
    const grossAmountIDR = convertMYRToIDR(booking.totalPrice);
    const pricePerTicketIDR = convertMYRToIDR(booking.pricePerTicket);

    // Create Midtrans transaction with IDR amounts
    const transactionParams = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmountIDR,
      },
      item_details: [
        {
          id: booking.ticketCategoryId,
          price: pricePerTicketIDR,
          quantity: booking.quantity,
          name: `${event.title} - ${ticketType} Ticket`,
        },
      ],
      customer_details: {
        first_name: user.fullName.split(' ')[0],
        last_name: user.fullName.split(' ').slice(1).join(' ') || '',
        email: user.email,
        phone: user.phone || '',
      },
      callbacks: {
        finish: `${process.env.FRONTEND_URL}/my-bookings?payment=success`,
        error: `${process.env.FRONTEND_URL}/my-bookings?payment=error`,
        pending: `${process.env.FRONTEND_URL}/my-bookings?payment=pending`,
      },
    };

    // Get Snap token from Midtrans
    const transaction = await snap.createTransaction(transactionParams);

    // Save payment record
    const payment = new Payment({
      bookingId: booking._id,
      userId: userId,
      orderId: orderId,
      grossAmount: booking.totalPrice,
      snapToken: transaction.token,
      snapRedirectUrl: transaction.redirect_url,
      transactionStatus: 'pending',
    });

    await payment.save();

    // Update booking with payment reference
    booking.paymentId = payment._id;
    await booking.save();

    res.json({
      success: true,
      message: 'Payment created',
      payment: {
        orderId: orderId,
        snapToken: transaction.token,
        snapRedirectUrl: transaction.redirect_url,
        grossAmount: booking.totalPrice,
        clientKey: process.env.MIDTRANS_CLIENT_KEY,
      },
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment',
      error: error.message,
    });
  }
};

// POST /api/payments/notification - Handle Midtrans webhook
exports.handleNotification = async (req, res) => {
  try {
    const notificationJson = req.body;

    // Verify notification (Midtrans signature)
    const statusResponse = await coreApi.transaction.notification(notificationJson);

    const orderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    console.log(
      `Payment notification received - OrderID: ${orderId}, Status: ${transactionStatus}`
    );

    // Find payment by order ID
    const payment = await Payment.findOne({ orderId });

    if (!payment) {
      console.error('Payment not found for order:', orderId);
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    // Update payment from notification
    await payment.updateFromNotification(statusResponse);

    // Get booking
    const booking = await Booking.findById(payment.bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Handle different transaction statuses
    if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
      // Payment successful
      if (fraudStatus === 'accept' || !fraudStatus) {
        booking.status = 'confirmed';
        booking.paymentStatus = 'completed';
        booking.paymentMethod = statusResponse.payment_type;
        await booking.save();

        // Send confirmation emails only if not already sent
        if (!payment.emailSent) {
          const user = await User.findById(booking.userId);
          const event = await Event.findById(booking.eventId);

          if (user && event) {
            const ticketType =
              event.tickets.find((t) => t.id === booking.ticketCategoryId)?.type || 'Standard';

            // Send payment receipt with QR code (includes everything needed)
            await sendPaymentReceipt(
              user.email,
              user.fullName,
              {
                orderId: payment.orderId,
                paymentType: statusResponse.payment_type,
                grossAmount: payment.grossAmount,
              },
              {
                id: booking._id,
                quantity: booking.quantity,
                ticketType,
                qrCode: booking.qrCode,
              },
              {
                title: event.title,
                date: event.date,
                time: event.time,
                location: event.location,
              }
            );

            // Mark email as sent to prevent duplicates
            payment.emailSent = true;
            await payment.save();
          }
        }
      }
    } else if (
      transactionStatus === 'deny' ||
      transactionStatus === 'cancel' ||
      transactionStatus === 'expire'
    ) {
      // Payment failed - restore ticket count
      booking.status = 'cancelled';
      booking.paymentStatus = 'failed';
      await booking.save();

      // Restore tickets
      const event = await Event.findById(booking.eventId);
      if (event) {
        const ticketIndex = event.tickets.findIndex((t) => t.id === booking.ticketCategoryId);
        if (ticketIndex !== -1) {
          event.tickets[ticketIndex].sold = Math.max(
            0,
            event.tickets[ticketIndex].sold - booking.quantity
          );
          await event.save();
        }
      }
    } else if (transactionStatus === 'pending') {
      booking.paymentStatus = 'pending';
      await booking.save();
    }

    res.status(200).json({
      success: true,
      message: 'Notification handled',
    });
  } catch (error) {
    console.error('Handle notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to handle notification',
      error: error.message,
    });
  }
};

// GET /api/payments/:orderId/status - Get payment status
exports.getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const payment = await Payment.findOne({ orderId }).populate('bookingId');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    // Check authorization
    if (payment.userId.toString() !== req.userId.toString() && req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    res.json({
      success: true,
      payment: {
        orderId: payment.orderId,
        transactionStatus: payment.transactionStatus,
        paymentType: payment.paymentType,
        grossAmount: payment.grossAmount,
        transactionTime: payment.transactionTime,
        booking: payment.bookingId,
      },
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment status',
      error: error.message,
    });
  }
};

// GET /api/payments/:orderId/check - Check transaction from Midtrans (for localhost dev)
exports.checkTransaction = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Get status from Midtrans
    const statusResponse = await coreApi.transaction.status(orderId);
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    console.log(`Payment check - OrderID: ${orderId}, Status: ${transactionStatus}`);

    // Update local payment record
    const payment = await Payment.findOne({ orderId });
    if (payment) {
      await payment.updateFromNotification(statusResponse);

      // Also update the booking status (same logic as webhook handler)
      const booking = await Booking.findById(payment.bookingId);
      if (booking) {
        if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
          // Payment successful
          if (fraudStatus === 'accept' || !fraudStatus) {
            booking.status = 'confirmed';
            booking.paymentStatus = 'completed';
            booking.paymentMethod = statusResponse.payment_type;
            await booking.save();
            console.log(`Booking ${booking._id} updated to confirmed`);

            // Send confirmation emails only if not already sent
            if (!payment.emailSent) {
              const user = await User.findById(booking.userId);
              const event = await Event.findById(booking.eventId);

              if (user && event) {
                const ticketType =
                  event.tickets.find((t) => t.id === booking.ticketCategoryId)?.type || 'Standard';

                // Send payment receipt with QR code (includes everything needed)
                await sendPaymentReceipt(
                  user.email,
                  user.fullName,
                  {
                    orderId: payment.orderId,
                    paymentType: statusResponse.payment_type,
                    grossAmount: payment.grossAmount,
                  },
                  {
                    id: booking._id,
                    quantity: booking.quantity,
                    ticketType,
                    qrCode: booking.qrCode,
                  },
                  {
                    title: event.title,
                    date: event.date,
                    time: event.time,
                    location: event.location,
                  }
                );

                // Mark email as sent to prevent duplicates
                payment.emailSent = true;
                await payment.save();
              }
            }
          }
        } else if (
          transactionStatus === 'deny' ||
          transactionStatus === 'cancel' ||
          transactionStatus === 'expire'
        ) {
          // Payment failed - restore ticket count
          booking.status = 'cancelled';
          booking.paymentStatus = 'failed';
          await booking.save();

          // Restore tickets
          const event = await Event.findById(booking.eventId);
          if (event) {
            const ticketIndex = event.tickets.findIndex((t) => t.id === booking.ticketCategoryId);
            if (ticketIndex !== -1) {
              event.tickets[ticketIndex].sold = Math.max(
                0,
                event.tickets[ticketIndex].sold - booking.quantity
              );
              await event.save();
            }
          }
        } else if (transactionStatus === 'pending') {
          booking.paymentStatus = 'pending';
          await booking.save();
        }
      }
    }

    res.json({
      success: true,
      status: statusResponse,
    });
  } catch (error) {
    console.error('Check transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check transaction',
      error: error.message,
    });
  }
};

// GET /api/payments/client-key - Get Midtrans client key
exports.getClientKey = async (req, res) => {
  res.json({
    success: true,
    clientKey: process.env.MIDTRANS_CLIENT_KEY,
  });
};

// POST /api/payments/mock-complete - Mock payment (dev only)
exports.mockCompletePayment = async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      message: 'Mock payment not allowed in production',
    });
  }

  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Directly update booking as paid
    booking.status = 'confirmed';
    booking.paymentStatus = 'completed';
    booking.paymentMethod = 'mock_payment';
    await booking.save();

    // Send confirmation email
    const user = await User.findById(booking.userId);
    const event = await Event.findById(booking.eventId);

    if (user && event) {
      const ticketType =
        event.tickets.find((t) => t.id === booking.ticketCategoryId)?.type || 'Standard';

      // Use sendPaymentReceipt (includes QR code + event details) instead of sendBookingConfirmation
      await sendPaymentReceipt(
        user.email,
        user.fullName,
        {
          orderId: `MOCK-${booking._id}`,
          paymentType: 'mock_payment',
          grossAmount: booking.totalPrice,
        },
        {
          id: booking._id,
          quantity: booking.quantity,
          ticketType,
          qrCode: booking.qrCode,
        },
        {
          title: event.title,
          date: event.date,
          time: event.time,
          location: event.location,
        }
      );
    }

    res.json({
      success: true,
      message: 'Mock payment completed',
      booking,
    });
  } catch (error) {
    console.error('Mock payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete mock payment',
      error: error.message,
    });
  }
};
