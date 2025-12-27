/**
 * Waitlist Model - MongoDB Schema
 * Manages waitlist entries for sold-out events
 */

const mongoose = require('mongoose');

const waitlistSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: [true, 'Event ID is required']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  ticketCategoryId: {
    type: String,
    required: [true, 'Ticket category ID is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    max: [10, 'Maximum 10 tickets per waitlist entry']
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  notified: {
    type: Boolean,
    default: false
  },
  notifiedAt: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['waiting', 'notified', 'converted', 'expired', 'removed'],
    default: 'waiting'
  },
  expiresAt: {
    type: Date,
    default: null // Set when notified, to give user time to purchase
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Compound index to prevent duplicate entries
waitlistSchema.index({ eventId: 1, userId: 1, ticketCategoryId: 1 }, { unique: true });
waitlistSchema.index({ eventId: 1, status: 1 });
waitlistSchema.index({ registeredAt: 1 });

// Static method to get waitlist for an event
waitlistSchema.statics.getByEvent = function(eventId) {
  return this.find({ eventId, status: 'waiting' })
    .populate('userId', 'fullName email phone')
    .sort({ registeredAt: 1 }); // FIFO order
};

// Static method to get waitlist entries for a user
waitlistSchema.statics.getByUser = function(userId) {
  return this.find({ userId })
    .populate('eventId', 'title date time location img')
    .sort({ registeredAt: -1 });
};

// Static method to get next in line for notification
waitlistSchema.statics.getNextInLine = function(eventId, ticketCategoryId, limit = 1) {
  return this.find({ 
    eventId, 
    ticketCategoryId, 
    status: 'waiting' 
  })
    .populate('userId', 'fullName email')
    .sort({ registeredAt: 1 })
    .limit(limit);
};

// Method to mark as notified
waitlistSchema.methods.markNotified = async function() {
  this.notified = true;
  this.notifiedAt = new Date();
  this.status = 'notified';
  // Give user 24 hours to purchase
  this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return this.save();
};

// Method to mark as converted (user purchased tickets)
waitlistSchema.methods.markConverted = async function() {
  this.status = 'converted';
  return this.save();
};

const Waitlist = mongoose.model('Waitlist', waitlistSchema);

module.exports = Waitlist;
