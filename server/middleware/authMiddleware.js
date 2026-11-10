const jwt = require('jsonwebtoken');
const User = require('../models/User');

const getToken = (req) => {
  const h = req.headers.authorization;
  return h && h.startsWith('Bearer') ? h.split(' ')[1] : null;
};

const protect = async (req, res, next) => {
  try {
    const token = getToken(req);
    if (!token) return res.status(401).json({ message: 'Not authorized, no token' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: 'Not authorized, user no longer exists' });
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// Same as protect but never blocks: req.user is set only when a valid token is sent.
const optionalAuth = async (req, res, next) => {
  try {
    const token = getToken(req);
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = (await User.findById(decoded.id).select('-password')) || undefined;
    }
  } catch (e) { /* ignore invalid token, treat as guest */ }
  next();
};

module.exports = { protect, optionalAuth };
