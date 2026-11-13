const User = require('../models/User');
const Student = require('../models/Student');
const Company = require('../models/Company');
const Notification = require('../models/Notification');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const emailQuery = (email) => ({ email: new RegExp(`^${escapeRegex(email)}$`, 'i') });

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

const authResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar || '',
  isApproved: user.isApproved,
  token: generateToken(user._id),
});

// Non-blocking Mail Dispatcher with strict 5s timeout so API never hangs
const sendOtpEmail = async (userEmail, otp, userName) => {
  console.log('\n======================================================');
  console.log(`⚡ [OTP GENERATED]: >>> ${otp} <<< for ${userName || 'User'} (${userEmail})`);
  console.log('======================================================\n');

  try {
    const hasRealSmtp =
      process.env.EMAIL_USER &&
      process.env.EMAIL_PASS &&
      !process.env.EMAIL_USER.includes('your_email');

    if (!hasRealSmtp) return;

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: false,
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 5000,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"PlaceMe Security" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `Your Password Reset OTP: ${otp}`,
      html: `<div style="font-family: Arial, sans-serif; padding: 20px;"><h2>PlaceMe Password Reset</h2><p>Hello ${userName || 'User'}, your OTP is: <strong>${otp}</strong> (valid for 10 minutes).</p></div>`,
    });
  } catch (err) {
    console.error('SMTP delivery skipped/failed:', err.message);
  }
};

const ensureProfile = async (user, extra = {}) => {
  if (user.role === 'student') {
    if (!(await Student.exists({ user: user._id }))) {
      await Student.create({ user: user._id, isApproved: true });
    }
  } else if (user.role === 'company') {
    if (!(await Company.exists({ user: user._id }))) {
      await Company.create({ 
        user: user._id, 
        companyName: extra.companyName || user.name,
        industry: extra.industry || 'IT Services & Software',
        location: extra.location || 'India',
        website: extra.website || '',
        description: extra.description || '',
        isApproved: false 
      });
    }
  }
};

const registerUser = async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const role = req.body.role;
    const companyName = String(req.body.companyName || '').trim();
    const industry = String(req.body.industry || '').trim();
    const location = String(req.body.location || '').trim();
    const website = String(req.body.website || '').trim();

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    if (!['student', 'company'].includes(role)) {
      return res.status(400).json({ message: 'Please choose a valid role: student or company' });
    }
    if (await User.findOne(emailQuery(email))) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const isApproved = role === 'student';

    const user = await User.create({ name, email, password, role, isApproved });
    try {
      await ensureProfile(user, { companyName, industry, location, website });
    } catch (profileError) {
      await User.findByIdAndDelete(user._id);
      throw profileError;
    }

    try {
      const adminUser = await User.findOne({ role: 'admin' });
      if (adminUser) {
        if (role === 'company') {
          await Notification.create({
            recipient: adminUser._id,
            title: '🏢 New Company Registration',
            message: `${companyName || name} (${email}) has registered and is pending verification.`,
            type: 'company_registration',
          });
        } else if (role === 'student') {
          await Notification.create({
            recipient: adminUser._id,
            title: '🎓 New Student Joined',
            message: `${name} (${email}) registered on the placement platform.`,
            type: 'student_registration',
          });
        }
      }
    } catch (notifyErr) {
      console.error('Admin notification error:', notifyErr.message);
    }

    res.status(201).json(authResponse(user));
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    console.error('Register error:', error.message);
    res.status(500).json({ message: 'Could not create the account. Please try again.' });
  }
};

const loginUser = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne(emailQuery(email));
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    await ensureProfile(user);
    res.json(authResponse(user));
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Could not sign in. Please try again.' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (req.body.name) user.name = String(req.body.name).trim();
    if (req.body.avatar !== undefined) user.avatar = String(req.body.avatar).trim();

    await user.save();

    res.json(authResponse(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 1. Request OTP for Forgot Password (Instantaneous)
const forgotPassword = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid registered email' });
    }

    const user = await User.findOne(emailQuery(email));
    if (!user) {
      return res.status(404).json({ message: 'No registered user found with this email' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOtp = otp;
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
    await user.save();

    // Fire and forget so API responds immediately
    sendOtpEmail(user.email, otp, user.name);

    res.json({
      message: `Verification OTP generated for ${user.email}`,
      otp,
    });
  } catch (error) {
    console.error('Forgot password error:', error.message);
    res.status(500).json({ message: 'Failed to process forgot password request' });
  }
};

// 2. Verify OTP & Update Password in Database
const resetPasswordWithOtp = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const otp = String(req.body.otp || '').trim();
    const newPassword = String(req.body.newPassword || '');

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findOne(emailQuery(email));
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.resetPasswordOtp || user.resetPasswordOtp !== otp) {
      return res.status(400).json({ message: 'Invalid or incorrect OTP' });
    }

    if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one' });
    }

    // Password updated in MongoDB (User schema hook hashes it securely)
    user.password = newPassword;
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password updated successfully! Please login with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error.message);
    res.status(500).json({ message: 'Failed to reset password. Please try again.' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  forgotPassword,
  resetPasswordWithOtp,
};