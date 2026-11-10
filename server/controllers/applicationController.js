const Notification = require('../models/Notification');
const Application = require('../models/Application');
const Interview = require('../models/Interview');
const Job = require('../models/Job');

// Helper function: Student ke status updates ke liye
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
      user: recipientId, // Fallback if schema uses 'user' instead of 'recipient'
      title,
      message,
      type: 'status_update',
      isRead: false,
      createdAt: new Date(),
    });
  } catch (err) {
    console.error('Student notification error:', err);
  }
};

// 1. Student Job Apply Controller
const applyForJob = async (req, res) => {
  try {
    const { jobId, resume } = req.body;
    const studentId = req.user.studentId || req.user.id || req.user._id;

    const application = await Application.create({
      job: jobId,
      student: studentId,
      resume,
      status: 'Applied',
    });

    // Populate student and job details (including company profile and creator)
    const populatedApp = await Application.findById(application._id)
      .populate('student')
      .populate({
        path: 'job',
        populate: { path: 'company' },
      });

    // A. Student ko confirmation notification
    await createStatusNotification(populatedApp, 'Applied');

    // B. Company / Recruiter ko "New Applicant" Notification
    try {
      const job = populatedApp.job;
      const applicantName = req.user.name || populatedApp.student?.name || 'A candidate';
      const jobTitle = job?.title || 'Job Opening';

      // Recruiter ka User ID dhoondo
      let companyRecipientId = null;
      if (job?.createdBy) {
        companyRecipientId = job.createdBy;
      } else if (job?.user) {
        companyRecipientId = job.user;
      } else if (job?.company?.user) {
        companyRecipientId = job.company.user;
      } else if (job?.company) {
        companyRecipientId = job.company._id || job.company;
      }

      if (companyRecipientId) {
        await Notification.create({
          recipient: companyRecipientId,
          user: companyRecipientId, // Dono match karo taaki controller kisi bhi field se find kare to mil jaye
          title: 'New Applicant Received! 🎯',
          message: `${applicantName} has applied for "${jobTitle}".`,
          type: 'application',
          link: '/company/applicants',
          isRead: false,
          createdAt: new Date(),
        });
        console.log(`🔔 Notification sent to Company/Recruiter: ${companyRecipientId}`);
      }
    } catch (notifErr) {
      console.error('Company notification trigger error:', notifErr);
    }

    res.status(201).json(application);
  } catch (error) {
    console.error('Apply job error:', error);
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

    // Trigger Notification to Student based on new status
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
    const companyId = application.job?.company?._id || application.job?.company;

    const interview = await Interview.create({
      application: applicationId,
      student: application.student?._id || studentUserId,
      company: companyId,
      scheduledAt,
      mode: mode || 'Online',
      link: link || '',
    });

    await Application.findByIdAndUpdate(applicationId, { status: 'Interview' });

    // Trigger Interview Notification to Student
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
  getMyInterviews,
};