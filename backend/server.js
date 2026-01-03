// EMS Backend Server - Entry Point

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mongoose = require('mongoose');
const path = require('path');
const connectDB = require('./config/db');

// Import centralized routes
const { registerRoutes } = require('./routes');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const { apmMiddleware, getMetrics, recordError } = require('./middleware/apm');
const { requestLogger } = require('./middleware/activityLogger');

const app = express();

// Connect to MongoDB
const dbConnection = connectDB();

// Store DB connection state for health checks
let dbConnected = false;
mongoose.connection.on('connected', () => {
  dbConnected = true;
  console.log('✅ MongoDB Connected');
});
mongoose.connection.on('disconnected', () => {
  dbConnected = false;
  console.log('❌ MongoDB Disconnected');
});
mongoose.connection.on('error', (err) => {
  dbConnected = false;
  console.error('MongoDB connection error:', err);
  recordError(err);
});

// ============================================
// Security Middleware
// ============================================

// Helmet.js - Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://app.sandbox.midtrans.com',
          'https://app.midtrans.com',
        ],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: ["'self'", 'https://api.sandbox.midtrans.com', 'https://api.midtrans.com'],
        frameSrc: ["'self'", 'https://app.sandbox.midtrans.com', 'https://app.midtrans.com'],
        fontSrc: ["'self'", 'https:', 'data:'],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow embedding for Midtrans
  })
);

// Compression - Gzip responses
app.use(
  compression({
    level: 6, // Balanced compression level
    threshold: 1024, // Only compress responses > 1KB
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
  })
);

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// APM middleware (before routes)
app.use(apmMiddleware());

// Activity logging middleware (after APM to capture response times)
if (process.env.ENABLE_ACTIVITY_LOGGING !== 'false') {
  app.use(requestLogger({ logOnlyErrors: process.env.LOG_ONLY_ERRORS === 'true' }));
}

// Register all API routes
registerRoutes(app);

// ============================================
// Health Check Endpoints
// ============================================

// GET /api/health - Basic health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'EMS Backend is running',
    timestamp: new Date().toISOString(),
  });
});

// GET /api/health/detailed - Detailed health check
app.get('/api/health/detailed', async (req, res) => {
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();

  let dbStatus = 'unknown';
  let dbPingMs = null;

  try {
    if (dbConnected && mongoose.connection.db) {
      const start = Date.now();
      await mongoose.connection.db.admin().ping();
      dbPingMs = Date.now() - start;
      dbStatus = 'connected';
    } else {
      dbStatus = 'disconnected';
    }
  } catch (error) {
    dbStatus = 'error';
    recordError(error);
  }

  const status = dbStatus === 'connected' ? 'healthy' : 'degraded';

  res.status(status === 'healthy' ? 200 : 503).json({
    status,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: {
      seconds: Math.floor(uptime),
      human: formatUptime(uptime * 1000),
    },
    database: {
      status: dbStatus,
      pingMs: dbPingMs,
      name: mongoose.connection.name || null,
      host: mongoose.connection.host || null,
    },
    memory: {
      heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      rssMB: Math.round(memoryUsage.rss / 1024 / 1024),
    },
    process: {
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
    },
  });
});

// GET /api/health/ready - Readiness probe (Kubernetes style)
app.get('/api/health/ready', async (req, res) => {
  const checks = {
    database: false,
  };

  try {
    if (dbConnected && mongoose.connection.db) {
      await mongoose.connection.db.admin().ping();
      checks.database = true;
    }
  } catch (error) {
    recordError(error);
  }

  const allReady = Object.values(checks).every((v) => v);

  res.status(allReady ? 200 : 503).json({
    ready: allReady,
    checks,
    timestamp: new Date().toISOString(),
  });
});

// GET /api/health/live - Liveness probe (Kubernetes style)
app.get('/api/health/live', (req, res) => {
  res.json({
    alive: true,
    timestamp: new Date().toISOString(),
  });
});

// GET /api/metrics - APM data
app.get('/api/metrics', (req, res) => {
  // Optional: Add basic auth protection for metrics
  // const authHeader = req.headers.authorization;
  // if (!authHeader || authHeader !== `Bearer ${process.env.METRICS_TOKEN}`) {
  //   return res.status(401).json({ error: 'Unauthorized' });
  // }

  res.json(getMetrics());
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Event Management System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      events: '/api/events',
      bookings: '/api/bookings',
      waitlist: '/api/waitlist',
      analytics: '/api/analytics',
      payments: '/api/payments',
      health: '/api/health',
      healthDetailed: '/api/health/detailed',
      healthReady: '/api/health/ready',
      healthLive: '/api/health/live',
      metrics: '/api/metrics',
    },
  });
});

// Error handling middleware (must be last)
app.use((err, req, res, next) => {
  // Record error in APM
  recordError(err, req);
  // Pass to error handler
  errorHandler(err, req, res, next);
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Format uptime to human readable
function formatUptime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🎫 EMS Backend Server Started Successfully! 🎫          ║
║                                                            ║
║   Server running on: http://localhost:${PORT}              ║
║   Environment: ${process.env.NODE_ENV || 'development'}    ║
║                                                            ║
║   Health:  /api/health                                     ║
║   Metrics: /api/metrics                                    ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
