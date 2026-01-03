// Common Helper Functions

// Format price for display
const formatPrice = (price, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
  }).format(price);
};

// Generate a random password
const generateRandomPassword = (length = 12) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Generate order ID for payments
const generateOrderId = (prefix = 'EMS') => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

// Calculate days until date
const daysUntil = (targetDate) => {
  const target = new Date(targetDate).getTime();
  const now = Date.now();
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
};

// Check if date is in the past
const isPastDate = (date) => {
  return new Date(date).getTime() < Date.now();
};

// Paginate array
const paginate = (array, page = 1, limit = 10) => {
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  return {
    data: array.slice(startIndex, endIndex),
    pagination: {
      total: array.length,
      page: page,
      limit: limit,
      totalPages: Math.ceil(array.length / limit),
      hasNext: endIndex < array.length,
      hasPrev: page > 1,
    },
  };
};

// Sanitize object for response (remove sensitive fields)
const sanitize = (obj, fields = ['password', '__v']) => {
  const sanitized = { ...obj };
  fields.forEach((field) => delete sanitized[field]);
  return sanitized;
};

module.exports = {
  formatPrice,
  generateRandomPassword,
  generateOrderId,
  daysUntil,
  isPastDate,
  paginate,
  sanitize,
};
