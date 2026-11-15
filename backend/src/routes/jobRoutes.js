const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { listPublic, getPublic } = require('../controllers/jobController');
const { submit } = require('../controllers/applicationController');
const upload = require('../middleware/upload');

const applyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many applications from this connection. Please try again later.' }
});

router.get('/', listPublic);
router.get('/:id', getPublic);
router.post('/:id/apply', applyLimiter, upload.single('resume'), submit);

module.exports = router;
