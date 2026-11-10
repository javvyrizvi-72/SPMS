const Notification = require('../models/Notification');
const Application = require('../models/Application');
const Interview = require('../models/Interview');

// Helper function: Notification create karne ke liye
const createStatusNotification = async (application, status, details = {}) => {
  try {
    const recipientId = application.student?.user || application.student?._id || application.student;
    const jobTitle = application.job?.title || 'Job Application';

    let title = `Application Update: ${status}`;
    let message = `Your application status for "${jobTitle}" has been updated to ${status}.`;

    if (status === 'Applied') {
      title = 'Application Submitted! 📄';
      message = `You have successfully applied for "${jobTitle}". We will update you once your profile is reviewed.`;
    } else if (status === 'Shortlisted') {
      title = 'Shortlisted! 🎉';
      message = `Congratulations! You have been shortlisted for "${jobTitle}". Stay tuned for the interview details.`;
    } else if (status === 'Interview') {
      title = 'Interview Scheduled! 📅';
      const dateStr = details.scheduledAt ? new Date(details.scheduledAt).toLocaleString() : 'Soon';
      message = `Your interview for "${jobTitle}" is scheduled on ${dateStr} (${details.mode || 'Online'}). Link: ${details.link || 'Will be shared soon'}`;
    } else if (status === 'Selected') {
      title = 'Offer Received! You are Selected 🌟';
      message = `Congratulations! You have been selected for "${jobTitle}". Please check your email for the offer details.`;
    } else if (status === 'Rejected') {
      title = 'Application Update ❌';
      message = `Thank you for applying to "${jobTitle}". Unfortunately, the team is not moving forward with your application at this time.`;
    }

    await Notification.create({
      recipient: recipientId,
      title,
      message,
    });
  } catch (err) {
    console.error('Notification trigger error:', err);
  }
};

// 1. Student Job Apply Controller (Agar isi file me apply function hai)
const applyForJob = async (req, res) => {
  try {
    const { jobId, resume } = req.body;
    const studentId = req.user.studentId || req.user.id;

    const application = await Application.create({
      job: jobId,
      student: studentId,
      resume,
      status: 'Applied'
    });

    const populatedApp = await Application.findById(application._id)
      .populate('student')
      .populate('job');

    // Applied notification trigger
    await createStatusNotification(populatedApp, 'Applied');

    res.status(201).json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Status Update Controller (Shortlisted, Selected, Rejected)
const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const application = await Application.findById(id)
      .populate('student')
      .populate('job');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    application.status = status;
    await application.save();

    // Trigger Notification based on new status
    await createStatusNotification(application, status);

    res.json({ message: 'Status updated successfully', application });
  } catch (error) {
    console.error('Error in updateApplicationStatus:', error);
    res.status(500).json({ message: error.message });
  }
};

// 3. Interview Schedule Controller
const scheduleInterview = async (req, res) => {
  try {
    const { applicationId, scheduledAt, mode, link } = req.body;
    const application = await Application.findById(applicationId)
      .populate('student')
      .populate('job');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const studentUserId = application.student?.user || application.student?._id;
    const companyId = application.job?.company;

    const interview = await Interview.create({
      application: applicationId,
      student: application.student?._id || studentUserId,
      company: companyId,
      scheduledAt,
      mode: mode || 'Online',
      link: link || '',
    });

    await Application.findByIdAndUpdate(applicationId, { status: 'Interview' });

    // Trigger Interview Notification
    await createStatusNotification(application, 'Interview', { scheduledAt, mode, link });

    res.status(201).json(interview);
  } catch (error) {
    console.error('Error scheduling interview:', error);
    res.status(500).json({ message: error.message });
  }
};

// 4. Interviews list fetch
const getMyInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find({ student: req.params.studentId })
      .populate('application')
      .populate('company');
    res.json(interviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  applyForJob,
  updateApplicationStatus, 
  scheduleInterview, 
  getMyInterviews 
};