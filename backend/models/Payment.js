/**
 * Payment Model - MongoDB Schema
 * Stores Midtrans payment transaction records
 */

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Midtrans transaction details
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    transactionId: {
      type: String,
      default: null,
    },
    transactionStatus: {
      type: String,
      enum: ['pending', 'capture', 'settlement', 'deny', 'cancel', 'expire', 'failure', 'refund'],
      default: 'pending',
    },
    paymentType: {
      type: String,
      default: null,
    },
    grossAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'IDR',
    },
    // Midtrans response data
    fraudStatus: {
      type: String,
      default: null,
    },
    statusCode: {
      type: String,
      default: null,
    },
    statusMessage: {
      type: String,
      default: null,
    },
    // Payment metadata
    paymentDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Snap token for redirect
    snapToken: {
      type: String,
      default: null,
    },
    snapRedirectUrl: {
      type: String,
      default: null,
    },
    // Timestamps
    transactionTime: {
      type: Date,
      default: null,
    },
    settlementTime: {
      type: Date,
      default: null,
    },
    expiryTime: {
      type: Date,
      default: null,
    },
    // Flag to prevent duplicate email sends from both webhook and polling
    emailSent: {
      type: Boolean,
      default: false,
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

// Indexes (orderId already has index from unique:true)
paymentSchema.index({ bookingId: 1 });
paymentSchema.index({ userId: 1 });
paymentSchema.index({ transactionStatus: 1 });

// Static method to find by order ID
paymentSchema.statics.findByOrderId = function (orderId) {
  return this.findOne({ orderId }).populate('bookingId').populate('userId', 'fullName email');
};

// Method to update from Midtrans notification
paymentSchema.methods.updateFromNotification = async function (notificationData) {
  this.transactionId = notificationData.transaction_id;
  this.transactionStatus = notificationData.transaction_status;
  this.paymentType = notificationData.payment_type;
  this.fraudStatus = notificationData.fraud_status;
  this.statusCode = notificationData.status_code;
  this.statusMessage = notificationData.status_message;
  this.transactionTime = notificationData.transaction_time
    ? new Date(notificationData.transaction_time)
    : null;
  this.settlementTime = notificationData.settlement_time
    ? new Date(notificationData.settlement_time)
    : null;
  this.paymentDetails = notificationData;

  return this.save();
};

// Check if payment is successful
paymentSchema.methods.isSuccessful = function () {
  return ['capture', 'settlement'].includes(this.transactionStatus);
};

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
