/**
 * APM (Application Performance Monitoring) Middleware
 * Tracks request timing, memory usage, and error rates
 */

// In-memory metrics storage (for simplicity, consider Redis for production)
const metrics = {
  requests: {
    total: 0,
    success: 0,
    errors: 0,
    byPath: {},
    byMethod: {},
  },
  response: {
    totalTime: 0,
    count: 0,
    slowest: 0,
    slowestPath: '',
    percentiles: [],
  },
  memory: {
    samples: [],
    maxHeapUsed: 0,
  },
  uptime: {
    startTime: Date.now(),
  },
  errors: {
    recent: [], // Last 100 errors
    byType: {},
  },
};

// Response time samples for percentile calculation
const responseTimes = [];
const MAX_SAMPLES = 1000;

/**
 * Record response time sample
 */
const recordResponseTime = (time) => {
  responseTimes.push(time);
  if (responseTimes.length > MAX_SAMPLES) {
    responseTimes.shift();
  }
};

/**
 * Calculate percentile from samples
 */
const getPercentile = (percentile) => {
  if (responseTimes.length === 0) return 0;

  const sorted = [...responseTimes].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
};

/**
 * Express middleware for APM
 */
const apmMiddleware = (options = {}) => {
  const { excludePaths = ['/api/health', '/api/metrics'] } = options;

  return (req, res, next) => {
    // Skip excluded paths
    if (excludePaths.some((path) => req.path.startsWith(path))) {
      return next();
    }

    const startTime = process.hrtime.bigint();

    // Override res.end to capture metrics
    const originalEnd = res.end;
    res.end = function (chunk, encoding) {
      res.end = originalEnd;
      res.end(chunk, encoding);

      // Calculate response time in ms
      const endTime = process.hrtime.bigint();
      const responseTimeNs = Number(endTime - startTime);
      const responseTimeMs = responseTimeNs / 1e6;

      // Update metrics
      metrics.requests.total++;

      if (res.statusCode >= 400) {
        metrics.requests.errors++;
      } else {
        metrics.requests.success++;
      }

      // Track by path
      const pathKey = `${req.method} ${req.path}`;
      if (!metrics.requests.byPath[pathKey]) {
        metrics.requests.byPath[pathKey] = { count: 0, totalTime: 0, errors: 0 };
      }
      metrics.requests.byPath[pathKey].count++;
      metrics.requests.byPath[pathKey].totalTime += responseTimeMs;
      if (res.statusCode >= 400) {
        metrics.requests.byPath[pathKey].errors++;
      }

      // Track by method
      if (!metrics.requests.byMethod[req.method]) {
        metrics.requests.byMethod[req.method] = 0;
      }
      metrics.requests.byMethod[req.method]++;

      // Response time tracking
      metrics.response.totalTime += responseTimeMs;
      metrics.response.count++;
      recordResponseTime(responseTimeMs);

      // Track slowest request
      if (responseTimeMs > metrics.response.slowest) {
        metrics.response.slowest = responseTimeMs;
        metrics.response.slowestPath = pathKey;
      }
    };

    next();
  };
};

/**
 * Record memory usage (call periodically)
 */
const recordMemoryUsage = () => {
  const usage = process.memoryUsage();
  metrics.memory.samples.push({
    timestamp: Date.now(),
    heapUsed: usage.heapUsed,
    heapTotal: usage.heapTotal,
    rss: usage.rss,
    external: usage.external,
  });

  // Keep last 60 samples (1 hour if sampling every minute)
  if (metrics.memory.samples.length > 60) {
    metrics.memory.samples.shift();
  }

  // Track max heap used
  if (usage.heapUsed > metrics.memory.maxHeapUsed) {
    metrics.memory.maxHeapUsed = usage.heapUsed;
  }
};

/**
 * Record error
 */
const recordError = (error, req = null) => {
  const errorInfo = {
    timestamp: Date.now(),
    message: error.message,
    stack: error.stack,
    name: error.name || 'Error',
    path: req?.path || null,
    method: req?.method || null,
  };

  // Add to recent errors
  metrics.errors.recent.unshift(errorInfo);
  if (metrics.errors.recent.length > 100) {
    metrics.errors.recent.pop();
  }

  // Track by error type
  const errorType = error.name || 'UnknownError';
  if (!metrics.errors.byType[errorType]) {
    metrics.errors.byType[errorType] = 0;
  }
  metrics.errors.byType[errorType]++;
};

/**
 * Get current metrics
 */
const getMetrics = () => {
  const memoryUsage = process.memoryUsage();
  const uptime = Date.now() - metrics.uptime.startTime;

  return {
    timestamp: new Date().toISOString(),
    uptime: {
      ms: uptime,
      human: formatUptime(uptime),
    },
    requests: {
      total: metrics.requests.total,
      success: metrics.requests.success,
      errors: metrics.requests.errors,
      errorRate:
        metrics.requests.total > 0
          ? ((metrics.requests.errors / metrics.requests.total) * 100).toFixed(2) + '%'
          : '0%',
      byMethod: metrics.requests.byMethod,
      topPaths: getTopPaths(10),
    },
    response: {
      averageMs:
        metrics.response.count > 0
          ? (metrics.response.totalTime / metrics.response.count).toFixed(2)
          : 0,
      slowestMs: metrics.response.slowest.toFixed(2),
      slowestPath: metrics.response.slowestPath,
      percentiles: {
        p50: getPercentile(50).toFixed(2),
        p90: getPercentile(90).toFixed(2),
        p95: getPercentile(95).toFixed(2),
        p99: getPercentile(99).toFixed(2),
      },
    },
    memory: {
      current: {
        heapUsed: formatBytes(memoryUsage.heapUsed),
        heapTotal: formatBytes(memoryUsage.heapTotal),
        rss: formatBytes(memoryUsage.rss),
        external: formatBytes(memoryUsage.external),
      },
      maxHeapUsed: formatBytes(metrics.memory.maxHeapUsed),
    },
    errors: {
      total: metrics.requests.errors,
      byType: metrics.errors.byType,
      recentCount: metrics.errors.recent.length,
    },
    process: {
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
    },
  };
};

/**
 * Get top paths by request count
 */
const getTopPaths = (limit = 10) => {
  return Object.entries(metrics.requests.byPath)
    .map(([path, data]) => ({
      path,
      count: data.count,
      avgTime: (data.totalTime / data.count).toFixed(2) + 'ms',
      errors: data.errors,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};

/**
 * Format bytes to human readable
 */
const formatBytes = (bytes) => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let unitIndex = 0;
  let value = bytes;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(2)} ${units[unitIndex]}`;
};

/**
 * Format uptime to human readable
 */
const formatUptime = (ms) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};

/**
 * Reset metrics (useful for testing)
 */
const resetMetrics = () => {
  metrics.requests = { total: 0, success: 0, errors: 0, byPath: {}, byMethod: {} };
  metrics.response = { totalTime: 0, count: 0, slowest: 0, slowestPath: '', percentiles: [] };
  metrics.memory = { samples: [], maxHeapUsed: 0 };
  metrics.uptime = { startTime: Date.now() };
  metrics.errors = { recent: [], byType: {} };
  responseTimes.length = 0;
};

// Start memory sampling every minute
setInterval(recordMemoryUsage, 60000);
recordMemoryUsage(); // Initial sample

module.exports = {
  apmMiddleware,
  getMetrics,
  recordError,
  recordMemoryUsage,
  resetMetrics,
};
