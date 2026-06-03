// routes/dailyReadingRoutes.js

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// Import the controller functions
const {
  addDailyReading,
  updateDailyReading,
  getReadingsForPatient,
  deleteDailyReading,
} = require('../controllers/dailyReadingController');

// Apply auth middleware to all reading routes
router.use(protect);

// Define the POST route to add a new reading
router.post('/', addDailyReading);

// Define the GET route to fetch all readings for a patient
router.get('/patient/:patientId', getReadingsForPatient);

// Define the PUT route to update a reading by its ID
router.put('/:id', updateDailyReading);

router.delete('/:id', deleteDailyReading);

module.exports = router;