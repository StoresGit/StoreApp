const mongoose = require('mongoose');
require('dotenv').config();

console.log('🔍 Testing MongoDB connection...');
console.log('📡 Connection string:', process.env.MONGODB_URI ? 'Found' : 'Missing');

// Test connection with timeout
const testConnection = async () => {
  try {
    console.log('🔄 Attempting to connect...');
    
    const connection = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      socketTimeoutMS: 45000, // 45 second timeout
    });
    
    console.log('✅ MongoDB connected successfully!');
    console.log('📊 Database:', connection.connection.db.databaseName);
    
    // Test a simple query
    const collections = await connection.connection.db.listCollections().toArray();
    console.log('📁 Collections found:', collections.length);
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected successfully');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:');
    console.error('   Error:', error.message);
    console.error('   Code:', error.code);
    
    if (error.code === 'ENOTFOUND') {
      console.log('💡 Suggestion: Check your internet connection');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('💡 Suggestion: MongoDB Atlas might be paused or having issues');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 Suggestion: Try using a local MongoDB instance');
    }
  }
};

testConnection(); 