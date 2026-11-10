const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { getStudentProfile, updateStudentProfile, uploadResume, getAllStudents } = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const Student = require('../models/Student');
const multer = require('multer');

// Extension preserve karne ke liye diskStorage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.pdf';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files allowed!'), false);
    }
  },
});

router.get('/profile', protect, authorize('student'), getStudentProfile);
router.put('/profile', protect, authorize('student'), updateStudentProfile);
router.post('/resume', protect, authorize('student'), upload.single('resume'), uploadResume);
router.get('/all', protect, authorize('admin'), getAllStudents);

// Direct PDF View / Download route with headers
router.get('/resume/download/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student || !student.resume) {
      return res.status(404).send('Resume not found');
    }

    // Agar Cloudinary URL ho
    if (student.resume.startsWith('http') && !student.resume.includes('localhost')) {
      return res.redirect(student.resume);
    }

    // Local file path
    const filename = path.basename(student.resume);
    const filePath = path.join(__dirname, '../uploads', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send('File not found on server');
    }

    const downloadName = student.resumeOriginalName || 'Resume.pdf';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${downloadName}"`);
    return res.sendFile(filePath);
  } catch (err) {
    res.status(500).send('Error loading resume');
  }
});

module.exports = router;