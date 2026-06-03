// routes/reportRoutes.js

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { generateReport } = require('../controllers/reportController');

// Apply auth middleware to all report routes
router.use(protect);

router.post('/generate', generateReport);

module.exports = router;