const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { AppError, asyncHandler } = require('../utils/helpers');

const login = asyncHandler(async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!email || !password) throw new AppError('Email and password are required', 400);

  const admin = await Admin.findOne({ email }).select('+password');
  if (!admin || !(await admin.matches(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({
    success: true,
    token,
    admin: { id: admin._id, name: admin.name, email: admin.email }
  });
});

const me = (req, res) => {
  res.json({
    success: true,
    admin: { id: req.admin._id, name: req.admin.name, email: req.admin.email }
  });
};

module.exports = { login, me };
