/**
 * Analytics Routes
 */

const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Event-specific analytics (EO/Admin)
router.get('/event/:eventId', authorize('eo', 'admin'), analyticsController.getEventAnalytics);

// Auditorium-wide analytics (Admin only)
router.get('/auditorium', authorize('admin'), analyticsController.getAuditoriumAnalytics);

// Reports
router.get('/revenue', authorize('eo', 'admin'), analyticsController.getRevenueReport);
router.get('/occupancy', authorize('eo', 'admin'), analyticsController.getOccupancyReport);
router.get('/sales', authorize('eo', 'admin'), analyticsController.getSalesReport);

module.exports = router;
