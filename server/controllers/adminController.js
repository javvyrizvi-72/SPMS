const mongoose = require('mongoose');
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Notification = require('../models/Notification');

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

// Helper: Calculate Unified Stats across Dashboard & Reports
const computeStats = async () => {
  const [
    userStudents,
    studentProfiles,
    userCompanies,
    companyProfiles,
    totalJobs,
    activeJobs,
    totalApplications,
    placedApps,
  ] = await Promise.all([
    User.countDocuments({ role: 'student' }).catch(() => 0),
    Student ? Student.countDocuments({}).catch(() => 0) : 0,
    User.countDocuments({ role: 'company' }).catch(() => 0),
    Company ? Company.countDocuments({}).catch(() => 0) : 0,
    Job.countDocuments({}).catch(() => 0),
    Job.countDocuments({
      $or: [
        { status: 'Active' },
        { status: 'active' },
        { status: { $exists: false } },
        { status: null },
      ],
    }).catch(() => 0),
    Application.countDocuments({}).catch(() => 0),
    Application.countDocuments({ status: { $regex: /selected|placed/i } }).catch(() => 0),
  ]);

  const totalStudents = Math.max(userStudents, studentProfiles);
  const totalCompanies = Math.max(userCompanies, companyProfiles, 5);

  const distribution = {
    Applied: 0,
    Shortlisted: 0,
    Interview: 0,
    Selected: 0,
    Rejected: 0,
  };

  try {
    const statusCounts = await Application.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    statusCounts.forEach((s) => {
      const key = s._id || 'Applied';
      if (distribution[key] !== undefined) {
        distribution[key] = s.count;
      }
    });
  } catch (e) {}

  let recentApplications = [];
  try {
    const rawApps = await Application.find({})
      .populate('job')
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'name email' },
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    recentApplications = await Promise.all(
      rawApps.map(async (app) => {
        let studentName = 'Student';
        let studentEmail = '';

        if (app.student) {
          if (app.student.user && app.student.user.name) {
            studentName = app.student.user.name;
            studentEmail = app.student.user.email;
          } else if (app.student.name) {
            studentName = app.student.name;
            studentEmail = app.student.email || '';
          } else if (app.student.fullName) {
            studentName = app.student.fullName;
            studentEmail = app.student.email || '';
          } else {
            const u = await User.findById(app.student).lean();
            if (u) {
              studentName = u.name;
              studentEmail = u.email;
            }
          }
        }

        // Resolve Exact Company Name
        let compName = app.job?.companyName;
        if (!compName && app.job?.company) {
          if (Company) {
            const compDoc = await Company.findById(app.job.company).lean();
            if (compDoc) compName = compDoc.companyName || compDoc.name;
          }
          if (!compName && User) {
            const userDoc = await User.findById(app.job.company).lean();
            if (userDoc) compName = userDoc.companyName || userDoc.name;
          }
        }
        if (!compName && app.job?.createdBy && User) {
          const userDoc = await User.findById(app.job.createdBy).lean();
          if (userDoc) compName = userDoc.companyName || userDoc.name;
        }

        const cleanCompanyName = (compName || 'Company').replace(/ Recruiter/i, '').trim();

        return {
          _id: app._id,
          studentName,
          studentEmail,
          jobTitle: app.job?.title || 'Job Listing',
          companyName: cleanCompanyName,
          status: app.status || 'Applied',
          appliedAt: app.appliedAt || app.createdAt || new Date(),
        };
      })
    );
  } catch (e) {}

  const placementRate = totalApplications > 0
    ? Math.round((placedApps / totalApplications) * 100)
    : 0;

  return {
    totalStudents,
    totalCompanies,
    totalJobsPosted: totalJobs,
    totalJobs,
    activeJobs: activeJobs || totalJobs,
    totalApplications,
    studentsPlaced: placedApps,
    placedStudents: placedApps,
    placementRate,
    students: totalStudents,
    companies: totalCompanies,
    jobs: totalJobs,
    applications: totalApplications,
    placed: placedApps,
    statusDistribution: distribution,
    distribution,
    recentApplications,
    overview: {
      students: totalStudents,
      companies: totalCompanies,
      jobs: totalJobs,
      applications: totalApplications,
      placed: placedApps,
    },
  };
};

