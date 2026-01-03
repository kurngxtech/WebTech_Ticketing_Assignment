// ActivityLog Model - MongoDB Schema for user action tracking

const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    // User who performed the action (null for anonymous/system actions)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Action type
    action: {
      type: String,
      required: true,
      enum: [
        // Auth actions
        'login',
        'logout',
        'register',
        'password_change',
        'password_reset',
        // Booking actions
        'booking_create',
        'booking_cancel',
        'booking_delete',
        'booking_checkin',
        // Payment actions
        'payment_create',
        'payment_success',
        'payment_failed',
        'payment_pending',
        // Event actions
        'event_create',
        'event_update',
        'event_delete',
        'event_view',
        // Waitlist actions
        'waitlist_join',
        'waitlist_leave',
        'waitlist_notify',
        // Admin actions
        'user_create',
        'user_update',
        'user_delete',
        'user_role_change',
        // System actions
        'system_error',
        'api_request',
      ],
    },
    // Resource type affected
    resource: {
      type: String,
      enum: ['user', 'event', 'booking', 'payment', 'waitlist', 'system', null],
      default: null,
    },
    // Resource ID affected
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    // Additional details about the action
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Request metadata
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    // Request path
    path: {
      type: String,
      default: null,
    },
    // HTTP method
    method: {
      type: String,
      default: null,
    },
    // Response status code
    statusCode: {
      type: Number,
      default: null,
    },
    // Response time in ms
    responseTime: {
      type: Number,
      default: null,
    },
    // Timestamp
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    // Expire logs after 90 days (configurable)
    expireAfterSeconds: 90 * 24 * 60 * 60,
  }
);

// Indexes for faster queries
activityLogSchema.index({ userId: 1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ resource: 1, resourceId: 1 });
activityLogSchema.index({ timestamp: -1 });
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Static method to log an activity
activityLogSchema.statics.log = async function (data) {
  try {
    const log = new this(data);
    await log.save();
    return log;
  } catch (error) {
    console.error('Failed to log activity:', error);
    return null;
  }
};

// Static method to get user activity history
activityLogSchema.statics.getUserActivity = function (userId, options = {}) {
  const { limit = 50, skip = 0, action } = options;
  const query = { userId };
  if (action) query.action = action;

  return this.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit);
};

// Static method to get resource activity history
activityLogSchema.statics.getResourceActivity = function (resource, resourceId, options = {}) {
  const { limit = 50, skip = 0 } = options;

  return this.find({ resource, resourceId })
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit)
    .populate('userId', 'fullName email');
};

// Static method to get activity summary for analytics
activityLogSchema.statics.getActivitySummary = async function (startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);
};

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;
