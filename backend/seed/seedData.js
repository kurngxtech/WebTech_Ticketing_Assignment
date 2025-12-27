/**
 * Database Seed Script
 * Populates initial data for development and testing
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Event = require('../models/Event');
const Booking = require('../models/Booking');

// Sample users matching mock-users.ts
const sampleUsers = [
  {
    username: 'admin',
    email: 'admin@auditorium.com',
    password: 'adminpass123',
    role: 'admin',
    fullName: 'Admin User',
    phone: '08100000000',
    isFirstLogin: false,
  },
  {
    username: 'jane_eo',
    email: 'jane@events.com',
    password: 'eopass123',
    role: 'eo',
    fullName: 'Jane Event Organizer',
    phone: '08198765432',
    organizationName: 'Creative Events Inc',
    isFirstLogin: false,
  },
  {
    username: 'bob_eo',
    email: 'bob@events.com',
    password: 'eopass456',
    role: 'eo',
    fullName: 'Bob Event Manager',
    phone: '08156789012',
    organizationName: 'Concert Productions Ltd',
    isFirstLogin: false,
  },
  {
    username: 'john_user',
    email: 'john@example.com',
    password: 'password123',
    role: 'user',
    fullName: 'John Attendee',
    phone: '08123456789',
    isFirstLogin: false,
  },
];

// Sample events matching mock-events.ts
const sampleEvents = [
  {
    title: 'Violin Concert',
    description: '100+ Violins Live in Concert',
    img: '/login-image/orchestra-dark.jpeg',
    date: '2025-12-10',
    time: '16:00 - 23:00',
    location: 'Gelora Bung Karno',
    status: 'active',
    tickets: [
      { id: 'vip', type: 'VIP', price: 500, total: 50, sold: 5, section: 'VIP' },
      { id: 'reg', type: 'Regular', price: 350, total: 500, sold: 120, section: 'GENERAL' },
    ],
    promotionalCodes: [
      {
        code: 'SAVE20',
        discountPercentage: 20,
        expiryDate: new Date('2025-12-31'),
        maxUsage: 100,
        usedCount: 0,
      },
      {
        code: 'HALFPRICE',
        discountPercentage: 50,
        expiryDate: new Date('2025-12-15'),
        maxUsage: 50,
        usedCount: 0,
      },
    ],
  },
  {
    title: 'Elf Christmas Concert',
    description: 'Live in Jakarta - International Velodrome',
    img: '/login-image/elf-image.jpeg',
    date: '2025-11-26',
    time: '19:00 - 22:30',
    location: 'International Velodrome',
    status: 'active',
    tickets: [
      { id: 'premium', type: 'Premium', price: 600, total: 200, sold: 20, section: 'PREMIUM' },
      { id: 'regular', type: 'Regular', price: 450, total: 800, sold: 400, section: 'GENERAL' },
    ],
  },
  {
    title: 'Martha Graham Show',
    description: 'Regional Concert',
    img: '/login-image/martha-graham-show.jpeg',
    date: '2025-10-05',
    time: '18:00 - 21:00',
    location: 'Lampung Open Field',
    status: 'active',
    tickets: [{ id: 'reg', type: 'Regular', price: 150, total: 200, sold: 50, section: 'GENERAL' }],
  },
  {
    title: 'Special Drumline Performance',
    description: 'Amazing live performance',
    img: '/login-image/drumline-event.jpeg',
    date: '2025-12-12',
    time: '19:00 - 22:00',
    location: 'Jakarta Convention Center',
    status: 'active',
    tickets: [
      { id: 'vip', type: 'VIP', price: 250, total: 100, sold: 10, section: 'VIP' },
      { id: 'reg', type: 'Regular', price: 150, total: 300, sold: 250, section: 'GENERAL' },
      { id: 'early', type: 'Early Bird', price: 120, total: 50, sold: 50, section: 'PROMO' },
    ],
  },
  {
    title: 'Amazing Death Stranding Live Show',
    description: 'Death Stranding Themed Live Concert',
    img: '/login-image/death-stranding-show.jpeg',
    date: '2025-05-15',
    time: '19:00 - 22:00',
    location: 'Jakarta Convention Center',
    status: 'draft',
    tickets: [
      { id: 'vip', type: 'VIP', price: 250, total: 100, sold: 0, section: 'VIP' },
      { id: 'reg', type: 'Regular', price: 150, total: 300, sold: 0, section: 'GENERAL' },
      { id: 'early', type: 'Early Bird', price: 120, total: 50, sold: 0, section: 'PROMO' },
    ],
  },
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      console.error('❌ MONGODB_URI not set. Please configure .env file.');
      process.exit(1);
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    await User.deleteMany({});
    await Event.deleteMany({});
    await Booking.deleteMany({});

    // Create users
    console.log('👤 Creating users...');
    const createdUsers = [];

    for (const userData of sampleUsers) {
      // Let the User model's pre-save hook handle password hashing
      const user = await User.create({
        ...userData,
      });

      createdUsers.push(user);
      console.log(`  ✅ Created user: ${user.username} (${user.role})`);
    }

    // Find organizers
    const eo1 = createdUsers.find((u) => u.username === 'jane_eo');
    const eo2 = createdUsers.find((u) => u.username === 'bob_eo');

    // Create events
    console.log('📅 Creating events...');
    const organizers = [eo1, eo2, eo2, eo2, eo2]; // Assign events to organizers
    const createdEvents = [];

    for (let i = 0; i < sampleEvents.length; i++) {
      const eventData = sampleEvents[i];
      const organizer = organizers[i];

      // Calculate starting price
      const price = Math.min(...eventData.tickets.map((t) => t.price));

      const event = await Event.create({
        ...eventData,
        price,
        organizer: organizer.fullName,
        organizerId: organizer._id,
      });

      console.log(`  ✅ Created event: ${event.title}`);
      createdEvents.push(event);
    }

    // Create sample bookings for analytics
    console.log('🎫 Creating sample bookings...');
    const regularUser = createdUsers.find((u) => u.role === 'user');
    let bookingCount = 0;

    for (const event of createdEvents) {
      if (event.status !== 'active') continue;

      // Create multiple bookings for each event over different dates
      const numBookings = Math.floor(Math.random() * 10) + 5; // 5-15 bookings per event

      for (let i = 0; i < numBookings; i++) {
        const ticket = event.tickets[Math.floor(Math.random() * event.tickets.length)];
        const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 tickets

        // Create booking date within last 30 days
        const daysAgo = Math.floor(Math.random() * 30);
        const bookingDate = new Date();
        bookingDate.setDate(bookingDate.getDate() - daysAgo);

        const booking = await Booking.create({
          eventId: event._id,
          userId: regularUser._id,
          ticketCategoryId: ticket.id,
          quantity: quantity,
          pricePerTicket: ticket.price,
          totalPrice: ticket.price * quantity,
          discountApplied: 0,
          status: 'confirmed',
          paymentStatus: 'completed',
          bookingDate: bookingDate,
          qrCode: `QR_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          checkedIn: Math.random() > 0.7, // 30% checked in
        });

        bookingCount++;
      }
    }
    console.log(`  ✅ Created ${bookingCount} sample bookings`);

    console.log('\n' + '═'.repeat(50));
    console.log('🎉 Database seeded successfully!');
    console.log('═'.repeat(50));
    console.log('\n📋 Test Accounts:');
    console.log('─'.repeat(50));
    console.log('Admin:');
    console.log('  Email: admin@auditorium.com');
    console.log('  Password: adminpass123');
    console.log('');
    console.log('Event Organizer 1:');
    console.log('  Email: jane@events.com');
    console.log('  Password: eopass123');
    console.log('');
    console.log('Event Organizer 2:');
    console.log('  Email: bob@events.com');
    console.log('  Password: eopass456');
    console.log('');
    console.log('Regular User:');
    console.log('  Email: john@example.com');
    console.log('  Password: password123');
    console.log('─'.repeat(50));
    console.log('\n🚀 You can now start the server with: npm run dev\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

// Run seed
seedDatabase();
