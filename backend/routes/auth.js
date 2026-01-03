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

// Password reset (public)
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

// Token refresh (public - uses refresh token instead of access token)
router.post('/refresh-token', authController.refreshToken);

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
router.post('/logout', authenticate, authController.logout);

module.exports = router;
