/**
 * Activity Logger Middleware
 * Automatically logs API requests and provides helpers for manual logging
 */

const ActivityLog = require('../models/ActivityLog');

/**
 * Get client IP address from request
 */
const getClientIP = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'unknown'
  );
};

/**
 * Express middleware to log API requests
 * Logs after response is sent (using response finish event)
 */
const requestLogger = (options = {}) => {
  const {
    excludePaths = ['/api/health', '/api/health/detailed', '/api/health/ready', '/api/health/live'],
    logOnlyErrors = false,
  } = options;

  return (req, res, next) => {
    // Skip excluded paths
    if (excludePaths.some((path) => req.path.startsWith(path))) {
      return next();
    }

    const startTime = Date.now();

    // Store original end function
    const originalEnd = res.end;

    // Override end to capture response
    res.end = function (chunk, encoding) {
      res.end = originalEnd;
      res.end(chunk, encoding);

      const responseTime = Date.now() - startTime;
      const statusCode = res.statusCode;

      // Only log errors if logOnlyErrors is true
      if (logOnlyErrors && statusCode < 400) {
        return;
      }

      // Log the request
      ActivityLog.log({
        userId: req.userId || null,
        action: 'api_request',
        resource: 'system',
        details: {
          query: req.query,
          body: sanitizeBody(req.body),
        },
        ipAddress: getClientIP(req),
        userAgent: req.headers['user-agent'],
        path: req.path,
        method: req.method,
        statusCode,
        responseTime,
      }).catch((err) => console.error('Activity log error:', err));
    };

    next();
  };
};

/**
 * Sanitize request body to remove sensitive data
 */
const sanitizeBody = (body) => {
  if (!body) return {};

  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard'];

  sensitiveFields.forEach((field) => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  // Limit body size to prevent huge logs
  const str = JSON.stringify(sanitized);
  if (str.length > 1000) {
    return { _truncated: true, size: str.length };
  }

  return sanitized;
};

/**
 * Helper function to log specific actions
 */
const logActivity = async (req, action, resource, resourceId, details = {}) => {
  try {
    await ActivityLog.log({
      userId: req.userId || null,
      action,
      resource,
      resourceId,
      details,
      ipAddress: getClientIP(req),
      userAgent: req.headers['user-agent'],
      path: req.path,
      method: req.method,
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

/**
 * Pre-made helpers for common actions
 */
const logAuth = {
  login: (req, userId, success) => logActivity(req, 'login', 'user', userId, { success }),

  logout: (req, userId) => logActivity(req, 'logout', 'user', userId),

  register: (req, userId, email) => logActivity(req, 'register', 'user', userId, { email }),

  passwordChange: (req, userId) => logActivity(req, 'password_change', 'user', userId),
};

const logBooking = {
  create: (req, bookingId, eventId, quantity) =>
    logActivity(req, 'booking_create', 'booking', bookingId, { eventId, quantity }),

  cancel: (req, bookingId, reason) =>
    logActivity(req, 'booking_cancel', 'booking', bookingId, { reason }),

  delete: (req, bookingId) => logActivity(req, 'booking_delete', 'booking', bookingId),

  checkin: (req, bookingId, success) =>
    logActivity(req, 'booking_checkin', 'booking', bookingId, { success }),
};

const logPayment = {
  create: (req, paymentId, bookingId, amount) =>
    logActivity(req, 'payment_create', 'payment', paymentId, { bookingId, amount }),

  success: (req, paymentId, orderId) =>
    logActivity(req, 'payment_success', 'payment', paymentId, { orderId }),

  failed: (req, paymentId, reason) =>
    logActivity(req, 'payment_failed', 'payment', paymentId, { reason }),
};

const logEvent = {
  create: (req, eventId, title) => logActivity(req, 'event_create', 'event', eventId, { title }),

  update: (req, eventId, changes) =>
    logActivity(req, 'event_update', 'event', eventId, { changes }),

  delete: (req, eventId) => logActivity(req, 'event_delete', 'event', eventId),
};

module.exports = {
  requestLogger,
  logActivity,
  logAuth,
  logBooking,
  logPayment,
  logEvent,
  getClientIP,
};
