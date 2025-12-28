/**
 * Waitlist Routes
 */

const express = require('express');
const router = express.Router();
const waitlistController = require('../controllers/waitlistController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Join waitlist
router.post('/', waitlistController.joinWaitlist);

// Leave waitlist
router.delete('/:id', waitlistController.leaveWaitlist);

// Get waitlist by event (EO/Admin)
router.get('/event/:eventId', authorize('eo', 'admin'), waitlistController.getWaitlistByEvent);

// Get user's waitlist entries
router.get('/user/:userId', waitlistController.getWaitlistByUser);

// Notify waitlist (EO/Admin)
router.post('/notify/:eventId', authorize('eo', 'admin'), waitlistController.notifyWaitlist);

// Notify approaching events - Admin only (for scheduled job)
router.post('/notify-approaching', authorize('admin'), waitlistController.notifyApproachingEvents);

module.exports = router;
