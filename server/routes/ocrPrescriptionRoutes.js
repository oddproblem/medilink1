// server/routes/ocrPrescriptionRoutes.js
const express = require('express');
const router = express.Router();
const {
  processOcrPrescription,
  getOcrPrescriptionResult,
  getPrescriptionsForPatient,
  getOcrPrescriptionCountForPatient, // ✅ Import new function
  getAllMedicinesForPatient,       // ✅ Import new function
} = require('../controllers/ocrPrescriptionController');
const { protect } = require('../middleware/authMiddleware'); // Assuming you have auth middleware
const multer = require('multer');
const path = require('path');

const fs = require('fs');

// Configure multer to save files in the server/tmp directory
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../tmp');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Existing Routes
router.post('/', protect, upload.single('file'), processOcrPrescription);
router.get('/:id', protect, getOcrPrescriptionResult);
router.get('/patient/:patientId', protect, getPrescriptionsForPatient);

// ======== ✅ NEW ROUTES ADDED BELOW ========
router.get('/patient/:patientId/count', protect, getOcrPrescriptionCountForPatient);
router.get('/patient/:patientId/medicines', protect, getAllMedicinesForPatient);

module.exports = router;