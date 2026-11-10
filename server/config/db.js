const mongoose = require('mongoose');
const User = require('../models/User');

const PERMANENT_USERS = [
  // 1. Super Admin
  {
    name: 'Super Admin',
    email: 'admin@placeme.demo',
    password: 'Admin@123Password',
    role: 'admin',
    isApproved: true,
  },
  // 2. Demo Student
  {
    name: 'Demo Student',
    email: 'student@placeme.demo',
    password: 'password123',
    role: 'student',
    isApproved: true,
  },
  // 3. Companies
  {
    name: 'TechCorp Recruiter',
    email: 'hr@techcorp.demo',
    password: 'password123',
    role: 'company',
    companyName: 'TechCorp Solutions',
    website: 'https://techcorp.demo',
    isApproved: true,
  },
  {
    name: 'CodeCraft Recruiter',
    email: 'hr@codecraft.demo',
    password: 'password123',
    role: 'company',
    companyName: 'CodeCraft Solutions',
    website: 'https://codecraft.demo',
    isApproved: true,
  },
  {
    name: 'InnovateLabs Recruiter',
    email: 'hr@innovatelabs.demo',
    password: 'password123',
    role: 'company',
    companyName: 'InnovateLabs',
    website: 'https://innovatelabs.demo',
    isApproved: true,
  },
  {
    name: 'CyberShield Recruiter',
    email: 'hr@cybershield.demo',
    password: 'password123',
    role: 'company',
    companyName: 'CyberShield Security',
    website: 'https://cybershield.demo',
    isApproved: true,
  },
  {
    name: 'DataPulse Recruiter',
    email: 'hr@datapulse.demo',
    password: 'password123',
    role: 'company',
    companyName: 'DataPulse Analytics',
    website: 'https://datapulse.demo',
    isApproved: true,
  },
];

const syncAllPermanentAccounts = async () => {
  try {
    for (const acc of PERMANENT_USERS) {
      let user = await User.findOne({ email: acc.email });
      if (!user) {
        user = new User(acc);
        await user.save();
        console.log(`✅ Created ${acc.role.toUpperCase()}: ${acc.email}`);
      } else {
        // Password aur role re-sync taaki pre-save hash sahi rahe
        user.password = acc.password;
        user.role = acc.role;
        user.isApproved = true;
        if (acc.companyName) user.companyName = acc.companyName;
        if (acc.website) user.website = acc.website;
        await user.save();
      }
    }
    console.log('✅ All permanent accounts (Admin, Student, Companies) fully synchronized.');
  } catch (err) {
    console.error(`❌ Sync permanent accounts error: ${err.message}`);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      family: 4,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Ek sath sabhi permanent accounts sync
    await syncAllPermanentAccounts();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;