const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String },
  salary: { type: String },
  jobType: { type: String, enum: ['Full-Time', 'Internship', 'Part-Time'], default: 'Full-Time' },
  eligibility: {
    minCGPA: { type: Number, default: 0 },
    degree: { type: String },
    branch: [{ type: String }],
  },
  deadline: { type: Date },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);