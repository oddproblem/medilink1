// services/notificationService.js
const PDFDocument = require('pdfkit');
const Patient = require('../models/patientModel');
const Prescription = require('../models/prescriptionModel');
const DiseaseHistory = require('../models/diseaseHistoryModel');
const DailyReading = require('../models/dailyReadingModel');
const HealthSummary = require('../models/healthSummaryModel');
const { sendPatientSummaryEmail } = require('./emailService');

// Mock function to dispatch emergency alerts
const dispatchEmergencyAlerts = async (patientId) => {
  // In a real app, this would send SMS, push notifications, or emails
  // to the patient's emergency contacts and nearby hospitals.
  console.log(`Emergency alert triggered for patient ${patientId}.`);
  console.log('Dispatching notifications to emergency contacts and authorities...');
  return { message: 'Emergency alerts have been dispatched.' };
};

// Function to handle report generation
const generateAndEmailReport = async (patientId, email) => {
  const patient = await Patient.findById(patientId).lean();
  if (!patient) throw new Error('Patient not found');

  const targetEmail = email || patient.email;
  if (!targetEmail) throw new Error('Patient email not registered');

  const prescriptions = await Prescription.find({ patientId }).lean();
  const history = await DiseaseHistory.find({ patientId }).lean();
  const readings = await DailyReading.find({ patientId }).lean();
  const summaryDoc = await HealthSummary.findOne({ patientId }).lean();

  const doc = new PDFDocument();
  let buffers = [];
  doc.on('data', buffers.push.bind(buffers));
  
  return new Promise((resolve, reject) => {
    doc.on('end', async () => {
      try {
        const pdfBuffer = Buffer.concat(buffers);
        await sendPatientSummaryEmail(targetEmail, patient.fullName, 'Your health report', pdfBuffer);
        resolve({
          message: `Your health report has been successfully generated and sent to ${targetEmail}.`,
        });
      } catch (err) {
        reject(err);
      }
    });

    // Write PDF Content
    doc.fontSize(22).text('SwiftMediLink Patient Health Report', { align: 'center' });
    doc.moveDown();

    doc.fontSize(14).text(`Patient Name: ${patient.fullName}`);
    doc.text(`Age: ${patient.age || 'N/A'}`);
    doc.text(`Gender: ${patient.gender || 'N/A'}`);
    doc.text(`Aadhaar: ${patient.aadhaarNumber}`);
    if (patient.phone) doc.text(`Phone: ${patient.phone}`);
    doc.text(`Email: ${targetEmail}`);
    doc.moveDown();

    doc.fontSize(16).text('AI Health Summary', { underline: true });
    doc.fontSize(12).text(summaryDoc ? summaryDoc.summaryContent : 'No summary available.');
    doc.moveDown();

    doc.fontSize(16).text('Current Medications', { underline: true });
    if (prescriptions && prescriptions.length > 0) {
      prescriptions.forEach(p => {
        if (p.medicines) {
          p.medicines.forEach(m => {
            doc.fontSize(12).text(`- ${m.name} (Dosage: ${m.dosage || 'N/A'}, Freq: ${m.frequency || 'N/A'}, Duration: ${m.duration || 'N/A'}) [Status: ${m.status}]`);
          });
        }
      });
    } else {
      doc.fontSize(12).text('No prescriptions on record.');
    }
    doc.moveDown();

    doc.fontSize(16).text('Disease History', { underline: true });
    if (history && history.length > 0) {
      history.forEach(h => {
        doc.fontSize(12).text(`- ${h.illnessName || 'N/A'} (Diagnosed: ${h.diagnosisDate ? new Date(h.diagnosisDate).toDateString() : 'N/A'}) - ${h.remarks || 'No remarks'}`);
      });
    } else {
      doc.fontSize(12).text('No disease history on record.');
    }
    doc.moveDown();

    doc.fontSize(16).text('Recent Daily Readings / Vitals', { underline: true });
    if (readings && readings.length > 0) {
      readings.slice(-10).forEach(r => {
        const dateStr = r.date ? new Date(r.date).toDateString() : 'N/A';
        doc.fontSize(12).text(`- ${dateStr}: BP ${r.bloodPressure?.systolic}/${r.bloodPressure?.diastolic} mmHg, Weight: ${r.weightKg || 'N/A'} kg, Pulse: ${r.pulseRate || 'N/A'} bpm`);
      });
    } else {
      doc.fontSize(12).text('No vitals on record.');
    }

    doc.end();
  });
};

module.exports = {
  dispatchEmergencyAlerts,
  generateAndEmailReport,
};