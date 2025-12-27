/**
 * User Routes
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Get all users (admin only)
router.get('/', authorize('admin'), userController.getAllUsers);

// Get all Event Organizers
router.get('/eos', authorize('admin'), userController.getEventOrganizers);

// Get user by ID
router.get('/:id', userController.getUserById);

// Update user
router.put('/:id', userController.updateUser);

// Deactivate user (admin only)
router.delete('/:id', authorize('admin'), userController.deactivateUser);

module.exports = router;
