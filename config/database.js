const mongoose = require('mongoose');

module.exports.connect = async () => {
  try {
    await mongoose.connect(process.env.MONG_URL);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    throw error;
  }
};
