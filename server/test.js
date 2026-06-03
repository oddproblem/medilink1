// test-gemini.js
require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

(async () => {
  const key = process.env.GEMINI_API_KEY;
  console.log("🔑 Using key:", key.slice(0, 10) + "...");
  
  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent("Say 'Hello from Node.js' in one sentence.");
    console.log("✅ Gemini response:", result.response.text());
  } catch (err) {
    console.error("❌ Gemini error:", err.message);
  }
})();
