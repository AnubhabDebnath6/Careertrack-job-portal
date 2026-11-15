const mongoose = require('mongoose');
const { APPLICATION_STATUSES } = require('../config/constants');

const noteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 1000 },
    author: { type: String, trim: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const applicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true },
    education: { type: String, required: true, trim: true, maxlength: 500 },
    experience: { type: String, required: true, trim: true, maxlength: 1000 },
    skills: { type: String, required: true, trim: true, maxlength: 500 },
    coverLetter: { type: String, trim: true, maxlength: 2000, default: '' },
    resume: {
      filename: { type: String, required: true },
      mimetype: { type: String, required: true },
      size: { type: Number, required: true },
      data: { type: Buffer, required: true, select: false }
    },
    status: { type: String, enum: APPLICATION_STATUSES, default: 'Submitted' },
    notes: [noteSchema]
  },
  { timestamps: true }
);

applicationSchema.index({ job: 1, email: 1 }, { unique: true });
applicationSchema.index({ status: 1, createdAt: -1 });
applicationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Application', applicationSchema);
