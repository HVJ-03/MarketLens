import mongoose from 'mongoose';

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('⚠️  MONGODB_URI is not set. Server will start but database features will not work.');
    console.warn('   → Set up MongoDB Atlas (free): https://cloud.mongodb.com');
    console.warn('   → Then add MONGODB_URI to server/.env');
    return;
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.warn('   Server will continue but database features will not work.');
  }
};
