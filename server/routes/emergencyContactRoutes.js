const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    createEmergencyContact,
    getContactsByPatient,
    updateEmergencyContact,
    deleteEmergencyContact,
} = require('../controllers/emergencyContactController');

// Apply auth middleware to all emergency contact routes
router.use(protect);

// Routes
router.post('/', createEmergencyContact);
router.get('/patient/:patientId', getContactsByPatient);
router.put('/:id', updateEmergencyContact);
router.delete('/:id', deleteEmergencyContact);

module.exports = router;