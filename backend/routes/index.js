/**
 * Centralized Route Index
 * Exports all route modules for cleaner server.js imports
 *
 * API Endpoints Overview:
 * - /api/auth     - Authentication (login, register, password)
 * - /api/users    - User management (CRUD, EO list)
 * - /api/events   - Event management (CRUD, tickets, promos)
 * - /api/bookings - Booking operations (create, cancel, check-in)
 * - /api/payments - Midtrans payment integration
 * - /api/waitlist - Waitlist management for sold-out events
 * - /api/analytics - Reports (revenue, occupancy, sales)
 * - /api/upload   - File uploads (event images)
 */

const routes = {
  auth: require('./auth'),
  users: require('./users'),
  events: require('./events'),
  bookings: require('./bookings'),
  payments: require('./payments'),
  waitlist: require('./waitlist'),
  analytics: require('./analytics'),
  upload: require('./upload'),
};

/**
 * Register all routes with Express app
 * @param {Express} app - Express application instance
 * @param {string} prefix - API prefix (default: '/api')
 */
function registerRoutes(app, prefix = '/api') {
  app.use(`${prefix}/auth`, routes.auth);
  app.use(`${prefix}/users`, routes.users);
  app.use(`${prefix}/events`, routes.events);
  app.use(`${prefix}/bookings`, routes.bookings);
  app.use(`${prefix}/payments`, routes.payments);
  app.use(`${prefix}/waitlist`, routes.waitlist);
  app.use(`${prefix}/analytics`, routes.analytics);
  app.use(`${prefix}/upload`, routes.upload);

  console.log(`📍 Routes registered at ${prefix}/*`);
}

module.exports = { routes, registerRoutes };
