
require('dotenv').config();
const app = require('../src/app');
const connectDB = require('../src/config/db');

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('Database connection failed:', err.message);
    return res.status(500).json({ success: false, message: 'Database connection failed' });
  }

  const incoming = new URL(req.url, 'http://localhost');
  const original = incoming.searchParams.get('path');
  if (original !== null) {
    incoming.searchParams.delete('path');
    const rest = incoming.searchParams.toString();
    req.url = '/api/' + original.replace(/^\/+/, '') + (rest ? '?' + rest : '');
  }

  return app(req, res);
};
