const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User'); // Agar path alag ho toh match kar lena

// Fixed Permanent Admin Credentials
const ADMIN_EMAIL = 'admin@placeme.demo';
const ADMIN_PASSWORD = 'Admin@123Password';

const ensureSingleAdmin = async () => {
  try {
    const existingAdmin = await User.findOne({ 
      $or: [{ email: ADMIN_EMAIL }, { role: 'admin' }] 
    });

    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

      await User.create({
        name: 'Super Admin',
        email: ADMIN_EMAIL,
        password: hashedPassword,
        role: 'admin',
        isApproved: true,
      });
      console.log(`✅ Permanent Admin Account Created: ${ADMIN_EMAIL}`);
    } else {
      console.log(`✅ Permanent Admin Account Verified: ${existingAdmin.email}`);
    }
  } catch (err) {
    console.error(`❌ Admin check/creation error: ${err.message}`);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      family: 4,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Har connect pe single admin verify aur ensure karega
    await ensureSingleAdmin();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;