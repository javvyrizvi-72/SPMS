const express = require('express');
const router = express.Router();
const { 
  scheduleInterview, 
  getMyInterviews, 
  updateApplicationStatus 
} = require('../controllers/applicationController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Interview schedule route
router.post('/interview', protect, authorize('company'), scheduleInterview);

// Status update route (Shortlist, Selected, Rejected ke liye)
router.put('/:id/status', protect, authorize('company'), updateApplicationStatus);

// Student interviews fetch route
router.get('/interviews/:studentId', protect, getMyInterviews);

module.exports = router;