const mongoose = require('mongoose');
const User = require('../models/User');

const ADMIN_EMAIL = 'admin@placeme.demo';
const ADMIN_PASSWORD = 'Admin@123Password';

const wipeEverythingExceptAdmin = async () => {
  try {
    // 1. Admin ke email ke alawa baaki SAARA user data delete (Student, Company sab ek sath 0 honge)
    const result = await User.deleteMany({ email: { $ne: ADMIN_EMAIL } });
    console.log(`🧹 Deleted Non-Admin Users: ${result.deletedCount}`);

    // 2. Jobs, Applications, Profiles sab wipe
    if (mongoose.connection.collections['jobs']) {
      await mongoose.connection.collections['jobs'].deleteMany({});
    }
    if (mongoose.connection.collections['applications']) {
      await mongoose.connection.collections['applications'].deleteMany({});
    }
    if (mongoose.connection.collections['students']) {
      await mongoose.connection.collections['students'].deleteMany({});
    }
    if (mongoose.connection.collections['companies']) {
      await mongoose.connection.collections['companies'].deleteMany({});
    }

    // 3. Sirf Super Admin ensure karo
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
      console.log(`✅ Super Admin Ready: ${ADMIN_EMAIL}`);
    } else {
      admin.password = ADMIN_PASSWORD;
      admin.role = 'admin';
      admin.isApproved = true;
      await admin.save();
    }

    console.log('🚀 SYSTEM READY: Exactly 0 Students, 0 Companies, 0 Jobs.');
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