const Job = require('../models/Job');
const Application = require('../models/Application');
const Notification = require('../models/Notification');
let Company;
try {
  Company = require('../models/Company');
} catch (e) {
  Company = null;
}

// 1. Create a Job (Company only)
exports.createJob = async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      salary,
      jobType,
      minCgpa,
      requiredDegree,
      branch,
      deadline,
    } = req.body;

    let companyId = req.user.companyId || req.user._id;

    if (Company) {
      const compDoc = await Company.findOne({ user: req.user._id });
      if (compDoc) companyId = compDoc._id;
    }

    const job = await Job.create({
      title,
      description,
      location,
      salary,
      jobType,
      minCgpa,
      requiredDegree,
      branch,
      deadline,
      company: companyId,
      companyId: companyId,
      createdBy: req.user._id,
      user: req.user._id,
      companyName: req.user.companyName || req.user.name || 'Company',
      status: 'Active',
    });

    res.status(201).json(job);
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ message: error.message });
  }
};

// 2. Get All Active Jobs
exports.getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ status: 'Active' })
      .populate('company')
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Get Single Job By ID
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('company');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Update Job
exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. Delete Job
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 6. Get Jobs Posted by Current Company
exports.getCompanyJobs = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    let companyDocId = null;

    if (Company) {
      const comp = await Company.findOne({ user: userId });
      if (comp) companyDocId = comp._id;
    }

    const queryConditions = [
      { user: userId },
      { createdBy: userId },
      { company: userId },
    ];
    if (companyDocId) {
      queryConditions.push({ company: companyDocId });
      queryConditions.push({ companyId: companyDocId });
    }

    const jobs = await Job.find({ $or: queryConditions }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 7. Student Apply For Job (With Recruiter & Student Notifications)
exports.applyForJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const studentId = req.user.studentId || req.user.id || req.user._id;

    const job = await Job.findById(jobId).populate('company');
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if already applied
    const existingApplication = await Application.findOne({
      job: jobId,
      student: studentId,
    });
    if (existingApplication) {
      return res.status(400).json({ message: 'Already applied for this job' });
    }

    // 1. Create Application
    const application = await Application.create({
      job: jobId,
      student: studentId,
      status: 'Applied',
      appliedAt: new Date(),
    });

    // 2. Identify Recruiter User ID
    let recruiterUserId = null;
    if (job.createdBy) {
      recruiterUserId = job.createdBy;
    } else if (job.user) {
      recruiterUserId = job.user;
    } else if (job.company && job.company.user) {
      recruiterUserId = job.company.user;
    } else if (job.company) {
      recruiterUserId = job.company._id || job.company;
    }

    const applicantName = req.user.name || 'A candidate';

    // 3. Create Notification for Company/Recruiter
    if (recruiterUserId) {
      await Notification.create({
        recipient: recruiterUserId,
        user: recruiterUserId,
        title: 'New Applicant Received! 🎯',
        message: `${applicantName} has applied for "${job.title}".`,
        type: 'application',
        link: '/company/applicants',
        isRead: false,
        createdAt: new Date(),
      });
      console.log(`🔔 Notification created for recruiter: ${recruiterUserId}`);
    }

    // 4. Create Confirmation Notification for Student
    await Notification.create({
      recipient: req.user._id || req.user.id,
      user: req.user._id || req.user.id,
      title: 'Application Submitted! 📄',
      message: `You have successfully applied for "${job.title}".`,
      type: 'status_update',
      isRead: false,
      createdAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Applied successfully',
      application,
    });
  } catch (error) {
    console.error('Apply job error:', error);
    res.status(500).json({ message: error.message });
  }
};

// 8. Get Applications for Current Student
exports.getMyApplications = async (req, res) => {
  try {
    const studentId = req.user.studentId || req.user.id || req.user._id;
    const applications = await Application.find({ student: studentId })
      .populate('job')
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 9. Get Applications for a Specific Job (Company view)
exports.getJobApplications = async (req, res) => {
  try {
    const applications = await Application.find({ job: req.params.id })
      .populate('student')
      .populate('job')
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 10. Update Application Status (Shortlist, Rejected, etc.)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
      .populate('student')
      .populate('job');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Student ko update notification bhejo
    const studentUserId = application.student?.user || application.student?._id;
    if (studentUserId) {
      await Notification.create({
        recipient: studentUserId,
        user: studentUserId,
        title: `Application Status: ${status}`,
        message: `Your application for "${application.job?.title || 'Job'}" has been updated to "${status}".`,
        type: 'status_update',
        isRead: false,
        createdAt: new Date(),
      });
    }

    res.json({ message: 'Status updated successfully', application });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: error.message });
  }
};