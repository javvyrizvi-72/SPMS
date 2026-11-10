const mongoose = require('mongoose');
const User = require('../models/User');

const ADMIN_EMAIL = 'admin@placeme.demo';
const ADMIN_PASSWORD = 'Admin@123Password';

const resetDatabaseKeepOnlyAdmin = async () => {
  try {
    // 1. Admin ke alawa baki sabhi users (students, companies) ko delete karo
    const deletedUsers = await User.deleteMany({ role: { $ne: 'admin' } });
    console.log(`🧹 Deleted non-admin users: ${deletedUsers.deletedCount}`);

    // 2. Jobs collection clean karo
    if (mongoose.connection.collections['jobs']) {
      await mongoose.connection.collections['jobs'].deleteMany({});
      console.log('🧹 All jobs deleted');
    }

    // 3. Applications collection clean karo
    if (mongoose.connection.collections['applications']) {
      await mongoose.connection.collections['applications'].deleteMany({});
      console.log('🧹 All applications deleted');
    }

    // 4. Sirf ek fixed Admin ensure karo
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
      console.log(`✅ Single Permanent Admin Created: ${ADMIN_EMAIL}`);
    } else {
      admin.password = ADMIN_PASSWORD;
      admin.role = 'admin';
      admin.isApproved = true;
      await admin.save();
      console.log(`✅ Single Permanent Admin Verified: ${ADMIN_EMAIL}`);
    }

    // Agar koi aur admin account galti se bana ho toh use bhi clean kar do
    await User.deleteMany({ role: 'admin', email: { $ne: ADMIN_EMAIL } });

    console.log('🚀 Database fully cleaned. Only Super Admin remains.');
  } catch (err) {
    console.error(`❌ Reset error: ${err.message}`);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      family: 4,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // DB connect hote hi poora data clean karke sirf Admin lock karega
    await resetDatabaseKeepOnlyAdmin();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;