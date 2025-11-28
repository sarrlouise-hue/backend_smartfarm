import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://pndiogouniang:mess2909@cluster0.eiw5wsu.mongodb.net/smartfarm?retryWrites=true&w=majority&appName=Cluster0';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ MongoDB Atlas connected - AGRO BOOST');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
    console.log(`🌐 Host: ${mongoose.connection.host}`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
  } catch (error) {
    console.error('');
    console.error('❌ MongoDB connection error:', error.message);
    console.error('');
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err);
});

export default connectDB;
