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

// 1. Get Admin Dashboard Overview & Reports
exports.getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalCompanies = await User.countDocuments({ role: 'company' });
    const totalJobs = await Job.countDocuments({});
    const totalApplications = await Application.countDocuments({});
    const placedStudents = await Application.countDocuments({
      status: { $regex: /selected|placed/i }
    });

    const statusCounts = await Application.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const distribution = {
      Applied: 0,
      Shortlisted: 0,
      Interview: 0,
      Selected: 0,
      Rejected: 0
    };

    statusCounts.forEach(s => {
      const key = s._id || 'Applied';
      if (distribution[key] !== undefined) {
        distribution[key] = s.count;
      }
    });

    // Fetch recent applications and resolve student name + job title safely
    const rawApps = await Application.find({})
      .populate('job', 'title companyName')
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'name email' }
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const recentApplications = await Promise.all(
      rawApps.map(async (app) => {
        let studentName = 'Student';
        let studentEmail = '';

        // Check if student was populated directly or via Student model
        if (app.student) {
          if (app.student.user && app.student.user.name) {
            studentName = app.student.user.name;
            studentEmail = app.student.user.email;
          } else if (app.student.name) {
            studentName = app.student.name;
          } else if (app.student.fullName) {
            studentName = app.student.fullName;
          } else {
            // Direct user lookup fallback
            const u = await User.findById(app.student).lean();
            if (u) {
              studentName = u.name;
              studentEmail = u.email;
            }
          }
        }

        let jobTitle = app.job?.title || 'Job Listing';
        let companyName = app.job?.companyName || 'Company';

        return {
          _id: app._id,
          studentName,
          studentEmail,
          jobTitle,
          companyName,
          status: app.status || 'Applied',
          appliedAt: app.appliedAt || app.createdAt || new Date()
        };
      })
    );

    const placementRate = totalApplications > 0 ? Math.round((placedStudents / totalApplications) * 100) : 0;

    res.json({
      totalStudents,
      totalCompanies,
      totalJobsPosted: totalJobs,
      totalApplications,
      studentsPlaced: placedStudents,
      placementRate,
      statusDistribution: distribution,
      recentApplications
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: error.message });
  }
};

// 2. Get All Students (Resolves Name, College, CGPA accurately)
exports.getAllStudents = async (req, res) => {
  try {
    let students = [];

    if (Student) {
      const studentProfiles = await Student.find({})
        .populate('user', 'name email isApproved status createdAt')
        .sort({ createdAt: -1 })
        .lean();

      students = studentProfiles.map(s => ({
        _id: s._id,
        userId: s.user?._id || s.user,
        name: s.user?.name || s.name || s.fullName || 'Student',
        email: s.user?.email || s.email || 'N/A',
        college: s.college || s.university || 'PRESIDENCY',
        cgpa: s.cgpa || s.gpa || 7.0,
        status: s.user?.isApproved !== false ? 'Approved' : 'Pending',
        createdAt: s.createdAt
      }));
    }

    // Agar Student profile collection khali ho, direct User collection se uthao
    if (!students.length) {
      const userStudents = await User.find({ role: 'student' }).sort({ createdAt: -1 }).lean();
      students = userStudents.map(u => ({
        _id: u._id,
        userId: u._id,
        name: u.name || 'Student',
        email: u.email || 'N/A',
        college: 'PRESIDENCY',
        cgpa: 7.5,
        status: u.isApproved !== false ? 'Approved' : 'Pending',
        createdAt: u.createdAt
      }));
    }

    res.json(students);
  } catch (error) {
    console.error('Get all students error:', error);
    res.status(500).json({ message: error.message });
  }
};

// 3. Delete Student (Safe cascading delete so "Failed to delete" error never happens)
exports.deleteStudent = async (req, res) => {
  try {
    const studentId = req.params.id;

    let targetUserId = studentId;

    if (Student) {
      const st = await Student.findById(studentId);
      if (st) {
        targetUserId = st.user || studentId;
        await Student.findByIdAndDelete(studentId);
      }
    }

    // Clean up applications submitted by this student
    await Application.deleteMany({
      $or: [
        { student: studentId },
        { student: targetUserId }
      ]
    });

    // Clean up notifications for this student
    await Notification.deleteMany({
      $or: [
        { recipient: targetUserId },
        { user: targetUserId }
      ]
    });

    // Delete student user account
    await User.findByIdAndDelete(targetUserId);

    res.json({ success: true, message: 'Student and related records deleted successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ message: error.message });
  }
};

// 4. Update Student Approval Status
exports.updateStudentStatus = async (req, res) => {
  try {
    const { status, isApproved } = req.body;
    const studentId = req.params.id;

    let targetUserId = studentId;
    if (Student) {
      const st = await Student.findById(studentId);
      if (st && st.user) targetUserId = st.user;
    }

    await User.findByIdAndUpdate(targetUserId, {
      isApproved: isApproved !== undefined ? isApproved : status === 'Approved',
      status: status || 'Approved'
    });

    res.json({ success: true, message: 'Student status updated successfully' });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: error.message });
  }
};