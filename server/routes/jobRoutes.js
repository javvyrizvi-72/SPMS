const express = require('express');
const router = express.Router();
const {
  createJob,
  getAllJobs,
  getJobById,
  applyForJob,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
  getCompanyJobs,
  updateJob,
  deleteJob
} = require('../controllers/jobController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', getAllJobs);
router.get('/company/my-jobs', protect, authorize('company'), getCompanyJobs);
router.get('/my/applications', protect, authorize('student'), getMyApplications);
router.get('/:id', getJobById);
router.post('/', protect, authorize('company'), createJob);
router.put('/:id', protect, authorize('company'), updateJob);
router.delete('/:id', protect, authorize('company'), deleteJob);
router.post('/:id/apply', protect, authorize('student'), applyForJob);
router.get('/:id/applications', protect, authorize('company'), getJobApplications);
router.put('/application/:id/status', protect, authorize('company'), updateApplicationStatus);

module.exports = router;