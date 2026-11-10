const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  phone: { type: String },
  college: { type: String },
  degree: { type: String },
  branch: { type: String },
  cgpa: { type: Number },
  skills: [{ type: String }],
  resume: { type: String },
  resumeOriginalName: { type: String },
  resumePublicId: { type: String },
  isApproved: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);