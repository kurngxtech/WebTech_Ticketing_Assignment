// Analytics Controller - MongoDB Aggregation Pipeline for reports

const mongoose = require('mongoose');
const Event = require('../models/Event');
const Booking = require('../models/Booking');

// GET /api/analytics/event/:eventId - Get event analytics
exports.getEventAnalytics = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check authorization (EO can only view their own events, Admin can view all)
    if (req.userRole !== 'admin' && event.organizerId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view analytics for this event',
      });
    }

    // Use MongoDB Aggregation for analytics
    const bookingStats = await Booking.aggregate([
      {
        $match: {
          eventId: new mongoose.Types.ObjectId(eventId),
          status: { $in: ['confirmed', 'pending'] },
        },
      },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalTicketsSold: { $sum: '$quantity' },
          totalRevenue: { $sum: '$totalPrice' },
          avgOrderValue: { $avg: '$totalPrice' },
          confirmedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] },
          },
          pendingCount: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
          },
          checkedInCount: {
            $sum: { $cond: ['$checkedIn', 1, 0] },
          },
        },
      },
    ]);

    // Revenue by ticket type
    const revenueByTicketType = await Booking.aggregate([
      {
        $match: {
          eventId: new mongoose.Types.ObjectId(eventId),
          status: 'confirmed',
        },
      },
      {
        $group: {
          _id: '$ticketCategoryId',
          sold: { $sum: '$quantity' },
          revenue: { $sum: '$totalPrice' },
        },
      },
    ]);

    // Bookings by date (daily breakdown)
    const bookingsByDate = await Booking.aggregate([
      {
        $match: {
          eventId: new mongoose.Types.ObjectId(eventId),
          status: { $in: ['confirmed', 'pending'] },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$bookingDate' } },
          count: { $sum: 1 },
          revenue: { $sum: '$totalPrice' },
          ticketsSold: { $sum: '$quantity' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Calculate totals and occupancy
    const totalSeats = event.tickets.reduce((sum, t) => sum + t.total, 0);
    const totalSold = event.tickets.reduce((sum, t) => sum + t.sold, 0);
    const occupancyRate = totalSeats > 0 ? (totalSold / totalSeats) * 100 : 0;

    // Map ticket type stats
    const byTicketType = {};
    for (const stat of revenueByTicketType) {
      const ticket = event.tickets.find((t) => t.id === stat._id);
      byTicketType[stat._id] = {
        ticketType: ticket?.type || 'Unknown',
        sold: stat.sold,
        revenue: stat.revenue,
        total: ticket?.total || 0,
        occupancy: ticket ? (stat.sold / ticket.total) * 100 : 0,
      };
    }

    const stats = bookingStats[0] || {
      totalBookings: 0,
      totalTicketsSold: 0,
      totalRevenue: 0,
      avgOrderValue: 0,
      confirmedCount: 0,
      pendingCount: 0,
      checkedInCount: 0,
    };

    res.json({
      success: true,
      analytics: {
        eventId: event._id,
        eventTitle: event.title,
        eventDate: event.date,
        summary: {
          totalBookings: stats.totalBookings,
          totalTicketsSold: stats.totalTicketsSold,
          totalRevenue: stats.totalRevenue,
          avgOrderValue: Math.round(stats.avgOrderValue * 100) / 100,
          totalSeats,
          occupancyRate: Math.round(occupancyRate * 100) / 100,
          confirmedBookings: stats.confirmedCount,
          pendingBookings: stats.pendingCount,
          checkedInCount: stats.checkedInCount,
        },
        byTicketType,
        bookingsByDate: bookingsByDate.map((d) => ({
          date: d._id,
          count: d.count,
          revenue: d.revenue,
          ticketsSold: d.ticketsSold,
        })),
      },
    });
  } catch (error) {
    console.error('Get event analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics',
      error: error.message,
    });
  }
};

// GET /api/analytics/auditorium - Get auditorium-wide analytics (Admin)
exports.getAuditoriumAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, period = 'monthly' } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate);
    }

    const matchStage = { status: 'confirmed' };
    if (Object.keys(dateFilter).length > 0) {
      matchStage.bookingDate = dateFilter;
    }

    // Overall statistics
    const overallStats = await Booking.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalTicketsSold: { $sum: '$quantity' },
          totalRevenue: { $sum: '$totalPrice' },
          uniqueEvents: { $addToSet: '$eventId' },
        },
      },
      {
        $project: {
          totalBookings: 1,
          totalTicketsSold: 1,
          totalRevenue: 1,
          totalEvents: { $size: '$uniqueEvents' },
        },
      },
    ]);

    // Revenue by time period
    let dateFormat;
    switch (period) {
      case 'daily':
        dateFormat = '%Y-%m-%d';
        break;
      case 'weekly':
        dateFormat = '%Y-W%V';
        break;
      case 'monthly':
      default:
        dateFormat = '%Y-%m';
    }

    const revenueByPeriod = await Booking.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$bookingDate' } },
          revenue: { $sum: '$totalPrice' },
          bookings: { $sum: 1 },
          ticketsSold: { $sum: '$quantity' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Top events by revenue
    const topEvents = await Booking.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$eventId',
          revenue: { $sum: '$totalPrice' },
          ticketsSold: { $sum: '$quantity' },
          bookings: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'events',
          localField: '_id',
          foreignField: '_id',
          as: 'event',
        },
      },
      { $unwind: '$event' },
      {
        $project: {
          eventId: '$_id',
          eventTitle: '$event.title',
          eventDate: '$event.date',
          revenue: 1,
          ticketsSold: 1,
          bookings: 1,
        },
      },
    ]);

    // Event counts by status
    const eventCounts = await Event.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Calculate overall occupancy
    const allEvents = await Event.find({});
    let totalSeats = 0;
    let totalOccupied = 0;
    for (const event of allEvents) {
      totalSeats += event.tickets.reduce((sum, t) => sum + t.total, 0);
      totalOccupied += event.tickets.reduce((sum, t) => sum + t.sold, 0);
    }

    const stats = overallStats[0] || {
      totalBookings: 0,
      totalTicketsSold: 0,
      totalRevenue: 0,
      totalEvents: 0,
    };

    res.json({
      success: true,
      analytics: {
        period,
        dateRange: { startDate, endDate },
        summary: {
          totalBookings: stats.totalBookings,
          totalTicketsSold: stats.totalTicketsSold,
          totalRevenue: stats.totalRevenue,
          totalEvents: allEvents.length,
          totalSeats,
          occupancyRate: totalSeats > 0 ? (totalOccupied / totalSeats) * 100 : 0,
        },
        revenueByPeriod: revenueByPeriod.map((p) => ({
          period: p._id,
          revenue: p.revenue,
          bookings: p.bookings,
          ticketsSold: p.ticketsSold,
        })),
        topEvents,
        eventsByStatus: eventCounts.reduce((obj, item) => {
          obj[item._id] = item.count;
          return obj;
        }, {}),
      },
    });
  } catch (error) {
    console.error('Get auditorium analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics',
      error: error.message,
    });
  }
};

