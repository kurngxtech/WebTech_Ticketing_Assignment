/**
 * Common Helper Functions
 */

/**
 * Format price for display
 * @param {number} price - Price in cents/units
 * @param {string} currency - Currency code
 * @returns {string} Formatted price string
 */
const formatPrice = (price, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0
  }).format(price);
};

/**
 * Generate a random password
 * @param {number} length - Password length
 * @returns {string} Random password
 */
const generateRandomPassword = (length = 12) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

/**
 * Generate order ID for payments
 * @param {string} prefix - Order ID prefix
 * @returns {string} Unique order ID
 */
const generateOrderId = (prefix = 'EMS') => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Calculate days until date
 * @param {string|Date} targetDate - Target date
 * @returns {number} Days until target date
 */
const daysUntil = (targetDate) => {
  const target = new Date(targetDate).getTime();
  const now = Date.now();
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
};

/**
 * Check if date is in the past
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is in the past
 */
const isPastDate = (date) => {
  return new Date(date).getTime() < Date.now();
};

/**
 * Paginate array
 * @param {Array} array - Array to paginate
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 * @returns {Object} Paginated result
 */
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
      hasPrev: page > 1
    }
  };
};

/**
 * Sanitize object for response (remove sensitive fields)
 * @param {Object} obj - Object to sanitize
 * @param {string[]} fields - Fields to remove
 * @returns {Object} Sanitized object
 */
const sanitize = (obj, fields = ['password', '__v']) => {
  const sanitized = { ...obj };
  fields.forEach(field => delete sanitized[field]);
  return sanitized;
};

module.exports = {
  formatPrice,
  generateRandomPassword,
  generateOrderId,
  daysUntil,
  isPastDate,
  paginate,
  sanitize
};
