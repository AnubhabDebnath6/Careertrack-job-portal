const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { AppError, asyncHandler } = require('../utils/helpers');

const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new AppError('Authentication required', 401);

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new AppError('Session expired or invalid. Please log in again.', 401);
  }

  const admin = await Admin.findById(payload.id);
  if (!admin) throw new AppError('Account no longer exists', 401);

  req.admin = admin;
  next();
});

module.exports = { protect };
