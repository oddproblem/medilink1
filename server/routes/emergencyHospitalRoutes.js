const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    createEmergencyHospital,
    getAllEmergencyHospitals,
    updateEmergencyHospital,
    deleteEmergencyHospital,
} = require('../controllers/emergencyHospitalController');

// Apply auth middleware to all emergency hospital routes
router.use(protect);

// Routes
router.route('/')
    .post(createEmergencyHospital)
    .get(getAllEmergencyHospitals);

router.route('/:id')
    .put(updateEmergencyHospital)
    .delete(deleteEmergencyHospital);

module.exports = router;