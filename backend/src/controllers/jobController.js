const mongoose = require('mongoose');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { EMPLOYMENT_TYPES, EXPERIENCE_LEVELS, JOB_STATUSES } = require('../config/constants');
const {
  AppError,
  asyncHandler,
  escapeRegex,
  toList,
  parsePaging,
  endOfDay,
  activeConditions,
  textMatch
} = require('../utils/helpers');

const PUBLIC_SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  salary: { salaryMax: -1 },
  deadline: { deadline: 1 },
  title: { title: 1 }
};

const ADMIN_SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  title: { title: 1 },
  deadline: { deadline: 1 }
};

const requireValidId = (id) => {
  if (!mongoose.isValidObjectId(id)) throw new AppError('Job not found', 404);
};

const buildJobData = (body) => {
  const text = (value) => String(value ?? '').trim();
  const errors = [];

  const data = {
    title: text(body.title),
    company: text(body.company),
    location: text(body.location),
    employmentType: body.employmentType,
    experienceLevel: body.experienceLevel,
    description: text(body.description),
    applicationInstructions: text(body.applicationInstructions),
    responsibilities: toList(body.responsibilities),
    qualifications: toList(body.qualifications),
    skills: toList(body.skills),
    benefits: toList(body.benefits),
    status: body.status || 'draft'
  };

  if (!data.title) errors.push('Job title is required');
  if (!data.company) errors.push('Company name is required');
  if (!data.location) errors.push('Location is required');
  if (!data.description) errors.push('Job description is required');
  if (!EMPLOYMENT_TYPES.includes(data.employmentType)) errors.push('Select a valid employment type');
  if (!EXPERIENCE_LEVELS.includes(data.experienceLevel)) errors.push('Select a valid experience level');
  if (!JOB_STATUSES.includes(data.status)) errors.push('Select a valid publication status');

  const min = Number(body.salaryMin || 0);
  const max = Number(body.salaryMax || 0);
  if (Number.isNaN(min) || Number.isNaN(max) || min < 0 || max < 0) {
    errors.push('Salary values must be positive numbers');
  } else if (max && max < min) {
    errors.push('Maximum salary cannot be less than minimum salary');
  }
  data.salaryMin = min;
  data.salaryMax = max;

  if (body.deadline) {
    const parsed = new Date(body.deadline);
    if (Number.isNaN(parsed.getTime())) errors.push('Application deadline is not a valid date');
    else data.deadline = endOfDay(parsed);
  } else {
    data.deadline = null;
  }

  if (errors.length) throw new AppError('Validation failed', 400, errors);
  return data;
};

const listPublic = asyncHandler(async (req, res) => {
  const { search, location, type, level, sort } = req.query;
  const { page, limit, skip } = parsePaging(req.query, 9);

  const conditions = activeConditions();
  if (typeof search === 'string' && search.trim()) {
    conditions.push(textMatch(search.trim(), ['title', 'company', 'location']));
  }
  if (typeof location === 'string' && location.trim()) {
    conditions.push({ location: { $regex: escapeRegex(location.trim()), $options: 'i' } });
  }
  if (EMPLOYMENT_TYPES.includes(type)) conditions.push({ employmentType: type });
  if (EXPERIENCE_LEVELS.includes(level)) conditions.push({ experienceLevel: level });

  const query = { $and: conditions };
  const order = PUBLIC_SORTS[sort] || PUBLIC_SORTS.newest;

  const [jobs, total] = await Promise.all([
    Job.find(query)
      .sort(order)
      .skip(skip)
      .limit(limit)
      .select('-responsibilities -qualifications -benefits -applicationInstructions'),
    Job.countDocuments(query)
  ]);

  res.json({ success: true, jobs, total, page, pages: Math.ceil(total / limit) });
});

const getPublic = asyncHandler(async (req, res) => {
  requireValidId(req.params.id);
  const job = await Job.findOne({ _id: req.params.id, $and: activeConditions() });
  if (!job) throw new AppError('This job is not available or is no longer accepting applications', 404);
  res.json({ success: true, job });
});

