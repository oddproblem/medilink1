const express = require('express');
const router = express.Router();
const {
  processOcrPrescription,
  getOcrPrescriptionResult,
  getPrescriptionsForPatient,
  getOcrPrescriptionCountForPatient,
  getAllMedicinesForPatient,
} = require('../controllers/ocrPrescriptionController');
const { protect } = require('../middleware/authMiddleware');
const { parseOptionalOcrUpload } = require('../middleware/ocrUploadMiddleware');

router.post('/', protect, parseOptionalOcrUpload, processOcrPrescription);
router.get('/patient/:patientId/count', protect, getOcrPrescriptionCountForPatient);
router.get('/patient/:patientId/medicines', protect, getAllMedicinesForPatient);
router.get('/patient/:patientId', protect, getPrescriptionsForPatient);
router.get('/:id', protect, getOcrPrescriptionResult);

module.exports = router;
