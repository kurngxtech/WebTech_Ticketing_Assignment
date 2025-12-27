/**
 * Booking Controller
 * Handles ticket booking, cancellation, and check-in
 */

const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const User = require('../models/User');
const Waitlist = require('../models/Waitlist');
const { generateQRData } = require('../utils/qrGenerator');
const {
  sendBookingConfirmation,
  sendCancellationConfirmation,
  sendWaitlistNotification,
} = require('../utils/emailService');

/**
 * Create booking
 * POST /api/bookings
 */
exports.createBooking = async (req, res) => {
  // Start a session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { eventId, ticketCategoryId, quantity, promoCode, selectedSeats } = req.body;
    const userId = req.userId;

    // Get event with session
    const event = await Event.findById(eventId).session(session);

    if (!event) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Find ticket category
    const ticketIndex = event.tickets.findIndex((t) => t.id === ticketCategoryId);
    if (ticketIndex === -1) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Ticket category not found',
      });
    }

    const ticket = event.tickets[ticketIndex];
    const remaining = ticket.total - ticket.sold;

    // Check availability
    if (remaining < quantity) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: remaining === 0 ? 'Ticket sold out' : `Only ${remaining} tickets remaining`,
      });
    }

    // Calculate price
    let discountPercentage = 0;
    if (promoCode) {
      const promoResult = event.validatePromoCode(promoCode);
      if (promoResult.valid) {
        discountPercentage = promoResult.discountPercentage;

        // Increment promo code usage
        const promoIndex = event.promotionalCodes.findIndex(
          (p) => p.code === promoCode.toUpperCase()
        );
        if (promoIndex !== -1) {
          event.promotionalCodes[promoIndex].usedCount += 1;
        }
      }
    }

    const pricePerTicket = ticket.price;
    const discountAmount = (pricePerTicket * quantity * discountPercentage) / 100;
    const totalPrice = pricePerTicket * quantity - discountAmount;

    // Create booking
    const booking = new Booking({
      eventId,
      userId,
      ticketCategoryId,
      quantity,
      pricePerTicket,
      totalPrice,
      discountApplied: discountPercentage,
      promoCodeUsed: promoCode || null,
      selectedSeats: selectedSeats || [],
      status: 'pending',
      paymentStatus: 'pending',
    });

    // Generate QR code
    booking.qrCode = generateQRData(booking, event);

    // Atomically update ticket sold count
    event.tickets[ticketIndex].sold += quantity;
    await event.save({ session });

    await booking.save({ session });

    // Commit transaction
    await session.commitTransaction();

    // Get user info for email
    const user = await User.findById(userId);

    // Return booking with event details
    const bookingResponse = {
      id: booking._id,
      eventId: event._id,
      ticketCategoryId,
      ticketType: ticket.type,
      quantity,
      pricePerTicket,
      totalPrice,
      discountApplied: discountPercentage,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      qrCode: booking.qrCode,
      bookingDate: booking.bookingDate,
      selectedSeats: booking.selectedSeats,
    };

    res.status(201).json({
      success: true,
      message: 'Booking created successfully. Please complete payment.',
      booking: bookingResponse,
      remaining: ticket.total - ticket.sold,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

/**
 * Get bookings by user
 * GET /api/bookings/user/:userId
 */
exports.getBookingsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Users can only view their own bookings, admin can view all
    if (req.userId.toString() !== userId && req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these bookings',
      });
    }

    const bookings = await Booking.find({ userId })
      .populate('eventId', 'title date time location img tickets')
      .sort({ bookingDate: -1 });

    // Fetch payments associated with these bookings to get orderId
    const Payment = require('../models/Payment');
    const bookingIds = bookings.map((b) => b._id);
    const payments = await Payment.find({ bookingId: { $in: bookingIds } });

    // Create map for quick lookup: bookingId -> payment
    const paymentMap = {};
    payments.forEach((p) => {
      paymentMap[p.bookingId.toString()] = p;
    });

    console.log(`Found ${payments.length} payments for ${bookings.length} bookings`);

    // Enhance booking data with event details and payment info
    const enhancedBookings = bookings.map((booking) => {
      const event = booking.eventId;
      const ticketCategory = event?.tickets?.find((t) => t.id === booking.ticketCategoryId);
      const payment = paymentMap[booking._id.toString()];

      if (booking.status === 'pending') {
        console.log(
          `Booking ${booking._id} is pending. Has payment? ${!!payment}, OrderId: ${
            payment?.orderId
          }`
        );
      }

      return {
        id: booking._id,
        eventId: event?._id,
        eventTitle: event?.title,
        eventDate: event?.date,
        eventTime: event?.time,
        eventLocation: event?.location,
        eventImg: event?.img,
        ticketType: ticketCategory?.type || 'Standard',
        quantity: booking.quantity,
        pricePerTicket: booking.pricePerTicket,
        totalPrice: booking.totalPrice,
        discountApplied: booking.discountApplied,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        paymentOrderId: payment ? payment.orderId : null, // Include orderId for status checks
        qrCode: booking.qrCode,
        bookingDate: booking.bookingDate,
        checkedIn: booking.checkedIn,
        checkedInAt: booking.checkedInAt,
      };
    });

    res.json({
      success: true,
      bookings: enhancedBookings,
    });
  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bookings',
      error: error.message,
    });
  }
};

/**
 * Get bookings by event (EO/Admin)
 * GET /api/bookings/event/:eventId
 */
