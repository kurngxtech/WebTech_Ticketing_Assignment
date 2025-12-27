/**
 * Authentication Routes
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes
router.post('/register', authController.registerUser);
router.post('/login', authController.login);

// Availability check routes (public - for registration validation)
router.get('/check-username/:username', authController.checkUsernameAvailability);
router.get('/check-email/:email', authController.checkEmailAvailability);

// Protected routes
router.post(
  '/register-eo',
  authenticate,
  authorize('admin'),
  authController.registerEventOrganizer
);
router.post('/change-password', authenticate, authController.changePassword);
router.get('/me', authenticate, authController.getMe);
router.get('/verify', authenticate, authController.verifyToken);

module.exports = router;
