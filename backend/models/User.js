// User Model - MongoDB Schema (roles: admin, eo, user)

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't include password in queries by default
    },
    role: {
      type: String,
      enum: ['admin', 'eo', 'user'],
      default: 'user',
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    organizationName: {
      type: String,
      trim: true,
      // Required only for event organizers, validated in controller
    },
    isFirstLogin: {
      type: Boolean,
      default: true, // For EOs to change password on first login
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Password reset fields
    passwordResetToken: {
      type: String,
      default: null,
    },
    passwordResetExpires: {
      type: Date,
      default: null,
    },
    // Refresh token for JWT refresh flow
    refreshToken: {
      type: String,
      default: null,
      select: false,
    },
    refreshTokenExpires: {
      type: Date,
      default: null,
      select: false,
    },
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
        delete ret.password;
        return ret;
      },
    },
  }
);

// Index for faster queries (only for non-unique fields)
// Note: email and username already have indexes from unique:true
userSchema.index({ role: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash if password is modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Static method to find by credentials
userSchema.statics.findByCredentials = async function (loginIdentifier, password) {
  // Can login with username or email
  const user = await this.findOne({
    $or: [{ email: loginIdentifier.toLowerCase() }, { username: loginIdentifier }],
    isActive: true,
  }).select('+password');

  if (!user) {
    return null;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return null;
  }

  return user;
};

// Method to generate password reset token
userSchema.methods.generatePasswordResetToken = function () {
  const crypto = require('crypto');
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash the token and store it
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  // Token expires in 1 hour
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000;

  // Return unhashed token (this is sent to user's email)
  return resetToken;
};

// Static method to find user by reset token
userSchema.statics.findByResetToken = async function (token) {
  const crypto = require('crypto');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  return this.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
};

// Method to generate refresh token
userSchema.methods.generateRefreshToken = function () {
  const crypto = require('crypto');
  const refreshToken = crypto.randomBytes(64).toString('hex');

  // Store hashed refresh token
  this.refreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');

  // Refresh token expires in 7 days
  this.refreshTokenExpires = Date.now() + 7 * 24 * 60 * 60 * 1000;

  return refreshToken;
};

// Static method to find user by refresh token
userSchema.statics.findByRefreshToken = async function (token) {
  const crypto = require('crypto');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  return this.findOne({
    refreshToken: hashedToken,
    refreshTokenExpires: { $gt: Date.now() },
  }).select('+refreshToken +refreshTokenExpires');
};

// Method to clear password reset token
userSchema.methods.clearPasswordResetToken = function () {
  this.passwordResetToken = null;
  this.passwordResetExpires = null;
};

// Method to clear refresh token
userSchema.methods.clearRefreshToken = function () {
  this.refreshToken = null;
  this.refreshTokenExpires = null;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