const stats = asyncHandler(async (req, res) => {
  const now = new Date();
  const [totalJobs, activeJobs, closedOrExpired, draftJobs, totalApplications, byStatus] =
    await Promise.all([
      Job.countDocuments(),
      Job.countDocuments({ $and: activeConditions() }),
      Job.countDocuments({
        $or: [{ status: 'closed' }, { status: 'published', deadline: { $lt: now } }]
      }),
      Job.countDocuments({ status: 'draft' }),
      Application.countDocuments(),
      Application.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
    ]);

  res.json({
    success: true,
    stats: {
      totalJobs,
      activeJobs,
      closedOrExpired,
      draftJobs,
      totalApplications,
      applicationsByStatus: Object.fromEntries(byStatus.map((item) => [item._id, item.count]))
    }
  });
});

const listAdmin = asyncHandler(async (req, res) => {
  const { search, status, sort } = req.query;
  const { page, limit, skip } = parsePaging(req.query, 10);
  const conditions = [];

  if (typeof search === 'string' && search.trim()) {
    conditions.push(textMatch(search.trim(), ['title', 'company', 'location']));
  }
  if (status === 'draft') conditions.push({ status: 'draft' });
  if (status === 'closed') conditions.push({ status: 'closed' });
  if (status === 'active') conditions.push(...activeConditions());
  if (status === 'expired') conditions.push({ status: 'published', deadline: { $lt: new Date() } });

  const query = conditions.length ? { $and: conditions } : {};
  const order = ADMIN_SORTS[sort] || ADMIN_SORTS.newest;

  const [jobs, total] = await Promise.all([
    Job.find(query).sort(order).skip(skip).limit(limit),
    Job.countDocuments(query)
  ]);

  const counts = await Application.aggregate([
    { $match: { job: { $in: jobs.map((job) => job._id) } } },
    { $group: { _id: '$job', count: { $sum: 1 } } }
  ]);
  const countMap = Object.fromEntries(counts.map((item) => [String(item._id), item.count]));

  res.json({
    success: true,
    jobs: jobs.map((job) => ({ ...job.toJSON(), applicationCount: countMap[String(job._id)] || 0 })),
    total,
    page,
    pages: Math.ceil(total / limit)
  });
});

const getAdmin = asyncHandler(async (req, res) => {
  requireValidId(req.params.id);
  const job = await Job.findById(req.params.id);
  if (!job) throw new AppError('Job not found', 404);
  res.json({ success: true, job });
});

const create = asyncHandler(async (req, res) => {
  const job = await Job.create(buildJobData(req.body));
  res.status(201).json({ success: true, message: 'Job created', job });
});

const update = asyncHandler(async (req, res) => {
  requireValidId(req.params.id);
  const job = await Job.findByIdAndUpdate(req.params.id, buildJobData(req.body), {
    new: true,
    runValidators: true
  });
  if (!job) throw new AppError('Job not found', 404);
  res.json({ success: true, message: 'Job updated', job });
});

const setStatus = asyncHandler(async (req, res) => {
  requireValidId(req.params.id);
  const { status } = req.body;
  if (!JOB_STATUSES.includes(status)) throw new AppError('Invalid status value', 400);
  const job = await Job.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!job) throw new AppError('Job not found', 404);
  res.json({ success: true, message: 'Job status updated', job });
});

const remove = asyncHandler(async (req, res) => {
  requireValidId(req.params.id);
  const job = await Job.findByIdAndDelete(req.params.id);
  if (!job) throw new AppError('Job not found', 404);
  const removed = await Application.deleteMany({ job: job._id });
  res.json({
    success: true,
    message: 'Job and its applications deleted',
    deletedApplications: removed.deletedCount
  });
});

module.exports = {
  listPublic,
  getPublic,
  stats,
  listAdmin,
  getAdmin,
  create,
  update,
  setStatus,
  remove
};
