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

// Dedicated Zero-Friction Mail Dispatcher
const sendOtpEmail = async (userEmail, otp, userName) => {
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; background-color: #0b192c; padding: 24px; color: #ffffff; border-radius: 12px; max-width: 480px; margin: auto;">
      <h2 style="color: #fbbf24; margin-bottom: 8px;">PlaceMe Portal</h2>
      <p style="color: #cbd5e1; font-size: 14px;">Hello ${userName || 'User'},</p>
      <p style="color: #94a3b8; font-size: 14px;">You requested a password reset. Use this OTP to verify your account:</p>
      <div style="background-color: #1e293b; padding: 16px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #fbbf24;">${otp}</span>
      </div>
      <p style="color: #94a3b8; font-size: 12px;">This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
    </div>
  `;

  try {
    const testAccount = await nodemailer.createTestAccount();
    const testTransporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const info = await testTransporter.sendMail({
      from: '"PlaceMe Security" <security@placeme.portal>',
      to: userEmail,
      subject: `Your Password Reset OTP: ${otp}`,
      html: emailHtml,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);

    console.log('\n======================================================');
    console.log('⚡ [OTP DISPATCHED SUCCESSFULLY]');
    console.log(`👤 Recipient: ${userName || 'User'} (${userEmail})`);
    console.log(`🔑 Real OTP:  >>> ${otp} <<<`);
    console.log(`⏰ Expiry:    10 Minutes`);
    if (previewUrl) {
      console.log(`🔗 Web Inbox: ${previewUrl}`);
    }
    console.log('======================================================\n');
  } catch (err) {
    console.log('\n======================================================');
    console.log(`⚡ [DIRECT FALLBACK OTP]: >>> ${otp} <<< for ${userEmail}`);
    console.log('======================================================\n');
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

// 1. Request OTP for Forgot Password
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

    await sendOtpEmail(user.email, otp, user.name);

    res.json({ message: `Password reset OTP has been sent for ${user.email}` });
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