const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

const {
  createDiseaseHistory,
  getHistoryByPatient,
  updateDiseaseHistory,
  getHistorySummaryByPatient,
  getDiseaseHotspots,
  deleteDiseaseHistory
} = require('../controllers/historyController');

// Apply auth middleware to all history routes
router.use(protect);

// --- Route to get disease hotspot locations ---
router.get('/hotspots', getDiseaseHotspots);

// POST: Create a new history entry
router.post('/', createDiseaseHistory);

// GET: Get a summarized history for a patient
router.get('/patient/:patientId/summary', getHistorySummaryByPatient);

// GET: Get the full history for a patient
router.get('/patient/:patientId', getHistoryByPatient);

// PUT: Update an existing history entry by its unique ID
router.put('/:id', updateDiseaseHistory);

// DELETE: Delete a specific history entry by its ID
router.delete('/:id', deleteDiseaseHistory);

module.exports = router;