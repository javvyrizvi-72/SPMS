const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

const adminAuth = [protect, authorize ? authorize('admin') : (req, res, next) => next()];

// Support both /stats, /dashboard-stats, and /reports for Reports & Analytics
router.get('/stats', adminAuth, adminController.getDashboardStats);
router.get('/dashboard-stats', adminAuth, adminController.getDashboardStats);
router.get('/reports', adminAuth, adminController.getDashboardStats);

// Students
router.get('/students', adminAuth, adminController.getAllStudents);
router.put('/students/:id/status', adminAuth, adminController.updateStudentStatus);
router.delete('/students/:id', adminAuth, adminController.deleteStudent);

// Companies
router.get('/companies', adminAuth, adminController.getAllCompanies);
router.put('/companies/:id/verify', adminAuth, adminController.verifyCompany);
router.delete('/companies/:id', adminAuth, adminController.deleteCompany);

module.exports = router;