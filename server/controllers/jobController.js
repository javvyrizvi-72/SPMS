const Job = require('../models/Job');
const Application = require('../models/Application');
const Notification = require('../models/Notification');
const User = require('../models/User');

let Student = null;
try {
  Student = require('../models/Student');
} catch (e) {
  Student = null;
}

let Company = null;
try {
  Company = require('../models/Company');
} catch (e) {
  Company = null;
}

// 1. Create a Job
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

    const companyId = req.user.companyId || req.user._id;

    const job = await Job.create({
      title,
      description,
      location,
      salary,
      jobType: jobType || 'Full-Time',
      minCgpa: minCgpa || 0,
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

// 2. Get All Active Jobs (Strictly returns 10 unique recent jobs)
exports.getAllJobs = async (req, res) => {
  try {
    const rawJobs = await Job.find({})
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const uniqueMap = new Map();
    const jobs = [];

    for (const j of rawJobs) {
      const titleKey = (j.title || '').trim().toLowerCase();
      if (!uniqueMap.has(titleKey)) {
        uniqueMap.set(titleKey, true);

        let compName = j.companyName;
        if (!compName && j.company) {
          if (Company) {
            const compDoc = await Company.findById(j.company).lean();
            if (compDoc) compName = compDoc.companyName || compDoc.name;
          }
          if (!compName && User) {
            const userDoc = await User.findById(j.company).lean();
            if (userDoc) compName = userDoc.companyName || userDoc.name;
          }
        }

        if (!compName && j.createdBy && User) {
          const userDoc = await User.findById(j.createdBy).lean();
          if (userDoc) compName = userDoc.companyName || userDoc.name;
        }

        jobs.push({
          ...j,
          companyName: compName || 'Top Tech Company',
          company: {
            _id: j.company,
            companyName: compName || 'Top Tech Company',
            name: compName || 'Top Tech Company',
          },
        });
      }
      if (jobs.length >= 10) break;
    }

    res.json(jobs);
  } catch (error) {
    console.error('Get all jobs error:', error);
    res.status(500).json({ message: error.message });
  }
};

// 3. Get Single Job By ID
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).lean();
    if (!job) return res.status(404).json({ message: 'Job not found' });

    let compName = job.companyName;
    if (!compName && job.company && User) {
      const u = await User.findById(job.company).lean();
      if (u) compName = u.companyName || u.name;
    }

    job.companyName = compName || 'Top Tech Company';
    job.company = {
      _id: job.company,
      companyName: compName || 'Top Tech Company',
      name: compName || 'Top Tech Company',
    };

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

// 6. Get Jobs Posted by Current Company (Matches by ID, Company profile, and Company Name)
exports.getCompanyJobs = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const companyProfileId = req.user.companyId || req.user.company;
    const userOrgName = (req.user.companyName || req.user.name || '').replace(/recruiter/i, '').trim();

    const queryFilters = [
      { user: userId },
      { createdBy: userId },
      { company: userId },
      { companyId: userId },
    ];

    if (companyProfileId) {
      queryFilters.push({ company: companyProfileId });
      queryFilters.push({ companyId: companyProfileId });
    }

    // Agar seed data company name ke through set tha (jaise "Amazon")
    if (userOrgName) {
      queryFilters.push({
        companyName: { $regex: new RegExp(userOrgName, 'i') }
      });
    }

    // Company model se match check karo agar profile alag ID par ho
    if (Company) {
      const compDoc = await Company.findOne({
        $or: [{ user: userId }, { name: { $regex: new RegExp(userOrgName, 'i') } }]
      });
      if (compDoc) {
        queryFilters.push({ company: compDoc._id });
        queryFilters.push({ companyId: compDoc._id });
      }
    }

    const jobs = await Job.find({ $or: queryFilters }).sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    console.error('Get company jobs error:', error);
    res.status(500).json({ message: error.message });
  }
};

// 7. Student Apply For Job (With Recruiter & Student Notifications)
exports.applyForJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    let studentId = req.user.studentId || req.user._id || req.user.id;

    if (Student) {
      const studentDoc = await Student.findOne({ user: req.user._id || req.user.id });
      if (studentDoc) {
        studentId = studentDoc._id;
      }
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const existingApplication = await Application.findOne({
      job: jobId,
      $or: [
        { student: studentId },
        { student: req.user._id || req.user.id }
      ]
    });
    if (existingApplication) {
      return res.status(400).json({ message: 'Already applied for this job' });
    }

    const application = await Application.create({
      job: jobId,
      student: studentId,
      status: 'Applied',
      appliedAt: new Date(),
    });

    let recruiterUserId = null;
    if (job.createdBy) {
      recruiterUserId = job.createdBy;
    } else if (job.user) {
      recruiterUserId = job.user;
    } else if (job.company) {
      recruiterUserId = job.company;
    }

    const applicantName = req.user.name || 'A student';

    if (recruiterUserId) {
      try {
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
      } catch (nErr) {
        console.error('Notification creation error:', nErr.message);
      }
    }

    try {
      await Notification.create({
        recipient: req.user._id || req.user.id,
        user: req.user._id || req.user.id,
        title: 'Application Submitted! 📄',
        message: `You have successfully applied for "${job.title}".`,
        type: 'status_update',
        isRead: false,
        createdAt: new Date(),
      });
    } catch (sErr) {
      console.error('Student notification creation error:', sErr.message);
    }

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
    let queryConditions = [
      { student: studentId },
      { student: req.user._id || req.user.id }
    ];

    if (Student) {
      const studentDoc = await Student.findOne({ user: req.user._id || req.user.id });
      if (studentDoc) {
        queryConditions.push({ student: studentDoc._id });
      }
    }

    const applications = await Application.find({ $or: queryConditions })
      .populate('job')
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 9. Get Applications for a Specific Job
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

// 10. Update Application Status
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

    const studentUserId = application.student?.user || application.student?._id;
    if (studentUserId) {
      try {
        await Notification.create({
          recipient: studentUserId,
          user: studentUserId,
          title: `Application Status: ${status}`,
          message: `Your application for "${application.job?.title || 'Job'}" has been updated to "${status}".`,
          type: 'status_update',
          isRead: false,
          createdAt: new Date(),
        });
      } catch (err) {
        console.error('Status notif error:', err.message);
      }
    }

    res.json({ message: 'Status updated successfully', application });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: error.message });
  }
};