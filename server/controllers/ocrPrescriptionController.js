const OcrPrescription = require('../models/ocrPrescriptionModel');
const { LLMWhispererClientV2 } = require('llmwhisperer-client');
const { downloadFile } = require('../utils/fileDownloader');
const { extractMedicinesFromText } = require('../services/geminiService');

const whispererClient = new LLMWhispererClientV2();

function getMedicineList(structuredMedicines) {
  if (Array.isArray(structuredMedicines)) return structuredMedicines;
  if (Array.isArray(structuredMedicines?.medicines)) {
    return structuredMedicines.medicines;
  }
  return [];
}

exports.processOcrPrescription = async (req, res) => {
  const { patientId } = req.body;
  const localFilePath = req.file?.path;
  const fileUrl = req.body.fileUrl || (req.file ? `/uploads/ocr/${req.file.filename}` : null);

  if (!fileUrl || !patientId) {
    return res.status(400).json({ message: 'Missing fileUrl or patientId.' });
  }

  let ocrRecord;
  try {
    ocrRecord = await OcrPrescription.create({
      patientId,
      fileUrl,
      status: 'processing',
    });

    res.status(202).json({
      message: 'Prescription accepted and is being processed.',
      recordId: ocrRecord._id,
    });
  } catch (dbError) {
    console.error('DB Error on initial create:', dbError);
    return res.status(500).json({ message: 'Failed to create initial record.' });
  }

  processInBackground(ocrRecord, localFilePath);
};

async function processInBackground(ocrRecord, localFilePath) {
  try {
    const tempFilePath = localFilePath || await downloadFile(ocrRecord.fileUrl);
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
    ocrRecord.structuredMedicines = await extractMedicinesFromText(extractedText);
    ocrRecord.status = 'completed';
    await ocrRecord.save();
  } catch (error) {
    console.error(`Error processing OCR for record ${ocrRecord._id}:`, error);
    ocrRecord.status = 'error';
    ocrRecord.errorMessage = error.message;
    await ocrRecord.save();
  }
}

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

exports.getPrescriptionsForPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const records = await OcrPrescription.find({ patientId }).sort({
      createdAt: -1,
    });
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

exports.getOcrPrescriptionCountForPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const count = await OcrPrescription.countDocuments({ patientId });
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

exports.getAllMedicinesForPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const records = await OcrPrescription.find({
      patientId,
      status: 'completed',
    }).sort({ createdAt: -1 });

    const prescriptions = records.map((record) => ({
      id: record._id,
      date: record.createdAt,
      medicines: getMedicineList(record.structuredMedicines),
    }));

    res.status(200).json(prescriptions);
  } catch (error) {
    console.error(
      `Error fetching OCR medicines for patient ${req.params.patientId}:`,
      error
    );
    res.status(500).json({
      message: 'Server error while fetching prescriptions.',
      error: error.message,
    });
  }
};
