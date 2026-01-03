/**
 * Upload Controller
 * Handles file uploads for event images
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
const eventsDir = path.join(uploadsDir, 'events');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(eventsDir)) {
  fs.mkdirSync(eventsDir, { recursive: true });
}

// Allowed image types and max size
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Upload event image
 * POST /api/upload/event-image
 */
exports.uploadEventImage = async (req, res) => {
  try {
    // Check if file was provided
    if (!req.body.image) {
      return res.status(400).json({
        success: false,
        message: 'No image provided',
      });
    }

    const { image, filename } = req.body;

    // Validate base64 image
    const matches = image.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image format. Expected base64 encoded image.',
      });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    // Validate mime type
    if (!ALLOWED_TYPES.includes(mimeType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid image type. Allowed: ${ALLOWED_TYPES.join(', ')}`,
      });
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');

    // Check file size
    if (buffer.length > MAX_SIZE) {
      return res.status(400).json({
        success: false,
        message: `Image too large. Max size: ${MAX_SIZE / 1024 / 1024}MB`,
      });
    }

    // Generate unique filename
    const ext = mimeType.split('/')[1].replace('jpeg', 'jpg');
    const uniqueId = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now();
    const safeFilename = filename
      ? filename.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 50)
      : 'event';
    const finalFilename = `${safeFilename}_${timestamp}_${uniqueId}.${ext}`;

    // Save file
    const filePath = path.join(eventsDir, finalFilename);
    fs.writeFileSync(filePath, buffer);

    // Generate URL
    const imageUrl = `/uploads/events/${finalFilename}`;

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl,
      filename: finalFilename,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message,
    });
  }
};

/**
 * Delete uploaded image
 * DELETE /api/upload/event-image/:filename
 */
exports.deleteEventImage = async (req, res) => {
  try {
    const { filename } = req.params;

    // Validate filename (prevent directory traversal)
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid filename',
      });
    }

    const filePath = path.join(eventsDir, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Image not found',
      });
    }

    // Delete file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image',
      error: error.message,
    });
  }
};

/**
 * Get image info
 * GET /api/upload/event-image/:filename
 */
exports.getImageInfo = async (req, res) => {
  try {
    const { filename } = req.params;

    // Validate filename
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid filename',
      });
    }

    const filePath = path.join(eventsDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Image not found',
      });
    }

    const stats = fs.statSync(filePath);

    res.json({
      success: true,
      image: {
        filename,
        url: `/uploads/events/${filename}`,
        size: stats.size,
        created: stats.birthtime,
      },
    });
  } catch (error) {
    console.error('Get image info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get image info',
      error: error.message,
    });
  }
};
