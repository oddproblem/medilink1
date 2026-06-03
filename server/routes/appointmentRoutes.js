const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  bookAppointment,
  getDoctorAppointments,
  getPatientAppointments,
  getPatientAppointmentCount,
  updateAppointmentStatus,
} = require('../controllers/appointmentController');

// Apply auth middleware to all appointment routes
router.use(protect);

router.post('/', bookAppointment);

// Get appointments for a specific doctor
router.get('/doctor/:doctorId', getDoctorAppointments);

router.get('/patient/:patientId', getPatientAppointments);
router.get('/patient/:patientId/count', getPatientAppointmentCount);
router.patch('/:appointmentId/status', updateAppointmentStatus);

module.exports = router;
