const mongoose = require('mongoose');
const User = require('../models/User');

const ADMIN_EMAIL = 'admin@placeme.demo';
const ADMIN_PASSWORD = 'Admin@123Password';

const wipeEverythingExceptAdmin = async () => {
  try {
    // Sab collections saaf karo
    await User.deleteMany({ role: { $ne: 'admin' } });
    
    if (mongoose.connection.collections['jobs']) {
      await mongoose.connection.collections['jobs'].deleteMany({});
    }
    if (mongoose.connection.collections['applications']) {
      await mongoose.connection.collections['applications'].deleteMany({});
    }
    if (mongoose.connection.collections['interviews']) {
      await mongoose.connection.collections['interviews'].deleteMany({});
    }

    // Ensure only 1 Admin
    let admin = await User.findOne({ email: ADMIN_EMAIL });
    if (!admin) {
      admin = new User({
        name: 'Super Admin',
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: 'admin',
        isApproved: true,
      });
      await admin.save();
    } else {
      admin.password = ADMIN_PASSWORD;
      admin.role = 'admin';
      admin.isApproved = true;
      await admin.save();
    }

    // Extra fake admins delete
    await User.deleteMany({ role: 'admin', email: { $ne: ADMIN_EMAIL } });

    console.log('✅ DATABASE FULLY WIPED: Only 1 Admin remains.');
  } catch (err) {
    console.error('❌ Wipe Error:', err.message);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      family: 4,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await wipeEverythingExceptAdmin();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;