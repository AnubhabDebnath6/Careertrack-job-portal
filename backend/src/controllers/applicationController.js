const path = require('path');
const mongoose = require('mongoose');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { APPLICATION_STATUSES } = require('../config/constants');
const { AppError, asyncHandler, escapeRegex, parsePaging } = require('../utils/helpers');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^\+?[0-9][0-9\s-]{8,14}$/;

const hasValidSignature = (file) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const head = file.buffer.subarray(0, 4);
  if (ext === '.pdf') return head.toString('latin1') === '%PDF';
  if (ext === '.docx') return head[0] === 0x50 && head[1] === 0x4b;
  return false;
};

const safeFilename = (name) => path.basename(name).replace(/[^\w.\- ]/g, '_').slice(0, 100);

const buildFilter = (query) => {
  const filter = {};
  if (typeof query.job === 'string' && mongoose.isValidObjectId(query.job)) filter.job = query.job;
  if (APPLICATION_STATUSES.includes(query.status)) filter.status = query.status;

  const range = {};
  if (typeof query.from === 'string' && query.from) {
    const from = new Date(query.from);
    if (!Number.isNaN(from.getTime())) range.$gte = from;
  }
  if (typeof query.to === 'string' && query.to) {
    const to = new Date(query.to);
    if (!Number.isNaN(to.getTime())) {
      to.setUTCHours(23, 59, 59, 999);
      range.$lte = to;
    }
  }
  if (range.$gte || range.$lte) filter.createdAt = range;

  if (typeof query.search === 'string' && query.search.trim()) {
    const pattern = { $regex: escapeRegex(query.search.trim()), $options: 'i' };
    filter.$or = [{ name: pattern }, { email: pattern }];
  }
  return filter;
};

const requireValidId = (id) => {
  if (!mongoose.isValidObjectId(id)) throw new AppError('Application not found', 404);
};

const submit = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new AppError('Job not found', 404);

  const job = await Job.findById(id);
  if (!job) throw new AppError('Job not found', 404);
  if (job.status !== 'published') throw new AppError('This job is not open for applications', 400);
  if (job.deadline && job.deadline < new Date()) {
    throw new AppError('The application deadline for this job has passed', 400);
  }

  const clean = (value) => String(value ?? '').trim();
  const body = req.body || {};
  const data = {
    name: clean(body.name),
    email: clean(body.email).toLowerCase(),
    phone: clean(body.phone),
    education: clean(body.education),
    experience: clean(body.experience),
    skills: clean(body.skills),
    coverLetter: clean(body.coverLetter)
  };

  const errors = [];
  if (data.name.length < 2) errors.push('Enter your full name');
  if (!EMAIL_PATTERN.test(data.email)) errors.push('Enter a valid email address');
  if (!PHONE_PATTERN.test(data.phone)) errors.push('Enter a valid phone number');
  if (!data.education) errors.push('Educational qualifications are required');
  if (!data.experience) errors.push('Experience is required');
  if (!data.skills) errors.push('Technical skills are required');
  if (!req.file) errors.push('Resume file is required');
  else if (!hasValidSignature(req.file)) errors.push('The uploaded file is not a valid PDF or DOCX document');
  if (errors.length) throw new AppError('Validation failed', 400, errors);

  const duplicate = await Application.exists({ job: job._id, email: data.email });
  if (duplicate) {
    throw new AppError('You have already applied for this job with this email address', 409);
  }

  const application = await Application.create({
    ...data,
    job: job._id,
    resume: {
      filename: safeFilename(req.file.originalname),
      mimetype: req.file.mimetype,
      size: req.file.size,
      data: req.file.buffer
    }
  });

  res.status(201).json({
    success: true,
    message: 'Your application has been submitted successfully',
    applicationId: application._id,
    status: application.status
  });
});

const list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePaging(req.query, 10);
  const filter = buildFilter(req.query);

  const [applications, total] = await Promise.all([
    Application.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('name email phone status createdAt job')
      .populate('job', 'title company'),
    Application.countDocuments(filter)
  ]);

  res.json({ success: true, applications, total, page, pages: Math.ceil(total / limit) });
});

const getOne = asyncHandler(async (req, res) => {
  requireValidId(req.params.id);
  const application = await Application.findById(req.params.id).populate(
    'job',
    'title company location'
  );
  if (!application) throw new AppError('Application not found', 404);
  res.json({ success: true, application });
});

const setStatus = asyncHandler(async (req, res) => {
  requireValidId(req.params.id);
  const { status } = req.body;
  if (!APPLICATION_STATUSES.includes(status)) throw new AppError('Invalid application status', 400);
  const application = await Application.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );
  if (!application) throw new AppError('Application not found', 404);
  res.json({ success: true, message: 'Status updated', status: application.status });
});

const addNote = asyncHandler(async (req, res) => {
  requireValidId(req.params.id);
  const text = String(req.body.text ?? '').trim();
  if (!text) throw new AppError('Note text is required', 400);
  if (text.length > 1000) throw new AppError('Note must be 1000 characters or fewer', 400);

  const application = await Application.findByIdAndUpdate(
    req.params.id,
    { $push: { notes: { text, author: req.admin.name } } },
    { new: true }
  );
  if (!application) throw new AppError('Application not found', 404);
  res.status(201).json({ success: true, message: 'Note added', notes: application.notes });
});

const downloadResume = asyncHandler(async (req, res) => {
  requireValidId(req.params.id);
  const application = await Application.findById(req.params.id).select('+resume.data');
  if (!application || !application.resume || !application.resume.data) {
    throw new AppError('Resume not found', 404);
  }
  const { filename, mimetype, data } = application.resume;
  res.set({
    'Content-Type': mimetype,
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Content-Length': data.length,
    'X-Content-Type-Options': 'nosniff'
  });
  res.send(data);
});

const csvCell = (value) => {
  let text = String(value ?? '');
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

const exportCsv = asyncHandler(async (req, res) => {
  const applications = await Application.find(buildFilter(req.query))
    .sort({ createdAt: -1 })
    .limit(5000)
    .populate('job', 'title company')
    .lean();

  const header = [
    'Name',
    'Email',
    'Phone',
    'Job Title',
    'Company',
    'Education',
    'Experience',
    'Skills',
    'Status',
    'Applied On'
  ];

  const rows = applications.map((item) => [
    item.name,
    item.email,
    item.phone,
    item.job ? item.job.title : '',
    item.job ? item.job.company : '',
    item.education,
    item.experience,
    item.skills,
    item.status,
    new Date(item.createdAt).toISOString()
  ]);

  const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
  res.set({
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': 'attachment; filename="applications.csv"'
  });
  res.send(csv);
});

module.exports = { submit, list, getOne, setStatus, addNote, downloadResume, exportCsv };
