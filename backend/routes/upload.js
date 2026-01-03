// Upload Routes

const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { authenticate, authorize } = require('../middleware/auth');

// Protected routes - only EO and Admin can upload
router.post(
  '/event-image',
  authenticate,
  authorize('eo', 'admin'),
  uploadController.uploadEventImage
);

router.delete(
  '/event-image/:filename',
  authenticate,
  authorize('eo', 'admin'),
  uploadController.deleteEventImage
);

router.get('/event-image/:filename', uploadController.getImageInfo);

module.exports = router;
