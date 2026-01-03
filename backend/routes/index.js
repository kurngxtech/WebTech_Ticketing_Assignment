// Centralized Route Index - Exports all route modules

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

// Register all routes with Express app
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
