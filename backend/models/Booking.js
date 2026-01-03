// Booking Model - MongoDB Schema for ticket bookings with QR codes

const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    ticketCategoryId: {
      type: String,
      required: [true, 'Ticket category ID is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    pricePerTicket: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    discountApplied: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    promoCodeUsed: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      default: null,
    },
    paymentId: {
      type: String,
      default: null,
    },
    bookingDate: {
      type: Date,
      default: Date.now,
    },
    qrCode: {
      type: String,
      default: null,
    },
    selectedSeats: [
      {
        type: String,
      },
    ],
    checkedIn: {
      type: Boolean,
      default: false,
    },
    checkedInAt: {
      type: Date,
      default: null,
    },
    cancellationDate: {
      type: Date,
      default: null,
    },
    cancellationReason: {
      type: String,
      default: null,
    },
    // Payment expiration - 24 hours from booking creation for pending bookings
    expiresAt: {
      type: Date,
      default: function () {
        return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
      },
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
bookingSchema.index({ eventId: 1 });
bookingSchema.index({ userId: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ bookingDate: -1 });
bookingSchema.index({ qrCode: 1 });

// Method to generate QR code data
bookingSchema.methods.generateQRData = function () {
  return `BOOKING|${this._id}|${this.eventId}|${this.ticketCategoryId}|${
    this.quantity
  }|${Date.now()}`;
};

// Method to check if booking can be cancelled (7 days before event)
bookingSchema.methods.canBeCancelled = async function () {
  const Event = require('./Event');
  const event = await Event.findById(this.eventId);

  if (!event) return { canCancel: false, message: 'Event not found' };
  if (this.status === 'cancelled')
    return { canCancel: false, message: 'Booking already cancelled' };

  const eventDate = new Date(event.date).getTime();
  const now = Date.now();
  const daysUntilEvent = (eventDate - now) / (1000 * 60 * 60 * 24);

  if (daysUntilEvent < 7) {
    return { canCancel: false, message: 'Can only cancel 7 days before event' };
  }

  return { canCancel: true, message: 'Booking can be cancelled' };
};

// Static method to get bookings by user
bookingSchema.statics.getByUser = function (userId) {
  return this.find({ userId })
    .populate('eventId', 'title date time location img')
    .sort({ bookingDate: -1 });
};

// Static method to get bookings by event
bookingSchema.statics.getByEvent = function (eventId) {
  return this.find({ eventId })
    .populate('userId', 'fullName email phone')
    .sort({ bookingDate: -1 });
};

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
