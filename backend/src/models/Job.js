const mongoose = require('mongoose');
const { EMPLOYMENT_TYPES, EXPERIENCE_LEVELS, JOB_STATUSES } = require('../config/constants');

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    company: { type: String, required: true, trim: true, maxlength: 100 },
    location: { type: String, required: true, trim: true, maxlength: 100 },
    employmentType: { type: String, enum: EMPLOYMENT_TYPES, required: true },
    experienceLevel: { type: String, enum: EXPERIENCE_LEVELS, required: true },
    salaryMin: { type: Number, min: 0, default: 0 },
    salaryMax: { type: Number, min: 0, default: 0 },
    description: { type: String, required: true, trim: true, maxlength: 3000 },
    responsibilities: [{ type: String, trim: true }],
    qualifications: [{ type: String, trim: true }],
    skills: [{ type: String, trim: true }],
    benefits: [{ type: String, trim: true }],
    applicationInstructions: { type: String, trim: true, maxlength: 1000, default: '' },
    deadline: { type: Date, default: null },
    status: { type: String, enum: JOB_STATUSES, default: 'draft' }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true }
  }
);

jobSchema.index({ title: 'text', company: 'text', location: 'text' });
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ status: 1, deadline: 1 });

jobSchema.virtual('isExpired').get(function () {
  return Boolean(this.deadline) && this.deadline < new Date();
});

jobSchema.virtual('state').get(function () {
  if (this.status === 'published' && this.isExpired) return 'expired';
  return this.status;
});

module.exports = mongoose.model('Job', jobSchema);
