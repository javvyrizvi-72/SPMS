const Student = require('../models/Student');
const User = require('../models/User');
const cloudinary = require('cloudinary').v2;

if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const getStudentProfile = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user.id }).populate('user', '-password');
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateStudentProfile = async (req, res) => {
  try {
    const student = await Student.findOneAndUpdate(
      { user: req.user.id },
      { ...req.body },
      { new: true }
    );
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Direct backend host URL taki frontend router dashboard par redirect na kare
    const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
    let resumeUrl = `${baseUrl}/uploads/${req.file.filename}`;
    let publicId = '';

    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      try {
        if (student.resumePublicId) {
          await cloudinary.uploader.destroy(student.resumePublicId, { resource_type: 'raw' });
        }
        const result = await cloudinary.uploader.upload(req.file.path, {
          resource_type: 'raw',
          folder: 'resumes',
        });
        resumeUrl = result.secure_url;
        publicId = result.public_id;
      } catch (cloudErr) {
        console.warn('Cloudinary upload fallback to local:', cloudErr.message);
      }
    }

    student.resume = resumeUrl;
    student.resumeOriginalName = req.file.originalname;
    if (publicId) student.resumePublicId = publicId;

    await student.save();

    res.json({
      message: 'Resume uploaded successfully',
      resume: student.resume,
      resumeOriginalName: student.resumeOriginalName,
    });
  } catch (error) {
    console.error('Resume upload error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().populate('user', '-password');
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getStudentProfile, updateStudentProfile, uploadResume, getAllStudents };