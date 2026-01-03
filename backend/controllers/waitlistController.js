// Waitlist Controller - Handles waitlist for sold-out events

const Waitlist = require('../models/Waitlist');
const Event = require('../models/Event');
const User = require('../models/User');
const { sendWaitlistNotification, sendWaitlistJoinConfirmation } = require('../utils/emailService');

// POST /api/waitlist - Join waitlist
exports.joinWaitlist = async (req, res) => {
  try {
    const { eventId, ticketCategoryId, quantity = 1 } = req.body;
    const userId = req.userId;

    // Validate required fields
    if (!eventId || !ticketCategoryId) {
      return res.status(400).json({
        success: false,
        message: 'Event ID and ticket category ID are required',
      });
    }

    // Validate event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check if ticket category exists
    const ticket = event.tickets.find((t) => t.id === ticketCategoryId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket category not found',
      });
    }

    // Note: We no longer block users from joining waitlist even if tickets are available
    // This allows users to join waitlist as a backup option
    // The frontend already shows waitlist button only when sold out

    // Check for existing active waitlist entry
    const existingActiveEntry = await Waitlist.findOne({
      eventId,
      userId,
      ticketCategoryId,
      status: 'waiting',
    });

    if (existingActiveEntry) {
      return res.status(400).json({
        success: false,
        message: 'You are already on the waitlist for this ticket type',
      });
    }

    // Check for any existing entry (removed, expired, etc.) to reactivate
    const existingEntry = await Waitlist.findOne({
      eventId,
      userId,
      ticketCategoryId,
    });

    // Check waitlist capacity
    const currentWaitlistCount = await Waitlist.countDocuments({
      eventId,
      ticketCategoryId,
      status: 'waiting',
    });

    const maxWaitlistSize = event.maxWaitlistSize || 10;
    if (currentWaitlistCount >= maxWaitlistSize) {
      return res.status(400).json({
        success: false,
        message: `Waitlist is full (maximum ${maxWaitlistSize} entries)`,
        waitlistFull: true,
      });
    }

    let entry;
    if (existingEntry) {
      // Reactivate existing entry
      existingEntry.status = 'waiting';
      existingEntry.quantity = Math.min(quantity, 10);
      existingEntry.registeredAt = new Date();
      existingEntry.notified = false;
      existingEntry.notifiedAt = null;
      existingEntry.expiresAt = null;
      await existingEntry.save();
      entry = existingEntry;
    } else {
      // Create new waitlist entry
      entry = new Waitlist({
        eventId,
        userId,
        ticketCategoryId,
        quantity: Math.min(quantity, 10), // Max 10 per entry
      });
      await entry.save();
    }

    // Send confirmation email
    const user = await User.findById(userId);
    if (user && user.email) {
      const eventDate = new Date(event.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      sendWaitlistJoinConfirmation(
        user.email,
        user.fullName,
        { title: event.title, date: eventDate },
        ticket.type
      ).catch((err) => console.error('Failed to send waitlist email:', err));
    }

    res.status(201).json({
      success: true,
      message: 'Added to waitlist successfully',
      entry: {
        id: entry._id,
        eventId: entry.eventId,
        ticketCategoryId: entry.ticketCategoryId,
        quantity: entry.quantity,
        registeredAt: entry.registeredAt,
      },
    });
  } catch (error) {
    console.error('Join waitlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join waitlist',
      error: error.message,
    });
  }
};

// DELETE /api/waitlist/:id - Leave waitlist
exports.leaveWaitlist = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const entry = await Waitlist.findById(id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Waitlist entry not found',
      });
    }

    // Check authorization
    if (entry.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to remove this entry',
      });
    }

    entry.status = 'removed';
    await entry.save();

    res.json({
      success: true,
      message: 'Removed from waitlist',
    });
  } catch (error) {
    console.error('Leave waitlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave waitlist',
      error: error.message,
    });
  }
};

// GET /api/waitlist/event/:eventId - Get waitlist for event (EO/Admin)
exports.getWaitlistByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check authorization
    if (req.userRole !== 'admin' && event.organizerId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this waitlist',
      });
    }

    const entries = await Waitlist.getByEvent(eventId);

    // Group by ticket category
    const grouped = {};
    for (const entry of entries) {
      const catId = entry.ticketCategoryId;
      if (!grouped[catId]) {
        const ticket = event.tickets.find((t) => t.id === catId);
        grouped[catId] = {
          ticketCategoryId: catId,
          ticketType: ticket?.type || 'Unknown',
          entries: [],
        };
      }
      grouped[catId].entries.push({
        id: entry._id,
        user: entry.userId,
        quantity: entry.quantity,
        registeredAt: entry.registeredAt,
      });
    }

    res.json({
      success: true,
      waitlist: Object.values(grouped),
      totalEntries: entries.length,
    });
  } catch (error) {
    console.error('Get event waitlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get waitlist',
      error: error.message,
    });
  }
};

