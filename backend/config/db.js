/**
 * MongoDB Database Connection Configuration
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      console.error('❌ MONGODB_URI is not defined in environment variables');
      console.log('Please copy .env.example to .env and configure your MongoDB connection string');
      process.exit(1);
    }

    const conn = await mongoose.connect(mongoURI, {
      // These options are no longer needed in Mongoose 6+, but kept for compatibility
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    
    // Provide helpful error messages
    if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.log('\n💡 Tip: Check your MongoDB URI and ensure you have internet connectivity');
    }
    if (error.message.includes('Authentication failed')) {
      console.log('\n💡 Tip: Verify your MongoDB username and password in the connection string');
    }
    if (error.message.includes('IP whitelist')) {
      console.log('\n💡 Tip: Add your IP address to MongoDB Atlas Network Access whitelist');
    }
    
    process.exit(1);
  }
};

module.exports = connectDB;
