const express = require('express');
const router = express.Router();
const { 
  getDashboardStats, 
  getAllCompanies,
  approveStudent, 
  approveCompany, 
  deleteUser, 
  getAllApplications 
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect, authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/companies', getAllCompanies);
router.get('/applications', getAllApplications);
router.put('/student/:id/approve', approveStudent);
router.put('/company/:id/approve', approveCompany);
router.delete('/user/:id', deleteUser);

module.exports = router;