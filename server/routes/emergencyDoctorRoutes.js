const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    createEmergencyDoctor,
    getAllEmergencyDoctors,
    updateEmergencyDoctor,
    deleteEmergencyDoctor,
} = require('../controllers/emergencyDoctorController');

// Apply auth middleware to all emergency doctor routes
router.use(protect);

// Routes
router.route('/')
    .post(createEmergencyDoctor)
    .get(getAllEmergencyDoctors);

router.route('/:id')
    .put(updateEmergencyDoctor)
    .delete(deleteEmergencyDoctor);

module.exports = router;