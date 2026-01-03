// Payment Routes

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');

// Get client key (public)
router.get('/client-key', paymentController.getClientKey);

// Midtrans webhook notification (no auth - called by Midtrans)
router.post('/notification', paymentController.handleNotification);

// Protected routes
router.post('/create', authenticate, paymentController.createPayment);
router.get('/:orderId/status', authenticate, paymentController.getPaymentStatus);
router.get('/:orderId/check', authenticate, paymentController.checkTransaction);

// Mock payment (development only)
router.post('/mock-complete', authenticate, paymentController.mockCompletePayment);

module.exports = router;
