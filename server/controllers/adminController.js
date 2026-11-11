// 1. Get Admin Dashboard Overview & Reports
exports.getDashboardStats = async (req, res) => {
  try {
    const studentUsersCount = await User.countDocuments({ role: 'student' });
    let studentProfilesCount = 0;
    if (Student) {
      studentProfilesCount = await Student.countDocuments({});
    }
    // Real database count — zero agar sab delete ho chuke hain
    const totalStudents = Math.max(studentUsersCount, studentProfilesCount);

    const companyUsersCount = await User.countDocuments({ role: 'company' });
    let companyProfilesCount = 0;
    if (Company) {
      companyProfilesCount = await Company.countDocuments({});
    }
    const totalCompanies = Math.max(companyUsersCount, companyProfilesCount);

    const totalJobs = await Job.countDocuments({});
    const activeJobs = await Job.countDocuments({
      $or: [
        { status: 'Active' },
        { status: 'active' },
        { status: { $exists: false } },
        { status: null }
      ]
    });

    const totalApplications = await Application.countDocuments({});
    const placedStudents = await Application.countDocuments({
      status: { $regex: /selected|placed/i }
    });

    const distribution = {
      Applied: 0,
      Shortlisted: 0,
      Interview: 0,
      Selected: 0,
      Rejected: 0
    };

    try {
      const statusCounts = await Application.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      statusCounts.forEach(s => {
        const key = s._id || 'Applied';
        if (distribution[key] !== undefined) {
          distribution[key] = s.count;
        }
      });
    } catch (e) {}

    let recentApplications = [];
    try {
      const rawApps = await Application.find({})
        .populate('job', 'title companyName')
        .populate({
          path: 'student',
          populate: { path: 'user', select: 'name email' }
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
            } else if (app.student.fullName) {
              studentName = app.student.fullName;
            } else {
              const u = await User.findById(app.student).lean();
              if (u) {
                studentName = u.name;
                studentEmail = u.email;
              }
            }
          }

          return {
            _id: app._id,
            studentName,
            studentEmail,
            jobTitle: app.job?.title || 'Job Listing',
            companyName: app.job?.companyName || 'Company',
            status: app.status || 'Applied',
            appliedAt: app.appliedAt || app.createdAt || new Date()
          };
        })
      );
    } catch (e) {}

    const placementRate = totalApplications > 0
      ? Math.round((placedStudents / totalApplications) * 100)
      : 0;

    res.json({
      success: true,
      totalStudents,
      totalCompanies,
      totalJobsPosted: totalJobs,
      totalJobs,
      activeJobs: activeJobs || totalJobs,
      totalApplications,
      studentsPlaced: placedStudents,
      placedStudents,
      placementRate,
      students: totalStudents,
      companies: totalCompanies,
      jobs: totalJobs,
      applications: totalApplications,
      placed: placedStudents,
      statusDistribution: distribution,
      distribution,
      recentApplications,
      overview: {
        students: totalStudents,
        companies: totalCompanies,
        jobs: totalJobs,
        applications: totalApplications,
        placed: placedStudents
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: error.message });
  }
};