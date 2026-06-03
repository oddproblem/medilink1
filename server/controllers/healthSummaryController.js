// healthSummaryController.js

const mongoose = require("mongoose");
const jwt =require("jsonwebtoken");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const PDFDocument = require("pdfkit");
const Patient = require("../models/patientModel");
const DiseaseHistory = require("../models/diseaseHistoryModel");
const Prescription = require("../models/prescriptionModel");
const DailyReading = require("../models/dailyReadingModel");
const HealthSummary = require("../models/healthSummaryModel");
const { sendPatientSummaryEmail } = require("../services/emailService");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Helper function to delay execution, used for retries.
 * @param {number} ms - The number of milliseconds to wait.
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Creates a styled PDF document from summary text in memory.
 * @param {object} patient - The patient object from the database.
 * @param {string} summaryText - The AI-generated or fallback summary content.
 * @returns {Promise<Buffer>} A promise that resolves with the PDF buffer.
 */
const createSummaryPdf = (patient, summaryText) => {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });

    // --- PDF Header ---
    doc
      .fontSize(24)
      .fillColor("#2563EB")
      .text("Patient Health Summary", { align: "center" });
    doc.moveDown(2);

    // --- Patient Details Section ---
    doc.fontSize(16).fillColor("#111827").text("Patient Information", { underline: true });
    doc.moveDown(0.5);
    doc
      .fontSize(12)
      .text(`Full Name: ${patient.fullName}`, { continued: true })
      .fillColor("#6B7280")
      .text(` (ID: ${patient._id})`, { continued: false });
    doc.fillColor("#111827").text(`Age: ${patient.age}`);
    doc.text(`Gender: ${patient.gender}`);
    doc.moveDown(2);

    // --- Summary Content Section ---
    doc.fontSize(16).fillColor("#111827").text("AI-Generated Health Analysis", { underline: true });
    doc.moveDown(0.5);

    // Split the summary into sections for better formatting
    const sections = summaryText.split(/\*\*(.*?)\*\*/).filter(Boolean);

    for (let i = 0; i < sections.length; i += 2) {
      const title = sections[i].replace(":", "").trim();
      const content = sections[i + 1] ? sections[i + 1].trim() : "";

      if (title) {
        doc.fontSize(14).fillColor("#374151").text(title);
        doc.moveDown(0.5);
      }
      if (content) {
        doc.fontSize(11).fillColor("#4B5563").text(content, { align: "justify" });
        doc.moveDown();
      }
    }

    // --- PDF Footer ---
    const pageBottom = doc.page.height - 50;
    doc
      .fontSize(8)
      .fillColor("#9CA3AF")
      .text(
        `Generated on: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`,
        50,
        pageBottom,
        { align: "left" }
      );
    doc.text(
      "This is an AI-generated document. Please consult a qualified doctor for medical advice.",
      50,
      pageBottom,
      { align: "right" }
    );

    doc.end();
  });
};

/**
 * Wrapper for Gemini API call with exponential backoff retry logic.
 * @param {object} model - The Generative AI model instance.
 * @param {string} prompt - The prompt to send to the model.
 * @param {number} [maxRetries=3] - The maximum number of retry attempts.
 * @returns {Promise<object>} The result from the API call.
 */
async function generateContentWithRetry(model, prompt, maxRetries = 3) {
  let attempt = 0;
  let delay = 1000; // Start with 1 second delay

  while (attempt < maxRetries) {
    try {
      const result = await model.generateContent(prompt);
      return result; // Success
    } catch (error) {
      // Retry only on 503 Service Unavailable errors
      if (error.status === 503 || (error.message && error.message.includes("503"))) {
        attempt++;
        if (attempt >= maxRetries) throw error;
        console.warn(`Gemini API overloaded. Retrying... (Attempt ${attempt})`);
        await sleep(delay);
        delay *= 2; // Exponential backoff
      } else {
        console.error("A non-retriable Gemini API error occurred:", error.message);
        throw error; // Re-throw other errors immediately
      }
    }
  }
}

