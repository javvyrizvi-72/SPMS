const Job = require('../models/Job');
const Company = require('../models/Company');
const Application = require('../models/Application');
const Student = require('../models/Student');

const createJob = async (req, res) => {
  try {
    const company = await Company.findOne({ user: req.user.id });
    if (!company) return res.status(404).json({ message: 'Company not found' });
    if (!company.isApproved) return res.status(403).json({ message: 'Company not approved yet' });
    const job = await Job.create({ ...req.body, company: company._id });
    res.status(201).json(job);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ isActive: true }).populate('company').sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('company');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getCompanyJobs = async (req, res) => {
  try {
    const company = await Company.findOne({ user: req.user.id });
    if (!company) return res.status(404).json({ message: 'Company not found' });
    const jobs = await Job.find({ company: company._id }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const updateJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(job);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const deleteJob = async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: 'Job deleted' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const applyForJob = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user.id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    const alreadyApplied = await Application.findOne({ student: student._id, job: job._id });
    if (alreadyApplied) return res.status(400).json({ message: 'Already applied to this job' });
    if (student.cgpa < job.eligibility.minCGPA) return res.status(400).json({ message: `Minimum CGPA required: ${job.eligibility.minCGPA}` });
    const application = await Application.create({ student: student._id, job: job._id });
    res.status(201).json(application);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getMyApplications = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user.id });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    const applications = await Application.find({ student: student._id })
      .populate({ path: 'job', populate: { path: 'company' } })
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getJobApplications = async (req, res) => {
  try {
    const applications = await Application.find({ job: req.params.id })
      .populate({ path: 'student', populate: { path: 'user', select: '-password' } })
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const updateApplicationStatus = async (req, res) => {
  try {
    const application = await Application.findByIdAndUpdate(
      req.params.id, { status: req.body.status }, { new: true }
    );
    res.json(application);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = {
  createJob, getAllJobs, getJobById, getCompanyJobs,
  updateJob, deleteJob, applyForJob, getMyApplications,
  getJobApplications, updateApplicationStatus
};
