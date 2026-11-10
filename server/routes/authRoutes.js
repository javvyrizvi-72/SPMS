const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  forgotPassword,
  resetPasswordWithOtp,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Only failed attempts are counted, so normal use is never blocked.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please wait a few minutes and try again.' },
});

router.post('/register', limiter, registerUser);
router.post('/login', limiter, loginUser);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/forgot-password', limiter, forgotPassword);
router.post('/reset-password-otp', limiter, resetPasswordWithOtp);

module.exports = router;