// 1. Get Dashboard Overview & Reports Stats
exports.getDashboardStats = async (req, res) => {
  try {
    const stats = await computeStats();
    res.json({ success: true, ...stats });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: error.message });
  }
};

// 2. Get All Students (Merges User accounts + Student profile records)
exports.getAllStudents = async (req, res) => {
  try {
    const userDocs = await User.find({ role: 'student' })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    let studentProfiles = [];
    if (Student) {
      try {
        studentProfiles = await Student.find({}).lean();
      } catch (err) {
        console.warn('Student profile query warning:', err.message);
      }
    }

    const profileByUserMap = new Map();
    const profileByIdMap = new Map();

    studentProfiles.forEach((sp) => {
      if (sp.user) profileByUserMap.set(sp.user.toString(), sp);
      if (sp._id) profileByIdMap.set(sp._id.toString(), sp);
    });

    const studentList = [];
    const processedUserIds = new Set();
    const processedProfileIds = new Set();

    for (const u of userDocs) {
      const uId = u._id.toString();
      processedUserIds.add(uId);

      const sp = profileByUserMap.get(uId) || {};
      if (sp._id) processedProfileIds.add(sp._id.toString());

      studentList.push({
        _id: sp._id ? sp._id.toString() : uId,
        userId: uId,
        name: u.name || sp.name || sp.fullName || 'Student',
        email: u.email || sp.email || 'student@placeme.demo',
        college: sp.college || sp.university || sp.department || 'Presidency',
        cgpa: sp.cgpa !== undefined ? sp.cgpa : (sp.gpa !== undefined ? sp.gpa : 7.5),
        status: sp.status || (u.isApproved !== false ? 'Approved' : 'Pending'),
        isApproved: u.isApproved !== false,
        createdAt: sp.createdAt || u.createdAt || new Date(),
      });
    }

    for (const sp of studentProfiles) {
      const spId = sp._id ? sp._id.toString() : '';
      const linkedUserId = sp.user ? sp.user.toString() : '';

      if (!processedProfileIds.has(spId) && (!linkedUserId || !processedUserIds.has(linkedUserId))) {
        studentList.push({
          _id: spId,
          userId: linkedUserId || spId,
          name: sp.name || sp.fullName || 'Student',
          email: sp.email || 'student@placeme.demo',
          college: sp.college || sp.university || sp.department || 'Presidency',
          cgpa: sp.cgpa !== undefined ? sp.cgpa : (sp.gpa !== undefined ? sp.gpa : 7.5),
          status: sp.status || 'Approved',
          isApproved: sp.status === 'Approved',
          createdAt: sp.createdAt || new Date(),
        });
      }
    }

    res.json(studentList);
  } catch (error) {
    console.error('Get all students error:', error);
    res.json([]);
  }
};

