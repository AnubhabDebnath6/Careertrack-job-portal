const router = require('express').Router();
const { protect } = require('../middleware/auth');
const jobs = require('../controllers/jobController');
const applications = require('../controllers/applicationController');

router.use(protect);

router.get('/stats', jobs.stats);

router.get('/jobs', jobs.listAdmin);
router.post('/jobs', jobs.create);
router.get('/jobs/:id', jobs.getAdmin);
router.put('/jobs/:id', jobs.update);
router.patch('/jobs/:id/status', jobs.setStatus);
router.delete('/jobs/:id', jobs.remove);

router.get('/applications', applications.list);
router.get('/applications/export', applications.exportCsv);
router.get('/applications/:id', applications.getOne);
router.patch('/applications/:id/status', applications.setStatus);
router.post('/applications/:id/notes', applications.addNote);
router.get('/applications/:id/resume', applications.downloadResume);

module.exports = router;
