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
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
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
    maxWaitlistSize: {
      type: Number,
      default: 10,
      min: [0, 'Waitlist size cannot be negative'],
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
// Note: slug already has an index from unique:true
eventSchema.index({ organizerId: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ date: 1 });
eventSchema.index({ 'tickets.id': 1 });

// Text index for full-text search
eventSchema.index(
  { title: 'text', description: 'text', location: 'text' },
  { weights: { title: 10, location: 5, description: 1 } }
);

// Compound index for common filter combinations
eventSchema.index({ status: 1, date: 1 });
eventSchema.index({ organizerId: 1, status: 1 });

/**
 * Static method for searching events with filters
 */
eventSchema.statics.searchEvents = async function (options = {}) {
  const {
    query, // Text search query
    status, // Event status filter
    organizerId, // Filter by organizer
    minPrice, // Minimum price filter
    maxPrice, // Maximum price filter
    startDate, // Date range start
    endDate, // Date range end
    limit = 20, // Results limit
    skip = 0, // Pagination offset
    sortBy = 'date', // Sort field
    sortOrder = 'asc', // Sort direction
  } = options;

  const filter = {};

  // Text search
  if (query && query.trim()) {
    filter.$text = { $search: query };
  }

  // Status filter
  if (status) {
    filter.status = status;
  }

  // Organizer filter
  if (organizerId) {
    filter.organizerId = organizerId;
  }

  // Price range filter (check min price of tickets)
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter['tickets'] = { $elemMatch: {} };
    if (minPrice !== undefined) {
      filter['tickets'].$elemMatch.price = { $gte: minPrice };
    }
    if (maxPrice !== undefined) {
      filter['tickets'].$elemMatch.price = {
        ...filter['tickets'].$elemMatch.price,
        $lte: maxPrice,
      };
    }
  }

  // Date range filter
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) {
      filter.date.$gte = startDate;
    }
    if (endDate) {
      filter.date.$lte = endDate;
    }
  }

  // Build sort options
  const sort = {};
  if (query && query.trim()) {
    // If text search, include text score
    sort.score = { $meta: 'textScore' };
  }
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Execute query
  let queryBuilder = this.find(filter);

  if (query && query.trim()) {
    queryBuilder = queryBuilder.select({ score: { $meta: 'textScore' } });
  }

  const [events, total] = await Promise.all([
    queryBuilder.sort(sort).skip(skip).limit(limit),
    this.countDocuments(filter),
  ]);

  return {
    events,
    total,
    page: Math.floor(skip / limit) + 1,
    totalPages: Math.ceil(total / limit),
    hasMore: skip + events.length < total,
  };
};

// Pre-save hook to generate slug from title
eventSchema.pre('save', async function (next) {
  if (this.isModified('title') || !this.slug) {
    // Generate base slug from title
    let baseSlug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();

    // Ensure uniqueness by checking existing slugs
    let slug = baseSlug;
    let counter = 1;
    const Event = this.constructor;

    while (true) {
      const existing = await Event.findOne({ slug, _id: { $ne: this._id } });
      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    this.slug = slug;
  }
  next();
});

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
