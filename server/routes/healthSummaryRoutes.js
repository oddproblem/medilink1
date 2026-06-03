const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getHealthSummary,
    generateHealthSummary,
    queryHealthData,
    generateAndEmailSummary
} = require('../controllers/healthSummaryController');

// Apply auth middleware to all health summary routes
router.use(protect);

// GET a patient's saved health summary
router.get('/patient/:patientId', getHealthSummary);

// POST to generate a new health summary
router.post('/generate', generateHealthSummary);

// POST to ask a specific question (query)
router.post('/query', queryHealthData);

router.post('/generate-and-email', generateAndEmailSummary);

module.exports = router;
