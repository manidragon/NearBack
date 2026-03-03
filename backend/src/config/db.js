const mongoose = require('mongoose');
const DataInitializationService = require('../services/DataInitializationService');

// Load environment variables from .env file
require('dotenv').config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB connected: ${conn.connection.host}`);

    DataInitializationService.initializeAdminUser();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1); 
  }
};

module.exports = connectDB;
