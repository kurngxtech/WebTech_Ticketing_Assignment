/**
 * Cron Job Service
 * Handles scheduled tasks for the application
 */

const cron = require('node-cron');
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const User = require('../models/User');
const Waitlist = require('../models/Waitlist');
const { sendWaitlistNotification, sendCancellationConfirmation } = require('../utils/emailService');

/**
 * Auto-cancel expired pending bookings
 * Runs every hour
 */
const cancelExpiredBookings = async () => {
  console.log('⏰ Running expired booking cleanup...');

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Find pending bookings older than 24 hours
    const expirationTime = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const expiredBookings = await Booking.find({
      status: 'pending',
      paymentStatus: 'pending',
      bookingDate: { $lt: expirationTime },
    }).session(session);

    console.log(`  Found ${expiredBookings.length} expired bookings`);

    for (const booking of expiredBookings) {
      try {
        // Update booking status
        booking.status = 'cancelled';
        booking.paymentStatus = 'expired';
        booking.cancellationReason = 'Payment not completed within 24 hours';
        booking.cancellationDate = new Date();
        await booking.save({ session });

        // Restore tickets to event
        const event = await Event.findById(booking.eventId).session(session);
        if (event) {
          const ticketIndex = event.tickets.findIndex((t) => t.id === booking.ticketCategoryId);
          if (ticketIndex !== -1) {
            event.tickets[ticketIndex].sold = Math.max(
              0,
              event.tickets[ticketIndex].sold - booking.quantity
            );
            await event.save({ session });

            // Notify waitlist
            const waitlistEntries = await Waitlist.getNextInLine(
              event._id,
              booking.ticketCategoryId,
              1
            );

            for (const entry of waitlistEntries) {
              await entry.markNotified();
              const entryUser = await User.findById(entry.userId);
              if (entryUser) {
                const ticketType = event.tickets[ticketIndex]?.type || 'Standard';
                await sendWaitlistNotification(
                  entryUser.email,
                  entryUser.fullName,
                  { id: event._id, title: event.title, date: event.date },
                  ticketType
                );
              }
            }
          }
        }

        // Notify user about cancellation
        const user = await User.findById(booking.userId);
        if (user && event) {
          const ticketType =
            event.tickets.find((t) => t.id === booking.ticketCategoryId)?.type || 'Standard';

          await sendCancellationConfirmation(
            user.email,
            user.fullName,
            {
              id: booking._id,
              quantity: booking.quantity,
              ticketType,
              totalPrice: booking.totalPrice,
            },
            { title: event.title }
          );
        }

        console.log(`  ✅ Cancelled booking ${booking._id}`);
      } catch (bookingError) {
        console.error(`  ❌ Failed to cancel booking ${booking._id}:`, bookingError.message);
      }
    }

    await session.commitTransaction();
    console.log(`  ✅ Cleanup completed: ${expiredBookings.length} bookings cancelled`);

    return { cancelled: expiredBookings.length };
  } catch (error) {
    await session.abortTransaction();
    console.error('  ❌ Expired booking cleanup failed:', error.message);
    return { error: error.message };
  } finally {
    session.endSession();
  }
};

/**
 * Send event reminders to confirmed attendees
 * Runs daily at 9 AM
 */
const sendEventReminders = async () => {
  console.log('⏰ Sending event reminders...');

  try {
    // Find events happening tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    const upcomingEvents = await Event.find({
      date: { $gte: tomorrow, $lt: dayAfterTomorrow },
      status: 'published',
    });

    console.log(`  Found ${upcomingEvents.length} events happening tomorrow`);

    let remindersSent = 0;

    for (const event of upcomingEvents) {
      // Get confirmed bookings for this event
      const bookings = await Booking.find({
        eventId: event._id,
        status: 'confirmed',
      }).populate('userId', 'email fullName');

      for (const booking of bookings) {
        // Note: You can implement a reminder email function here
        console.log(`  📧 Would send reminder to ${booking.userId.email} for ${event.title}`);
        remindersSent++;
      }
    }

    console.log(`  ✅ Reminders processed: ${remindersSent}`);
    return { remindersSent };
  } catch (error) {
    console.error('  ❌ Event reminders failed:', error.message);
    return { error: error.message };
  }
};

/**
 * Clean up old activity logs
 * Runs weekly on Sundays at 3 AM
 */
const cleanupOldLogs = async () => {
  console.log('⏰ Cleaning up old activity logs...');

  try {
    const ActivityLog = require('../models/ActivityLog');

    // Delete logs older than 90 days (as backup to TTL index)
    const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const result = await ActivityLog.deleteMany({
      timestamp: { $lt: cutoffDate },
    });

    console.log(`  ✅ Deleted ${result.deletedCount} old activity logs`);
    return { deleted: result.deletedCount };
  } catch (error) {
    console.error('  ❌ Activity log cleanup failed:', error.message);
    return { error: error.message };
  }
};

/**
 * Initialize all cron jobs
 */
const initCronJobs = () => {
  console.log('🕐 Initializing cron jobs...');

  // Cancel expired bookings every hour
  cron.schedule('0 * * * *', async () => {
    await cancelExpiredBookings();
  });
  console.log('  ✅ Expired booking cleanup: Every hour');

  // Send event reminders daily at 9 AM
  cron.schedule('0 9 * * *', async () => {
    await sendEventReminders();
  });
  console.log('  ✅ Event reminders: Daily at 9 AM');

  // Cleanup old logs weekly on Sundays at 3 AM
  cron.schedule('0 3 * * 0', async () => {
    await cleanupOldLogs();
  });
  console.log('  ✅ Log cleanup: Weekly on Sundays at 3 AM');

  console.log('✅ Cron jobs initialized\n');
};

/**
 * Run a specific job manually (for testing)
 */
const runJob = async (jobName) => {
  switch (jobName) {
    case 'cancelExpiredBookings':
      return await cancelExpiredBookings();
    case 'sendEventReminders':
      return await sendEventReminders();
    case 'cleanupOldLogs':
      return await cleanupOldLogs();
    default:
      throw new Error(`Unknown job: ${jobName}`);
  }
};

module.exports = {
  initCronJobs,
  runJob,
  cancelExpiredBookings,
  sendEventReminders,
  cleanupOldLogs,
};
