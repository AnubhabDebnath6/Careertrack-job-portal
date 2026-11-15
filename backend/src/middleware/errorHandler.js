const notFound = (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
};

const errorHandler = (err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message || 'Server error';
  let errors = err.errors;

  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => e.message);
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid identifier or value';
  } else if (err.code === 11000) {
    status = 409;
    message = 'Duplicate record';
  } else if (err.name === 'MulterError') {
    status = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'Resume must be 2 MB or smaller' : err.message;
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Invalid JSON in request body';
  } else if (err.message === 'Not allowed by CORS') {
    status = 403;
  }

  if (status >= 500) {
    console.error(err);
    message = 'Something went wrong on the server';
    errors = undefined;
  }

  res.status(status).json({ success: false, message, ...(errors ? { errors } : {}) });
};

module.exports = { notFound, errorHandler };
