const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { chat, info } = require('../controllers/chatController');
const { optionalAuth } = require('../middleware/authMiddleware');

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'You are sending messages too fast. Please wait a moment.' },
});

router.get('/', optionalAuth, info);
router.post('/', limiter, optionalAuth, chat);

module.exports = router;