/**
 * @desc    Get the saved health summary for a patient
 * @route   GET /api/v1/summary/patient/:patientId
 * @access  Public
 */
exports.getHealthSummary = async (req, res) => {
  try {
    const { patientId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ error: "Invalid Patient ID format." });
    }
    const summary = await HealthSummary.findOne({ patientId });
    if (!summary) {
      return res.status(404).json({ message: "No health summary found for this patient." });
    }
    res.status(200).json(summary);
  } catch (error) {
    console.error("Error in getHealthSummary:", error);
    res.status(500).json({ error: "Failed to retrieve health summary.", details: error.message });
  }
};

/**
 * @desc    Generate and SAVE a health summary using patient data
 * @route   POST /api/v1/summary/generate
 * @access  Public
 */
exports.generateHealthSummary = async (req, res) => {
  let patient;
  const { patientId } = req.body;

  try {
    if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ error: "A valid Patient ID is required." });
    }
    patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ error: "Patient not found." });

    const history = await DiseaseHistory.find({ patientId }).sort({ diagnosisDate: -1 });
    const prescriptions = await Prescription.find({ patientId }).sort({ date: -1 });
    const latestReading = await DailyReading.findOne({ patientId }).sort({ date: -1 });

    let dataContext = `Patient Name: ${patient.fullName}\nAge: ${patient.age}\nGender: ${patient.gender}\n`;
    if (latestReading?.bloodPressure) {
      dataContext += `Latest Vitals: Blood Pressure ${latestReading.bloodPressure.systolic}/${latestReading.bloodPressure.diastolic} mmHg, Pulse: ${latestReading.pulseRate} bpm.\n`;
    }
    if (history.length > 0) {
      dataContext += "Known Conditions: " + history.map(h => `${h.illnessName} (Status: ${h.status})`).join(", ") + ".\n";
    }
    const currentMeds = prescriptions.flatMap(p => p.medicines).filter(m => m.status === "current");
    if (currentMeds.length > 0) {
      dataContext += "Current Medications: " + currentMeds.map(m => `${m.name} (${m.dosage})`).join(", ") + ".\n";
    }

    const prompt = `
      You are a senior medical analyst. Synthesize the provided data into a comprehensive health summary.
      Structure the summary into sections using markdown bold for titles: "**Overview**", "**Key Medical History**", "**Current Status**", and "**Medication Review**".
      Present it in a cohesive, paragraph-based format.

      Data:
      ---
      ${dataContext}
      ---
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await generateContentWithRetry(model, prompt);
    const summaryText = result.response.text();

    const summaryData = { patientId, summaryContent: summaryText, generatedAt: new Date(), sourceData: `AI-Generated.` };
    const savedSummary = await HealthSummary.findOneAndUpdate({ patientId }, summaryData, { new: true, upsert: true });
    res.status(200).json(savedSummary);

  } catch (error) {
    console.error("Error in generateHealthSummary:", error.message);
    console.warn("AI generation failed. Creating a basic fallback summary.");
    try {
      if (!patient) patient = await Patient.findById(patientId);
      if (!patient) return res.status(404).json({ error: "Patient not found for fallback." });

      const fallbackSummaryContent = `
        **Overview**: A basic health summary for ${patient.fullName}, a ${patient.age}-year-old ${patient.gender}.
        **Medical History**: Includes ${await DiseaseHistory.find({ patientId }).then(h => h.length ? h.map(item => item.illnessName).join(", ") : "no specified conditions")}.
        **Medications**: Current medications include: ${await Prescription.find({ patientId }).then(p => { const meds = p.flatMap(pres => pres.medicines).filter(m => m.status === "current"); return meds.length ? meds.map(m => `${m.name} ${m.dosage}`).join(", ") : "None listed"; })}.
      `.replace(/\s+/g, " ").trim();

      const summaryData = { patientId: patient._id, summaryContent: fallbackSummaryContent, generatedAt: new Date(), sourceData: "Fallback summary generated due to AI service unavailability or error." };
      const savedSummary = await HealthSummary.findOneAndUpdate({ patientId: patient._id }, summaryData, { new: true, upsert: true });
      res.status(200).json(savedSummary);
    } catch (fallbackError) {
      console.error("Error creating fallback summary:", fallbackError);
      res.status(500).json({ error: "Failed to generate summary, and the fallback also failed.", details: fallbackError.message });
    }
  }
};

/**
 * @desc    Answer a specific question based on a patient's health data
 * @route   POST /api/v1/summary/query
 * @access  Public
 */
exports.queryHealthData = async (req, res) => {
  try {
    const { patientId, userQuery } = req.body;
    if (!patientId || !userQuery || !mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ error: "Valid Patient ID and user query are required." });
    }

    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ error: "Patient not found." });

    const history = await DiseaseHistory.find({ patientId }).sort({ diagnosisDate: -1 });
    const prescriptions = await Prescription.find({ patientId }).sort({ date: -1 });
    const readings = await DailyReading.find({ patientId }).sort({ date: -1 }).limit(30);

    let context = `CONTEXT: You are a helpful medical AI assistant. Analyze the health data for patient "${patient.fullName}".\n\n`;
    context += `PATIENT DETAILS:\n- Age: ${patient.age}\n- Gender: ${patient.gender}\n\n`;
    if (history.length > 0) {
      context += "DISEASE HISTORY:\n" + history.map(h => `- ${h.illnessName} (Diagnosed: ${new Date(h.diagnosisDate).toLocaleDateString()}, Status: ${h.status})`).join("\n") + "\n\n";
    }
    const currentMeds = prescriptions.flatMap(p => p.medicines).filter(m => m.status === "current");
    if (currentMeds.length > 0) {
      context += "CURRENT MEDICATIONS:\n" + currentMeds.map(m => `- ${m.name} ${m.dosage}`).join("\n") + "\n\n";
    }
    if (readings.length > 0) {
      context += "RECENT VITALS:\n" + readings.map(r => `- Date: ${new Date(r.date).toLocaleString()}, BP: ${r.bloodPressure.systolic}/${r.bloodPressure.diastolic}, Pulse: ${r.pulseRate}`).join("\n") + "\n\n";
    }

    const prompt = `${context}QUESTION: Based *only* on the provided health data, answer the doctor's question concisely: "${userQuery}"`;
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await generateContentWithRetry(model, prompt);
    const answer = result.response.text();

    res.status(200).json({ answer });
  } catch (error) {
    console.error("Error in queryHealthData:", error);
    res.status(500).json({ error: "Failed to query health data after multiple retries.", details: error.message });
  }
};


