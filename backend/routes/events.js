/**
 * Event Routes
 */

const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticate, optionalAuth, authorize } = require('../middleware/auth');

// Public routes
router.get('/', optionalAuth, eventController.getEvents);
router.get('/:id', optionalAuth, eventController.getEventById);
router.post('/validate-promo', eventController.validatePromoCode);

// Protected routes (EO/Admin)
router.post('/', authenticate, authorize('eo', 'admin'), eventController.createEvent);
router.put('/:id', authenticate, authorize('eo', 'admin'), eventController.updateEvent);
router.delete('/:id', authenticate, authorize('eo', 'admin'), eventController.deleteEvent);

// Organizer-specific routes
router.get('/organizer/:organizerId', authenticate, eventController.getEventsByOrganizer);

// Ticket and promo management
router.post('/:id/tickets', authenticate, authorize('eo', 'admin'), eventController.updateTickets);
router.post('/:id/promo', authenticate, authorize('eo', 'admin'), eventController.addPromotionalCode);

module.exports = router;
