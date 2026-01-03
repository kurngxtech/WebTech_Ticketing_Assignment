/**
 * Authentication Controller
 * Handles user registration, login, and password management
 */

const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { sendWelcomeEmail } = require('../utils/emailService');
const { generateRandomPassword } = require('../utils/helpers');

/**
 * Register Event Organizer (Admin only)
 * POST /api/auth/register-eo
 */
exports.registerEventOrganizer = async (req, res) => {
  try {
    const { fullName, email, phone, organizationName, username, password } = req.body;

    // Check if email or username already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });

    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? 'Email' : 'Username';
      return res.status(400).json({
        success: false,
        message: `${field} is already registered`,
      });
    }

    // Generate temporary password if not provided
    const tempPassword = password || generateRandomPassword();

    // Create new Event Organizer
    const user = new User({
      fullName,
      email: email.toLowerCase(),
      phone,
      organizationName,
      username,
      password: tempPassword,
      role: 'eo',
      isFirstLogin: !password, // If password provided, no need for first login change
    });

    await user.save();

    // Send welcome email with credentials
    await sendWelcomeEmail(email, fullName, username, tempPassword);

    res.status(201).json({
      success: true,
      message: 'Event Organizer registered successfully. Welcome email sent.',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        username: user.username,
        role: user.role,
        organizationName: user.organizationName,
      },
    });
  } catch (error) {
    console.error('Register EO error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register Event Organizer',
      error: error.message,
    });
  }
};

/**
 * Register User (Public)
 * POST /api/auth/register
 */
exports.registerUser = async (req, res) => {
  try {
    const { fullName, email, phone, password, username: providedUsername } = req.body;

    // Validation
    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, and password are required',
      });
    }

    // Generate username from email if not provided
    const username = providedUsername || email.split('@')[0] + '_' + Date.now().toString(36);

    // Check if email or username already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
    });

    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? 'Email' : 'Username';
      return res.status(400).json({
        success: false,
        message: `${field} is already registered`,
      });
    }

    // Create new user
    const user = new User({
      fullName,
      email: email.toLowerCase(),
      phone,
      username,
      password,
      role: 'user',
      isFirstLogin: false,
    });

    await user.save();

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Register user error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message,
    });
  }
};

/**
 * Login
 * POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username/email and password are required',
      });
    }

    // Find user by credentials (username or email)
    const user = await User.findByCredentials(username, password);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }

    // Generate JWT token
    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        username: user.username,
        role: user.role,
        phone: user.phone,
        organizationName: user.organizationName,
        isFirstLogin: user.isFirstLogin,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message,
    });
  }
};

/**
 * Change Password
 * POST /api/auth/change-password
 */
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.userId;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Old password and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters',
      });
    }

    // Get user with password
    const user = await User.findById(userId).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify old password
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Update password
    user.password = newPassword;
    user.isFirstLogin = false;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message,
    });
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        username: user.username,
        role: user.role,
        phone: user.phone,
        organizationName: user.organizationName,
        isFirstLogin: user.isFirstLogin,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
      error: error.message,
    });
  }
};

/**
 * Verify token validity
 * GET /api/auth/verify
 */
exports.verifyToken = async (req, res) => {
  // If we reach here, token is valid (middleware passed)
  res.json({
    success: true,
    message: 'Token is valid',
    user: {
      id: req.user._id,
      role: req.user.role,
    },
  });
};

/**
 * Check username availability
 * GET /api/auth/check-username/:username
 */
exports.checkUsernameAvailability = async (req, res) => {
  try {
    const { username } = req.params;

    if (!username || username.length < 3) {
      return res.json({ available: false, message: 'Username must be at least 3 characters' });
    }

    const existingUser = await User.findOne({ username: username.toLowerCase() });

    if (existingUser) {
      return res.json({ available: false, message: 'Username is already taken' });
    }

    res.json({ available: true, message: 'Username is available' });
  } catch (error) {
    console.error('Check username error:', error);
    res.status(500).json({ available: false, message: 'Error checking availability' });
  }
};

/**
 * Check email availability
 * GET /api/auth/check-email/:email
 */
exports.checkEmailAvailability = async (req, res) => {
  try {
    const { email } = req.params;

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.json({ available: false, message: 'Invalid email format' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.json({ available: false, message: 'Email is already registered' });
    }

    res.json({ available: true, message: 'Email is available' });
  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({ available: false, message: 'Error checking availability' });
  }
};

/**
 * Forgot Password - Send reset email
 * POST /api/auth/forgot-password
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase(), isActive: true });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account exists with that email, a password reset link will be sent.',
      });
    }

    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // Send reset email
    const { sendPasswordResetEmail } = require('../utils/emailService');
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    try {
      await sendPasswordResetEmail(user.email, user.fullName, resetUrl);
    } catch (emailError) {
      // Clear token if email fails
      user.clearPasswordResetToken();
      await user.save();

      console.error('Failed to send reset email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email',
      });
    }

    res.json({
      success: true,
      message: 'If an account exists with that email, a password reset link will be sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process request',
      error: error.message,
    });
  }
};

/**
 * Reset Password - Using token from email
 * POST /api/auth/reset-password/:token
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'New password is required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    // Find user by reset token
    const user = await User.findByResetToken(token);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    // Update password and clear reset token
    user.password = password;
    user.clearPasswordResetToken();
    user.isFirstLogin = false;
    await user.save();

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message,
    });
  }
};

/**
 * Refresh Token - Get new access token using refresh token
 * POST /api/auth/refresh-token
 */
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    // Find user by refresh token
    const user = await User.findByRefreshToken(refreshToken);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
      });
    }

    // Generate new access token
    const accessToken = generateToken(user);

    // Rotate refresh token (generate new one)
    const newRefreshToken = user.generateRefreshToken();
    await user.save();

    res.json({
      success: true,
      token: accessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh token',
      error: error.message,
    });
  }
};

/**
 * Logout - Invalidate refresh token
 * POST /api/auth/logout
 */
exports.logout = async (req, res) => {
  try {
    const userId = req.userId;

    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        user.clearRefreshToken();
        await user.save();
      }
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message,
    });
  }
};