/**
 * @desc    Generate a health summary, create a PDF, and email it to the patient.
 * @route   POST /api/v1/summary/generate-and-email
 * @access  Protected (Requires Doctor Auth)
 */
exports.generateAndEmailSummary = async (req, res) => {
  let patient;
  const { patientId } = req.body;

  try {
    // 1. Validate patient ID
    if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ error: "A valid Patient ID is required." });
    }

    patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ error: "Patient not found." });
    if (!patient.email) return res.status(400).json({ error: "Patient does not have a registered email address." });

    // 2. Aggregate patient data
    const history = await DiseaseHistory.find({ patientId }).sort({ diagnosisDate: -1 });
    const prescriptions = await Prescription.find({ patientId }).sort({ date: -1 });
    const latestReading = await DailyReading.findOne({ patientId }).sort({ date: -1 });

    let dataContext = `Patient Name: ${patient.fullName}\nAge: ${patient.age}\nGender: ${patient.gender}\n`;
    if (latestReading?.bloodPressure) {
      dataContext += `Latest Vitals: Blood Pressure ${latestReading.bloodPressure.systolic}/${latestReading.bloodPressure.diastolic} mmHg, Pulse: ${latestReading.pulseRate} bpm.\n`;
    }
    if (history.length > 0) {
      dataContext += "Known Conditions: " + history.map(h => `${h.illnessName} (Status: ${h.status})`).join(", ") + ".\n";
    }
    const currentMeds = prescriptions.flatMap(p => p.medicines).filter(m => m.status === "current");
    if (currentMeds.length > 0) {
      dataContext += "Current Medications: " + currentMeds.map(m => `${m.name} (${m.dosage})`).join(", ") + ".\n";
    }

    // 3. Generate summary text from AI
    const summaryPrompt = `
      You are a senior medical analyst. Synthesize the provided data into a comprehensive health summary for a patient.
      Structure the summary into sections using markdown bold for titles: "**Overview**", "**Key Medical History**", "**Current Status**", and "**Medication Review**".
      Present it in a cohesive, paragraph-based format.
      Data:
      ---
      ${dataContext}
      ---
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await generateContentWithRetry(model, summaryPrompt);
    const summaryText = result.response.text();

    // 4. Create the PDF from the summary text
    const pdfBuffer = await createSummaryPdf(patient, summaryText);

    // 5. Update the summary in the database
    const summaryData = {
      patientId,
      summaryContent: summaryText,
      generatedAt: new Date(),
      sourceData: `AI-Generated and Emailed as PDF.`,
    };
    await HealthSummary.findOneAndUpdate({ patientId }, summaryData, { new: true, upsert: true });

    // 6. Send the email with the PDF attachment
    await sendPatientSummaryEmail(patient.email, patient.fullName, summaryText, pdfBuffer);

    res.status(200).json({ success: true, message: `Summary PDF generated and sent to ${patient.email}` });

  } catch (error) {
    console.error("Error in generateAndEmailSummary:", error.message);
    console.warn("AI generation or PDF creation failed. Attempting to email a basic fallback summary as PDF.");

    // --- FALLBACK MECHANISM ---
    try {
      if (!patient) patient = await Patient.findById(patientId);
      if (!patient || !patient.email) {
          // Ensure patient and email exist before proceeding
          return res.status(404).json({ error: "Patient not found or has no email for fallback." });
      }

      const fallbackSummaryContent = `
        **Overview**: A basic health summary for ${patient.fullName}, a ${patient.age}-year-old ${patient.gender}.
        **Medical History**: Includes ${await DiseaseHistory.find({ patientId }).then(h => h.length ? h.map(item => item.illnessName).join(", ") : "no specified conditions")}.
        **Medications**: Current medications include: ${await Prescription.find({ patientId }).then(p => { const meds = p.flatMap(pres => pres.medicines).filter(m => m.status === "current"); return meds.length ? meds.map(m => `${m.name} ${m.dosage}`).join(", ") : "None listed"; })}.
      `.replace(/\s+/g, " ").trim();

      // Create a fallback PDF
      const fallbackPdfBuffer = await createSummaryPdf(patient, fallbackSummaryContent);

      await HealthSummary.findOneAndUpdate({ patientId }, { patientId, summaryContent: fallbackSummaryContent, sourceData: "Fallback summary (Emailed as PDF)." }, { new: true, upsert: true });
      
      // Send the fallback PDF
      await sendPatientSummaryEmail(patient.email, patient.fullName, fallbackSummaryContent, fallbackPdfBuffer);

      res.status(200).json({ success: true, message: `AI failed, but a basic fallback summary PDF was sent to ${patient.email}` });
    } catch (fallbackError) {
      console.error("Error creating and emailing fallback summary:", fallbackError);
      res.status(500).json({ error: "Failed to generate summary, and the fallback also failed.", details: fallbackError.message });
    }
  }
};