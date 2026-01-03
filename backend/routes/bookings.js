// Booking Routes

const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticate, authorize } = require('../middleware/auth');

// Public route - Get booked seats for seat map display
router.get('/seats/:eventId', bookingController.getBookedSeats);

// All other routes require authentication
router.use(authenticate);

// Create booking
router.post('/', bookingController.createBooking);

// Get booking by ID
router.get('/:id', bookingController.getBookingById);

// Get bookings by user
router.get('/user/:userId', bookingController.getBookingsByUser);

// Get bookings by event (EO/Admin)
router.get('/event/:eventId', authorize('eo', 'admin'), bookingController.getBookingsByEvent);

// Cancel booking
router.post('/:id/cancel', bookingController.cancelBooking);

// Check-in (EO/Admin)
router.post('/:id/checkin', authorize('eo', 'admin'), bookingController.checkIn);

// Validate QR code
router.post('/validate-qr', authorize('eo', 'admin'), bookingController.validateQRCode);

// Delete booking completely (frees up seats)
router.delete('/:id', bookingController.deleteBooking);

module.exports = router;