// GET /api/waitlist/user/:userId - Get user's waitlist entries
exports.getWaitlistByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check authorization
    if (req.userId.toString() !== userId && req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    const entries = await Waitlist.getByUser(userId);

    // Enhance with event details
    const enhancedEntries = entries.map((entry) => {
      const event = entry.eventId;
      const ticketType =
        event?.tickets?.find((t) => t.id === entry.ticketCategoryId)?.type || 'Standard';

      return {
        id: entry._id,
        eventId: event?._id,
        eventTitle: event?.title,
        eventDate: event?.date,
        eventImg: event?.img,
        ticketCategoryId: entry.ticketCategoryId,
        ticketType,
        quantity: entry.quantity,
        status: entry.status,
        registeredAt: entry.registeredAt,
        notified: entry.notified,
        notifiedAt: entry.notifiedAt,
      };
    });

    res.json({
      success: true,
      waitlist: enhancedEntries,
    });
  } catch (error) {
    console.error('Get user waitlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get waitlist',
      error: error.message,
    });
  }
};

// POST /api/waitlist/notify/:eventId - Notify waitlist when tickets available
exports.notifyWaitlist = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { ticketCategoryId, limit = 10 } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check authorization
    if (req.userRole !== 'admin' && event.organizerId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    // Get entries to notify
    const entries = await Waitlist.getNextInLine(eventId, ticketCategoryId, limit);
    const ticketType = event.tickets.find((t) => t.id === ticketCategoryId)?.type || 'Standard';

    let notifiedCount = 0;
    for (const entry of entries) {
      try {
        await entry.markNotified();

        const user = await User.findById(entry.userId);
        if (user) {
          await sendWaitlistNotification(
            user.email,
            user.fullName,
            { id: event._id, title: event.title, date: event.date },
            ticketType
          );
          notifiedCount++;
        }
      } catch (err) {
        console.error('Failed to notify waitlist entry:', err);
      }
    }

    res.json({
      success: true,
      message: `Notified ${notifiedCount} waitlist entries`,
      notifiedCount,
    });
  } catch (error) {
    console.error('Notify waitlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to notify waitlist',
      error: error.message,
    });
  }
};

// POST /api/waitlist/notify-approaching - Notify for events within 3 days
exports.notifyApproachingEvents = async (req, res) => {
  const { sendEventDateApproachingNotification } = require('../utils/emailService');

  try {
    const { daysThreshold = 3 } = req.body;

    // Calculate date range
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + daysThreshold);

    // Find events in the approaching window
    const events = await Event.find({
      status: 'active',
      date: {
        $gte: now.toISOString().split('T')[0],
        $lte: futureDate.toISOString().split('T')[0],
      },
    });

    let totalNotified = 0;
    const eventsSummary = [];

    for (const event of events) {
      // Get waitlist entries for this event that haven't been notified about approaching date
      const waitlistEntries = await Waitlist.find({
        eventId: event._id,
        status: 'waiting',
      }).populate('userId', 'email fullName');

      const eventDate = new Date(event.date);
      const daysUntilEvent = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));

      let eventNotified = 0;
      for (const entry of waitlistEntries) {
        if (entry.userId && entry.userId.email) {
          try {
            await sendEventDateApproachingNotification(
              entry.userId.email,
              entry.userId.fullName,
              {
                id: event._id,
                title: event.title,
                date: event.date,
                time: event.time,
                location: event.location,
              },
              daysUntilEvent
            );
            eventNotified++;
            totalNotified++;
          } catch (err) {
            console.error('Failed to send approaching notification:', err);
          }
        }
      }

      if (eventNotified > 0) {
        eventsSummary.push({
          eventId: event._id,
          eventTitle: event.title,
          eventDate: event.date,
          daysUntil: daysUntilEvent,
          waitlistNotified: eventNotified,
        });
      }
    }

    res.json({
      success: true,
      message: `Notified ${totalNotified} waitlisted users for ${eventsSummary.length} approaching events`,
      totalNotified,
      events: eventsSummary,
    });
  } catch (error) {
    console.error('Notify approaching events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to notify approaching events',
      error: error.message,
    });
  }
};
