// Event Controller - Handles event CRUD, tickets, and promo codes

const Event = require('../models/Event');
const mongoose = require('mongoose');

// GET /api/events - Get all events (public)
exports.getEvents = async (req, res) => {
  try {
    const { status, organizerId, page = 1, limit = 20 } = req.query;

    const query = {};

    // Filter by status (default to active for public)
    if (status) {
      query.status = status;
    } else {
      query.status = 'active';
    }

    // Filter by organizer
    if (organizerId) {
      query.organizerId = organizerId;
    }

    const events = await Event.find(query)
      .populate('organizerId', 'fullName organizationName')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ date: 1 }); // Sort by date ascending (upcoming first)

    const total = await Event.countDocuments(query);

    res.json({
      success: true,
      events,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get events',
      error: error.message,
    });
  }
};

// GET /api/events/search - Search events with filters
exports.searchEvents = async (req, res) => {
  try {
    const {
      q, // Text search query
      status,
      organizerId,
      minPrice,
      maxPrice,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sortBy = 'date',
      sortOrder = 'asc',
    } = req.query;

    const result = await Event.searchEvents({
      query: q,
      status: status || 'active',
      organizerId,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      startDate,
      endDate,
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      sortBy,
      sortOrder,
    });

    res.json({
      success: true,
      events: result.events,
      pagination: {
        total: result.total,
        page: result.page,
        limit: parseInt(limit),
        totalPages: result.totalPages,
        hasMore: result.hasMore,
      },
    });
  } catch (error) {
    console.error('Search events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search events',
      error: error.message,
    });
  }
};

// GET /api/events/:id - Get event by ID or slug
exports.getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    let event;

    // Check if id is a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(id)) {
      event = await Event.findById(id).populate('organizerId', 'fullName organizationName email');
    }

    // If not found by ObjectId, try finding by slug
    if (!event) {
      event = await Event.findOne({ slug: id.toLowerCase() }).populate(
        'organizerId',
        'fullName organizationName email'
      );
    }

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    res.json({
      success: true,
      event,
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get event',
      error: error.message,
    });
  }
};

// GET /api/events/organizer/:organizerId - Get events by organizer
exports.getEventsByOrganizer = async (req, res) => {
  try {
    const { organizerId } = req.params;
    const { status } = req.query;

    const query = { organizerId };
    if (status) {
      query.status = status;
    }

    const events = await Event.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      events,
    });
  } catch (error) {
    console.error('Get events by organizer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get events',
      error: error.message,
    });
  }
};

// POST /api/events - Create new event (EO only)
exports.createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      img,
      date,
      time,
      location,
      tickets,
      seatingLayout,
      promotionalCodes,
      status = 'draft',
    } = req.body;

    // Calculate starting price from tickets
    const price = tickets && tickets.length > 0 ? Math.min(...tickets.map((t) => t.price)) : 0;

    const event = new Event({
      title,
      description,
      img,
      date,
      time,
      location,
      price,
      tickets: tickets || [],
      seatingLayout: seatingLayout || [],
      promotionalCodes: promotionalCodes || [],
      organizer: req.user.fullName,
      organizerId: req.userId,
      status,
    });

    await event.save();

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event,
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create event',
      error: error.message,
    });
  }
};

// PUT /api/events/:id - Update event (EO/Admin only)
exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check ownership (EO can only update their own events, Admin can update any)
    if (req.userRole !== 'admin' && event.organizerId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this event',
      });
    }

    // Update price if tickets changed
    if (updates.tickets && updates.tickets.length > 0) {
      updates.price = Math.min(...updates.tickets.map((t) => t.price));
    }

    // Apply updates
    Object.keys(updates).forEach((key) => {
      if (key !== 'organizerId' && key !== '_id') {
        event[key] = updates[key];
      }
    });

    event.updatedAt = new Date();
    await event.save();

    res.json({
      success: true,
      message: 'Event updated successfully',
      event,
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update event',
      error: error.message,
    });
  }
};

// DELETE /api/events/:id - Delete event (EO/Admin only)
exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check ownership
    if (req.userRole !== 'admin' && event.organizerId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this event',
      });
    }

    // Check if event has confirmed bookings
    const Booking = require('../models/Booking');
    const confirmedBookings = await Booking.countDocuments({
      eventId: id,
      status: 'confirmed',
    });

    if (confirmedBookings > 0) {
      // Instead of deleting, mark as cancelled
      event.status = 'cancelled';
      await event.save();
      return res.json({
        success: true,
        message: 'Event has bookings, marked as cancelled instead of deleted',
      });
    }

    await Event.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete event',
      error: error.message,
    });
  }
};

// POST /api/events/:id/tickets - Update ticket configuration
exports.updateTickets = async (req, res) => {
  try {
    const { id } = req.params;
    const { tickets } = req.body;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check ownership
    if (req.userRole !== 'admin' && event.organizerId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this event',
      });
    }

    event.tickets = tickets;
    event.price = Math.min(...tickets.map((t) => t.price));
    event.updatedAt = new Date();
    await event.save();

    res.json({
      success: true,
      message: 'Tickets updated successfully',
      event,
    });
  } catch (error) {
    console.error('Update tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tickets',
      error: error.message,
    });
  }
};

// POST /api/events/:id/promo - Add promotional code
exports.addPromotionalCode = async (req, res) => {
  try {
    const { id } = req.params;
    const promoData = req.body;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check ownership
    if (req.userRole !== 'admin' && event.organizerId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this event',
      });
    }

    // Check if code already exists
    if (event.promotionalCodes.some((p) => p.code === promoData.code.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Promotional code already exists',
      });
    }

    event.promotionalCodes.push({
      ...promoData,
      code: promoData.code.toUpperCase(),
      usedCount: 0,
    });

    event.updatedAt = new Date();
    await event.save();

    res.json({
      success: true,
      message: 'Promotional code added successfully',
      event,
    });
  } catch (error) {
    console.error('Add promo code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add promotional code',
      error: error.message,
    });
  }
};

// POST /api/events/validate-promo - Validate promotional code
exports.validatePromoCode = async (req, res) => {
  try {
    const { eventId, code } = req.body;

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    const result = event.validatePromoCode(code);

    res.json({
      success: result.valid,
      ...result,
    });
  } catch (error) {
    console.error('Validate promo code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate promotional code',
      error: error.message,
    });
  }
};
