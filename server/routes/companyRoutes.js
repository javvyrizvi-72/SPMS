const express = require('express');
const router = express.Router();
const { getCompanyProfile, updateCompanyProfile, getAllCompanies } = require('../controllers/companyController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/profile', protect, authorize('company'), getCompanyProfile);
router.put('/profile', protect, authorize('company'), updateCompanyProfile);
router.get('/all', protect, authorize('admin'), getAllCompanies);

module.exports = router;