// routes/emergencyRoutes.js

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { triggerAlert } = require('../controllers/emergencyController');

// Apply auth middleware to all emergency routes
router.use(protect);

router.post('/alert', triggerAlert);

module.exports = router;