// GET /api/analytics/revenue - Get revenue report
exports.getRevenueReport = async (req, res) => {
  try {
    const { eventId, period = 'daily', startDate, endDate } = req.query;

    // Build match stage
    const matchStage = { status: 'confirmed' };

    if (eventId) {
      // Check authorization for specific event
      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found',
        });
      }

      if (req.userRole !== 'admin' && event.organizerId.toString() !== req.userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized',
        });
      }

      matchStage.eventId = new mongoose.Types.ObjectId(eventId);
    } else if (req.userRole === 'eo') {
      // EO can only see their own event revenue
      const eoEvents = await Event.find({ organizerId: req.userId }).select('_id');
      matchStage.eventId = { $in: eoEvents.map((e) => e._id) };
    }

    // Date filter
    if (startDate || endDate) {
      matchStage.bookingDate = {};
      if (startDate) matchStage.bookingDate.$gte = new Date(startDate);
      if (endDate) matchStage.bookingDate.$lte = new Date(endDate);
    }

    // Date format for grouping
    let dateFormat;
    switch (period) {
      case 'daily':
        dateFormat = '%Y-%m-%d';
        break;
      case 'weekly':
        dateFormat = '%Y-W%V';
        break;
      case 'monthly':
      default:
        dateFormat = '%Y-%m';
    }

    const revenueData = await Booking.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$bookingDate' } },
          revenue: { $sum: '$totalPrice' },
          bookings: { $sum: 1 },
          ticketsSold: { $sum: '$quantity' },
          avgOrderValue: { $avg: '$totalPrice' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Calculate totals
    const totals = revenueData.reduce(
      (acc, item) => {
        acc.totalRevenue += item.revenue;
        acc.totalBookings += item.bookings;
        acc.totalTickets += item.ticketsSold;
        return acc;
      },
      { totalRevenue: 0, totalBookings: 0, totalTickets: 0 }
    );

    res.json({
      success: true,
      report: {
        period,
        dateRange: { startDate, endDate },
        totals,
        data: revenueData.map((d) => ({
          period: d._id,
          revenue: d.revenue,
          bookings: d.bookings,
          ticketsSold: d.ticketsSold,
          avgOrderValue: Math.round(d.avgOrderValue * 100) / 100,
        })),
      },
    });
  } catch (error) {
    console.error('Get revenue report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get revenue report',
      error: error.message,
    });
  }
};

