const User = require('../models/User');
const Student = require('../models/Student');
const Company = require('../models/Company');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Notification = require('../models/Notification');

// Dashboard Stats
const getDashboardStats = async (req, res) => {
  try {
    const [totalStudents, totalCompanies, pendingCompanies, totalJobs, totalApplications, placed] = await Promise.all([
      Student.countDocuments(),
      Company.countDocuments(),
      Company.countDocuments({ isApproved: false }),
      Job.countDocuments({ isActive: true }),
      Application.countDocuments(),
      Application.countDocuments({ status: 'Selected' }),
    ]);
    res.json({ totalStudents, totalCompanies, pendingCompanies, totalJobs, totalApplications, placed });
  } catch (error) { 
    res.status(500).json({ message: error.message }); 
  }
};

// Get All Companies with User Details for Verification
const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find()
      .populate('user', 'name email createdAt')
      .sort({ createdAt: -1 });
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const approveStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
    res.json(student);
  } catch (error) { 
    res.status(500).json({ message: error.message }); 
  }
};

// Approve Company + Notify Company Account
const approveCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id, 
      { isApproved: true }, 
      { new: true }
    ).populate('user', '_id email');

    if (!company) return res.status(404).json({ message: 'Company not found' });

    // Send Realtime Notification to the Company
    if (company.user) {
      await Notification.create({
        recipient: company.user._id,
        title: 'Company Account Approved! 🎉',
        message: 'Your company profile has been verified and approved by the Placement Admin. You can now post jobs and view candidates.',
        type: 'approval',
      });
    }

    res.json(company);
  } catch (error) { 
    res.status(500).json({ message: error.message }); 
  }
};

// Reject / Delete Company or User
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    await Student.findOneAndDelete({ user: req.params.id });
    await Company.findOneAndDelete({ user: req.params.id });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) { 
    res.status(500).json({ message: error.message }); 
  }
};

const getAllApplications = async (req, res) => {
  try {
    const applications = await Application.find()
      .populate({ path: 'student', populate: { path: 'user', select: '-password' } })
      .populate({ path: 'job', populate: { path: 'company' } })
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) { 
    res.status(500).json({ message: error.message }); 
  }
};

module.exports = { 
  getDashboardStats, 
  getAllCompanies,
  approveStudent, 
  approveCompany, 
  deleteUser, 
  getAllApplications 
};