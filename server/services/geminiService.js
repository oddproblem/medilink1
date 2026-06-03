// server/services/geminiService.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize the Gemini client with the API key from your .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const extractMedicinesFromText = async (text) => {
  console.log("Sending text to Gemini Flash for processing...");

  // ✅ CORRECTED: Switched to the gemini-2.5-flash model
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  // This is the detailed prompt we designed
  const prompt = `
    You are an expert medical transcriptionist AI specializing in extracting structured information from disorganized text extracted from prescriptions via OCR.

    The provided text may contain formatting errors and OCR mistakes. Your task is to carefully analyze the text and extract the following details: patient's name, age, weight, and a list of all prescribed medicines.

    For each medicine, you must extract its "name", "dosage" (e.g., "4ML", "1 tablet"), "frequency" (e.g., "TDS", "Q6H"), and "duration" (e.g., "5d", "3 days").

    Interpret common medical abbreviations:
    - "TDS" means "three times a day".
    - "Q6H" means "every 6 hours".
    - "SOS" (often misread by OCR as "505") means "as needed".

    If a piece of information like duration is not present, set its value to "Not specified".

    Your output must be ONLY a valid JSON object. Do not include any introductory text, explanations, or markdown formatting like \`\`\`json. The entire response should be the raw JSON.

    Here is the OCR text:
    ---
    ${text}
    ---
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    // Clean the response to ensure it's valid JSON
    const cleanedJsonString = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    // Parse the JSON string into an object
    const structuredData = JSON.parse(cleanedJsonString);
    
    console.log("Received structured data from Gemini.");
    return structuredData;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // Return an error structure if the API call fails
    return {
      error: "Failed to process prescription with AI.",
      details: error.message,
    };
  }
};

module.exports = { extractMedicinesFromText };