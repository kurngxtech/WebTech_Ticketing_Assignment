/**
 * Event Model - MongoDB Schema
 * Stores event information, ticket categories, and promotional codes
 */

const mongoose = require('mongoose');

// Ticket Category Sub-Schema
const ticketCategorySchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: [true, 'Ticket type is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Ticket price is required'],
      min: [0, 'Price cannot be negative'],
    },
    total: {
      type: Number,
      required: [true, 'Total seats is required'],
      min: [1, 'Must have at least 1 seat'],
    },
    sold: {
      type: Number,
      default: 0,
      min: 0,
    },
    section: {
      type: String,
      default: 'GENERAL',
    },
  },
  { _id: false }
);

// Promotional Code Sub-Schema
const promotionalCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    discountPercentage: {
      type: Number,
      required: true,
      min: [1, 'Discount must be at least 1%'],
      max: [100, 'Discount cannot exceed 100%'],
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    applicableTicketTypes: [
      {
        type: String,
      },
    ],
    maxUsage: {
      type: Number,
      default: 1000,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

// Seating Layout Sub-Schema
const seatingLayoutSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    rows: {
      type: Number,
      required: true,
      min: 1,
    },
    seatsPerRow: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }
);

// Main Event Schema
const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      trim: true,
    },
    img: {
      type: String,
      required: [true, 'Event image URL is required'],
    },
    date: {
      type: String,
      required: [true, 'Event date is required'],
    },
    time: {
      type: String,
      required: [true, 'Event time is required'],
    },
    location: {
      type: String,
      required: [true, 'Event location is required'],
      trim: true,
    },
    price: {
      type: Number,
      min: 0,
    },
    organizer: {
      type: String,
      required: true,
    },
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'completed', 'cancelled'],
      default: 'draft',
    },
    tickets: [ticketCategorySchema],
    seatingLayout: [seatingLayoutSchema],
    promotionalCodes: [promotionalCodeSchema],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for faster queries
eventSchema.index({ organizerId: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ date: 1 });
eventSchema.index({ 'tickets.id': 1 });

// Virtual for total tickets available
eventSchema.virtual('totalAvailable').get(function () {
  return this.tickets.reduce((sum, t) => sum + (t.total - t.sold), 0);
});

// Virtual for total tickets sold
eventSchema.virtual('totalSold').get(function () {
  return this.tickets.reduce((sum, t) => sum + t.sold, 0);
});

// Method to check if event is sold out
eventSchema.methods.isSoldOut = function () {
  return this.tickets.every((t) => t.sold >= t.total);
};

// Method to get ticket by ID
eventSchema.methods.getTicketById = function (ticketId) {
  return this.tickets.find((t) => t.id === ticketId);
};

// Method to validate promotional code
eventSchema.methods.validatePromoCode = function (code) {
  const promo = this.promotionalCodes.find((p) => p.code === code.toUpperCase());

  if (!promo) {
    return { valid: false, message: 'Invalid promotional code' };
  }

  if (new Date(promo.expiryDate) < new Date()) {
    return { valid: false, message: 'Promotional code has expired' };
  }

  if (promo.usedCount >= promo.maxUsage) {
    return { valid: false, message: 'Promotional code usage limit reached' };
  }

  return {
    valid: true,
    discountPercentage: promo.discountPercentage,
    message: `${promo.discountPercentage}% discount applied`,
  };
};

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
