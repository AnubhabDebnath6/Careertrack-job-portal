class AppError extends Error {
  constructor(message, status = 400, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toList = (value) => {
  const items = Array.isArray(value) ? value : typeof value === 'string' ? value.split('\n') : [];
  return items
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, 30)
    .map((item) => item.slice(0, 200));
};

const parsePaging = (query, defaultLimit = 9) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

const endOfDay = (value) => {
  const date = new Date(value);
  date.setUTCHours(23, 59, 59, 999);
  return date;
};

const activeConditions = () => [
  { status: 'published' },
  { $or: [{ deadline: null }, { deadline: { $gte: new Date() } }] }
];

const textMatch = (text, fields) => {
  const pattern = { $regex: escapeRegex(text), $options: 'i' };
  return { $or: fields.map((field) => ({ [field]: pattern })) };
};

module.exports = {
  AppError,
  asyncHandler,
  escapeRegex,
  toList,
  parsePaging,
  endOfDay,
  activeConditions,
  textMatch
};