// GET /api/analytics/occupancy - Get occupancy report
exports.getOccupancyReport = async (req, res) => {
  try {
    const { eventId } = req.query;

    let events;

    if (eventId) {
      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found',
        });
      }

      if (req.userRole !== 'admin' && event.organizerId.toString() !== req.userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized',
        });
      }

      events = [event];
    } else if (req.userRole === 'admin') {
      events = await Event.find({});
    } else {
      events = await Event.find({ organizerId: req.userId });
    }

    const occupancyData = events.map((event) => {
      const ticketStats = event.tickets.map((ticket) => ({
        ticketId: ticket.id,
        ticketType: ticket.type,
        section: ticket.section,
        total: ticket.total,
        sold: ticket.sold,
        available: ticket.total - ticket.sold,
        occupancy: ticket.total > 0 ? (ticket.sold / ticket.total) * 100 : 0,
      }));

      const totalSeats = event.tickets.reduce((sum, t) => sum + t.total, 0);
      const totalSold = event.tickets.reduce((sum, t) => sum + t.sold, 0);

      return {
        eventId: event._id,
        eventTitle: event.title,
        eventDate: event.date,
        status: event.status,
        totalSeats,
        totalSold,
        totalAvailable: totalSeats - totalSold,
        overallOccupancy: totalSeats > 0 ? (totalSold / totalSeats) * 100 : 0,
        byTicketType: ticketStats,
      };
    });

    // Calculate overall stats
    const overallStats = occupancyData.reduce(
      (acc, event) => {
        acc.totalSeats += event.totalSeats;
        acc.totalSold += event.totalSold;
        return acc;
      },
      { totalSeats: 0, totalSold: 0 }
    );

    res.json({
      success: true,
      report: {
        summary: {
          totalEvents: events.length,
          totalSeats: overallStats.totalSeats,
          totalSold: overallStats.totalSold,
          totalAvailable: overallStats.totalSeats - overallStats.totalSold,
          overallOccupancy:
            overallStats.totalSeats > 0
              ? (overallStats.totalSold / overallStats.totalSeats) * 100
              : 0,
        },
        events: occupancyData,
      },
    });
  } catch (error) {
    console.error('Get occupancy report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get occupancy report',
      error: error.message,
    });
  }
};

// GET /api/analytics/sales - Get sales report
exports.getSalesReport = async (req, res) => {
  try {
    const { eventId, period = 'daily' } = req.query;

    // Build authorization filter
    let eventFilter = {};

    if (eventId) {
      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found',
        });
      }

      if (req.userRole !== 'admin' && event.organizerId.toString() !== req.userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized',
        });
      }

      eventFilter = { eventId: new mongoose.Types.ObjectId(eventId) };
    } else if (req.userRole === 'eo') {
      const eoEvents = await Event.find({ organizerId: req.userId }).select('_id');
      eventFilter = { eventId: { $in: eoEvents.map((e) => e._id) } };
    }

    // Sales by ticket type
    const salesByType = await Booking.aggregate([
      { $match: { ...eventFilter, status: 'confirmed' } },
      {
        $group: {
          _id: {
            eventId: '$eventId',
            ticketCategoryId: '$ticketCategoryId',
          },
          totalSold: { $sum: '$quantity' },
          totalRevenue: { $sum: '$totalPrice' },
          avgPrice: { $avg: '$pricePerTicket' },
        },
      },
      {
        $lookup: {
          from: 'events',
          localField: '_id.eventId',
          foreignField: '_id',
          as: 'event',
        },
      },
      { $unwind: '$event' },
    ]);

    // Enhance with ticket type names
    const enhancedSales = salesByType.map((sale) => {
      const ticket = sale.event.tickets.find((t) => t.id === sale._id.ticketCategoryId);
      return {
        eventTitle: sale.event.title,
        ticketType: ticket?.type || 'Unknown',
        section: ticket?.section || 'N/A',
        totalSold: sale.totalSold,
        totalRevenue: sale.totalRevenue,
        avgPrice: Math.round(sale.avgPrice * 100) / 100,
      };
    });

    res.json({
      success: true,
      report: {
        salesByTicketType: enhancedSales,
      },
    });
  } catch (error) {
    console.error('Get sales report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sales report',
      error: error.message,
    });
  }
};
