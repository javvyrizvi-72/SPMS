const mongoose = require("mongoose");
const User = require("../models/User");

const ADMIN_EMAIL = "admin@placeme.demo";
const ADMIN_PASSWORD = "Admin@123Password";

const ensureSingleAdmin = async () => {
  try {
    let admin = await User.findOne({ email: ADMIN_EMAIL });

    if (!admin) {
      // Agar pehle kisi aur email se admin bana tha jo invalid tha, safe side check
      admin = new User({
        name: "Super Admin",
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD, // User schema ka pre-save hook isko hash kar dega
        role: "admin",
        isApproved: true,
      });
      await admin.save();
      console.log(`✅ Permanent Admin Account Created: ${ADMIN_EMAIL}`);
    } else {
      // Password re-sync kar do taaki invalid double-hash overwrite ho jaye
      admin.password = ADMIN_PASSWORD;
      admin.role = "admin";
      admin.isApproved = true;
      await admin.save();
      console.log(`✅ Permanent Admin Account Synced: ${ADMIN_EMAIL}`);
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

    await ensureSingleAdmin();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
