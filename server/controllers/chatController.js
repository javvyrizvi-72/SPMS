const Job = require('../models/Job');
const Student = require('../models/Student');
const Company = require('../models/Company');
const Application = require('../models/Application');
const Interview = require('../models/Interview');
const { generateReply, suggestionsFor, getMode } = require('../services/assistant');

// Collects only the data the signed-in user is allowed to see.
const buildContext = async (user) => {
  const jobDocs = await Job.find({ isActive: true }).populate('company', 'companyName').sort({ createdAt: -1 }).limit(25).lean();
  const jobs = jobDocs.map((j) => {
    const company = j.company?.companyName || 'Company';
    return {
      id: String(j._id), title: j.title, company, type: j.jobType, location: j.location, salary: j.salary,
      minCGPA: j.eligibility?.minCGPA || 0, deadline: j.deadline,
      search: `${j.title} ${company} ${j.jobType} ${j.location || ''}`.toLowerCase(),
    };
  });
  const ctx = { user: user ? { name: user.name, role: user.role } : null, jobs };
  if (!user) return ctx;

  if (user.role === 'student') {
    const st = await Student.findOne({ user: user._id }).lean();
    if (st) {
      const apps = await Application.find({ student: st._id }).populate({ path: 'job', select: 'title company', populate: { path: 'company', select: 'companyName' } }).lean();
      const ints = await Interview.find({ student: st._id }).populate({ path: 'application', populate: { path: 'job', select: 'title' } }).lean();
      ctx.student = {
        cgpa: st.cgpa ?? null, branch: st.branch, skills: st.skills || [], hasResume: !!st.resume, isApproved: !!st.isApproved,
        applications: apps.map((a) => ({ title: a.job?.title || 'Job', company: a.job?.company?.companyName || '', status: a.status })),
        appliedJobIds: apps.map((a) => String(a.job?._id)),
        interviews: ints.map((i) => ({ title: i.application?.job?.title || 'Interview', scheduledAt: i.scheduledAt, mode: i.mode, link: i.link })),
      };
    }
  } else if (user.role === 'company') {
    const co = await Company.findOne({ user: user._id }).lean();
    if (co) {
      const myJobs = await Job.find({ company: co._id }).select('_id title').lean();
      const apps = await Application.find({ job: { $in: myJobs.map((j) => j._id) } }).select('status').lean();
      const byStatus = {};
      apps.forEach((a) => { byStatus[a.status] = (byStatus[a.status] || 0) + 1; });
      ctx.company = { name: co.companyName, isApproved: !!co.isApproved, jobs: myJobs, totalApplicants: apps.length, byStatus };
    }
  } else if (user.role === 'admin') {
    const [totalStudents, totalCompanies, totalJobs, totalApplications, placed, pendingStudents, pendingCompanies] = await Promise.all([
      Student.countDocuments(), Company.countDocuments(), Job.countDocuments({ isActive: true }), Application.countDocuments(),
      Application.countDocuments({ status: 'Selected' }), Student.countDocuments({ isApproved: false }), Company.countDocuments({ isApproved: false }),
    ]);
    ctx.admin = { totalStudents, totalCompanies, totalJobs, totalApplications, placed, pendingStudents, pendingCompanies };
  }
  return ctx;
};

const chat = async (req, res) => {
  try {
    const message = String(req.body.message || '').trim();
    if (!message) return res.status(400).json({ message: 'Please type a message' });
    if (message.length > 500) return res.status(400).json({ message: 'Message is too long (max 500 characters)' });

    const ctx = await buildContext(req.user);
    const { reply, mode } = await generateReply({ message, history: req.body.history, ctx });
    res.json({ reply, mode, suggestions: suggestionsFor(ctx.user?.role || 'guest') });
  } catch (error) {
    console.error('Chat error:', error.message);
    res.status(500).json({ message: 'The assistant is unavailable right now. Please try again.' });
  }
};

const info = (req, res) => res.json({ mode: getMode() === 'basic' ? 'basic' : 'ai', suggestions: suggestionsFor(req.user?.role || 'guest') });

module.exports = { chat, info };