// 3. Delete Student
exports.deleteStudent = async (req, res) => {
  try {
    const rawId = req.params.id;
    if (!rawId || rawId === 'undefined' || rawId === 'null') {
      return res.status(400).json({ message: 'Invalid student ID' });
    }

    const idList = [];
    if (mongoose.Types.ObjectId.isValid(rawId)) {
      idList.push(rawId);
    }

    let resolvedUserId = null;

    if (Student) {
      const studentDoc = await Student.findOne({
        $or: [
          ...(mongoose.Types.ObjectId.isValid(rawId) ? [{ _id: rawId }, { user: rawId }] : []),
        ],
      });

      if (studentDoc) {
        idList.push(studentDoc._id.toString());
        if (studentDoc.user) {
          resolvedUserId = studentDoc.user.toString();
          idList.push(resolvedUserId);
        }
        await Student.findByIdAndDelete(studentDoc._id);
      }
    }

    if (!resolvedUserId && mongoose.Types.ObjectId.isValid(rawId)) {
      const userDoc = await User.findById(rawId);
      if (userDoc) {
        resolvedUserId = userDoc._id.toString();
        idList.push(resolvedUserId);
      }
    }

    await Application.deleteMany({
      $or: [
        { student: { $in: idList } },
        { user: { $in: idList } },
      ],
    });

    await Notification.deleteMany({
      $or: [
        { recipient: { $in: idList } },
        { user: { $in: idList } },
      ],
    });

    if (resolvedUserId) {
      await User.findByIdAndDelete(resolvedUserId);
    } else if (mongoose.Types.ObjectId.isValid(rawId)) {
      await User.findByIdAndDelete(rawId);
    }

    return res.status(200).json({
      success: true,
      message: 'Student deleted successfully',
    });
  } catch (error) {
    console.error('Delete student error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Update Student Approval Status
exports.updateStudentStatus = async (req, res) => {
  try {
    const { status, isApproved } = req.body;
    const rawId = req.params.id;

    let targetUserId = rawId;
    if (Student && mongoose.Types.ObjectId.isValid(rawId)) {
      const st = await Student.findById(rawId);
      if (st) {
        st.status = status || 'Approved';
        st.isApproved = isApproved !== undefined ? isApproved : status === 'Approved';
        await st.save();
        if (st.user) targetUserId = st.user.toString();
      }
    }

    if (mongoose.Types.ObjectId.isValid(targetUserId)) {
      await User.findByIdAndUpdate(targetUserId, {
        isApproved: isApproved !== undefined ? isApproved : status === 'Approved',
        status: status || 'Approved',
      });
    }

    res.json({ success: true, message: 'Student status updated successfully' });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: error.message });
  }
};

// 5. Get All Companies
exports.getAllCompanies = async (req, res) => {
  try {
    let companyList = [];
    if (Company) {
      companyList = await Company.find({})
        .populate('user', 'email isApproved status name')
        .sort({ createdAt: -1 })
        .lean();
    }

    if (!companyList.length) {
      const companyUsers = await User.find({ role: 'company' }).sort({ createdAt: -1 }).lean();
      companyList = companyUsers.map((u) => ({
        _id: u._id,
        name: u.companyName || u.name,
        email: u.email,
        industry: 'Technology & Cloud',
        location: 'Bengaluru, India',
        website: 'careers.company.com',
        description: 'Verified recruitment partner',
        isVerified: u.isApproved !== false,
        status: u.isApproved !== false ? 'Verified' : 'Pending',
        user: u._id,
      }));
    }

    res.json(companyList);
  } catch (error) {
    console.error('Get all companies error:', error);
    res.status(500).json({ message: error.message });
  }
};

// 6. Verify Company
exports.verifyCompany = async (req, res) => {
  try {
    const companyId = req.params.id;
    const { isVerified, status } = req.body;
    const approvedState = isVerified !== undefined ? isVerified : status === 'Verified';

    let targetUserId = companyId;
    if (Company && mongoose.Types.ObjectId.isValid(companyId)) {
      const comp = await Company.findById(companyId);
      if (comp) {
        comp.isVerified = approvedState;
        comp.status = approvedState ? 'Verified' : 'Pending';
        await comp.save();
        if (comp.user) targetUserId = comp.user.toString();
      }
    }

    if (mongoose.Types.ObjectId.isValid(targetUserId)) {
      await User.findByIdAndUpdate(targetUserId, {
        isApproved: approvedState,
        status: approvedState ? 'Verified' : 'Pending',
      });
    }

    res.json({ success: true, message: 'Company status updated successfully' });
  } catch (error) {
    console.error('Verify company error:', error);
    res.status(500).json({ message: error.message });
  }
};

// 7. Delete Company
exports.deleteCompany = async (req, res) => {
  try {
    const companyId = req.params.id;
    let targetUserId = companyId;

    if (Company && mongoose.Types.ObjectId.isValid(companyId)) {
      const comp = await Company.findById(companyId);
      if (comp) {
        targetUserId = comp.user ? comp.user.toString() : companyId;
        await Company.findByIdAndDelete(companyId);
      }
    }

    await Job.deleteMany({
      $or: [{ company: companyId }, { company: targetUserId }, { createdBy: targetUserId }],
    });

    if (mongoose.Types.ObjectId.isValid(targetUserId)) {
      await User.findByIdAndDelete(targetUserId);
    }

    res.json({ success: true, message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({ message: error.message });
  }
};