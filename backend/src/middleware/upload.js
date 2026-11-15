const path = require('path');
const multer = require('multer');
const { AppError } = require('../utils/helpers');

const ALLOWED = {
  '.pdf': ['application/pdf'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document']
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED[ext] && ALLOWED[ext].includes(file.mimetype)) return cb(null, true);
    cb(new AppError('Resume must be a PDF or DOCX file', 400));
  }
});

module.exports = upload;