exports.getBookingsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check authorization
    if (req.userRole !== 'admin' && event.organizerId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these bookings',
      });
    }

    const bookings = await Booking.find({ eventId })
      .populate('userId', 'fullName email phone')
      .sort({ bookingDate: -1 });

    res.json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error('Get event bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bookings',
      error: error.message,
    });
  }
};

/**
 * Get booking by ID
 * GET /api/bookings/:id
 */
exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id)
      .populate('eventId', 'title date time location img tickets')
      .populate('userId', 'fullName email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check authorization
    if (req.userRole !== 'admin' && booking.userId._id.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking',
      });
    }

    res.json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get booking',
      error: error.message,
    });
  }
};

/**
 * Cancel booking
 * POST /api/bookings/:id/cancel
 */
exports.cancelBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    const booking = await Booking.findById(id).session(session);

    if (!booking) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check authorization
    if (req.userRole !== 'admin' && booking.userId.toString() !== req.userId.toString()) {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking',
      });
    }

    // Check if can be cancelled
    const canCancelResult = await booking.canBeCancelled();
    if (!canCancelResult.canCancel) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: canCancelResult.message,
      });
    }

    // Update booking status
    booking.status = 'cancelled';
    booking.cancellationDate = new Date();
    booking.cancellationReason = req.body.reason || 'User requested cancellation';

    // Refund tickets back to event
    const event = await Event.findById(booking.eventId).session(session);
    if (event) {
      const ticketIndex = event.tickets.findIndex((t) => t.id === booking.ticketCategoryId);
      if (ticketIndex !== -1) {
        event.tickets[ticketIndex].sold = Math.max(
          0,
          event.tickets[ticketIndex].sold - booking.quantity
        );
        await event.save({ session });

        // Notify waitlist
        const waitlistEntries = await Waitlist.getNextInLine(
          event._id,
          booking.ticketCategoryId,
          1
        );

        for (const entry of waitlistEntries) {
          await entry.markNotified();
          const entryUser = await User.findById(entry.userId);
          if (entryUser) {
            const ticketType = event.tickets[ticketIndex]?.type || 'Standard';
            await sendWaitlistNotification(
              entryUser.email,
              entryUser.fullName,
              { id: event._id, title: event.title, date: event.date },
              ticketType
            );
          }
        }
      }
    }

    await booking.save({ session });
    await session.commitTransaction();

    // Send cancellation email
    const user = await User.findById(booking.userId);
    if (user && event) {
      const ticketType =
        event.tickets.find((t) => t.id === booking.ticketCategoryId)?.type || 'Standard';
      await sendCancellationConfirmation(
        user.email,
        user.fullName,
        {
          id: booking._id,
          quantity: booking.quantity,
          ticketType,
          totalPrice: booking.totalPrice,
        },
        { title: event.title }
      );
    }

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

/**
 * Check-in booking (scan QR code)
 * POST /api/bookings/:id/checkin
 */
exports.checkIn = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id).populate('eventId', 'title date organizerId');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check authorization (only EO of this event or admin can check in)
    const event = booking.eventId;
    if (req.userRole !== 'admin' && event.organizerId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to check in bookings for this event',
      });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: `Cannot check in: booking status is ${booking.status}`,
      });
    }

    if (booking.checkedIn) {
      return res.status(400).json({
        success: false,
        message: 'Already checked in',
        checkedInAt: booking.checkedInAt,
      });
    }

    booking.checkedIn = true;
    booking.checkedInAt = new Date();
    await booking.save();

    res.json({
      success: true,
      message: 'Check-in successful',
      booking: {
        id: booking._id,
        checkedIn: booking.checkedIn,
        checkedInAt: booking.checkedInAt,
      },
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check in',
      error: error.message,
    });
  }
};

/**
 * Validate QR code for check-in
 * POST /api/bookings/validate-qr
 */
exports.validateQRCode = async (req, res) => {
  try {
    const { qrCode } = req.body;

    const booking = await Booking.findOne({ qrCode })
      .populate('eventId', 'title date time location')
      .populate('userId', 'fullName email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Invalid QR code',
      });
    }

    const ticketType =
      booking.eventId.tickets?.find((t) => t.id === booking.ticketCategoryId)?.type || 'Standard';

    res.json({
      success: true,
      booking: {
        id: booking._id,
        eventTitle: booking.eventId.title,
        eventDate: booking.eventId.date,
        attendeeName: booking.userId.fullName,
        ticketType,
        quantity: booking.quantity,
        status: booking.status,
        checkedIn: booking.checkedIn,
        checkedInAt: booking.checkedInAt,
      },
    });
  } catch (error) {
    console.error('Validate QR error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate QR code',
      error: error.message,
    });
  }
};

/**
 * Get booked seats for an event (public)
 * GET /api/bookings/seats/:eventId
 */
exports.getBookedSeats = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Find all confirmed or pending bookings for this event that have selectedSeats
    const bookings = await Booking.find({
      eventId,
      status: { $in: ['confirmed', 'pending'] },
      selectedSeats: { $exists: true, $ne: [] },
    }).select('selectedSeats');

    // Flatten all selected seats into a single array
    const bookedSeats = bookings.reduce((acc, booking) => {
      if (booking.selectedSeats && booking.selectedSeats.length > 0) {
        acc.push(...booking.selectedSeats);
      }
      return acc;
    }, []);

    res.json({
      success: true,
      bookedSeats,
      count: bookedSeats.length,
    });
  } catch (error) {
    console.error('Get booked seats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get booked seats',
      error: error.message,
    });
  }
};
