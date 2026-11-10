const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/authMiddleware');

// GET /api/notifications - Get logged-in user's notifications
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const notifications = await Notification.find({
      $or: [
        { recipient: userId },
        { user: userId }
      ]
    }).sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', protect, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;