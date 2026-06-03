// server/controllers/ocrPrescriptionController.js

const OcrPrescription = require('../models/ocrPrescriptionModel');
const { LLMWhispererClientV2 } = require('llmwhisperer-client');
const { downloadFile } = require('../utils/fileDownloader');
const { extractMedicinesFromText } = require('../services/geminiService');

// Initialize LLMWhisperer Client
const whispererClient = new LLMWhispererClientV2();

/**
 * @desc    Accepts a prescription file for processing
 * @route   POST /api/v1/ocr-prescriptions
 */
exports.processOcrPrescription = async (req, res) => {
  const patientId = req.body.patientId;
  let fileUrl = req.body.fileUrl;
  let localPath = null;

  if (req.file) {
    fileUrl = `/uploads/${req.file.filename}`;
    localPath = req.file.path;
  }

  if (!fileUrl || !patientId) {
    return res.status(400).json({ message: 'Missing fileUrl/file or patientId.' });
  }

  let ocrRecord;
  try {
    ocrRecord = await OcrPrescription.create({ patientId, fileUrl, status: 'processing' });
    res.status(202).json({ 
      message: 'Prescription accepted and is being processed.',
      recordId: ocrRecord._id 
    });
  } catch (dbError) {
    console.error('DB Error on initial create:', dbError);
    return res.status(500).json({ message: 'Failed to create initial record.' });
  }
  
  processInBackground(ocrRecord, localPath);
};

/**
 * @desc    Helper function to run OCR and AI extraction in the background.
 */
const processInBackground = async (ocrRecord, localPath = null) => {
  try {
    const tempFilePath = localPath || await downloadFile(ocrRecord.fileUrl);
    const whisperResult = await whispererClient.whisper({
      filePath: tempFilePath,
      waitForCompletion: true,
      waitTimeout: 180,
    });

    if (whisperResult.status !== 'processed') {
      throw new Error('LLMWhisperer failed to process the file.');
    }
    const extractedText = whisperResult.extraction.result_text;
    ocrRecord.ocrText = extractedText;

    const medicines = await extractMedicinesFromText(extractedText);
    ocrRecord.structuredMedicines = medicines;

    ocrRecord.status = 'completed';
    await ocrRecord.save();
  } catch (error) {
    console.error(`Error processing OCR for record ${ocrRecord._id}:`, error);
    ocrRecord.status = 'error';
    ocrRecord.errorMessage = error.message;
    await ocrRecord.save();
  }
};

/**
 * @desc    Get the result of a specific OCR prescription process
 * @route   GET /api/v1/ocr-prescriptions/:id
 */
exports.getOcrPrescriptionResult = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await OcrPrescription.findById(id);

    if (!record) {
      return res.status(404).json({ message: 'Record not found.' });
    }
    res.status(200).json(record);
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

/**
 * @desc    Get all prescription records for a specific patient
 * @route   GET /api/v1/ocr-prescriptions/patient/:patientId
 */
exports.getPrescriptionsForPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const records = await OcrPrescription.find({ patientId }).sort({ createdAt: -1 });
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};


// ======== ✅ NEW CONTROLLER FUNCTIONS ADDED BELOW ========

/**
 * @desc    Get the count of OCR prescriptions for a patient
 * @route   GET /api/v1/ocr-prescriptions/patient/:patientId/count
 */
exports.getOcrPrescriptionCountForPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    // Using countDocuments is more efficient than fetching all documents
    const count = await OcrPrescription.countDocuments({ patientId });
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

/**
 * @desc    Get all unique medicines from completed prescriptions for a patient
 * @route   GET /api/v1/ocr-prescriptions/patient/:patientId/medicines
 */
/**
 * @desc    Get an array of all individual prescriptions for a patient
 * @route   GET /api/v1/ocr-prescriptions/patient/:patientId/medicines
 */
exports.getAllMedicinesForPatient = async (req, res) => {
  try {
    const { patientId } = req.params;

    // Find all completed records and sort by newest first
    const records = await OcrPrescription.find({
      patientId,
      status: 'completed'
    }).sort({ createdAt: -1 });

    if (!records || records.length === 0) {
      return res.status(200).json([]); // Return an empty array if no records found
    }

    // Map each record into a structured object for the frontend
    const individualPrescriptions = records.map(record => {
      const medicines = record.structuredMedicines?.medicines || [];
      return {
        id: record._id, // Use the unique DB id for React keys
        date: record.createdAt, // The date of this specific prescription
        medicines: Array.isArray(medicines) ? medicines : [] // The list of medicines for this prescription
      };
    });

    res.status(200).json(individualPrescriptions);

  } catch (error) {
    console.error(`Error fetching individual prescriptions for patient ${req.params.patientId}:`, error);
    res.status(500).json({ message: 'Server error while fetching prescriptions.', error: error.message });
  }
};