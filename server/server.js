// server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path"); // 👈 1. Import the 'path' module

// 👇 2. Configure dotenv with an absolute path to your .env file
dotenv.config({ path: path.resolve(__dirname, '.env') });

// 👇 3. NOW, require and connect to the database
const connectDB = require("./config/db");
connectDB();

const session = require("express-session");
const passport = require("passport");
require("./config/passport"); // Load passport strategy configuration

// --- Continue requiring the rest of your routes ---
const prescriptionRoutes = require("./routes/prescriptionRoutes");
const historyRoutes = require("./routes/historyRoutes");
const healthSummaryRoutes = require("./routes/healthSummaryRoutes");
const noteRoutes = require("./routes/noteRoutes");
const translationRoutes = require("./routes/translationRoutes");
const authRoutes = require("./routes/authRoutes");
const patientRoutes = require("./routes/patientRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const reportRoutes = require("./routes/reportRoutes");
const emergencyRoutes = require("./routes/emergencyRoutes");
const dailyReadingRoutes = require('./routes/dailyReadingRoutes');
const verifyRoutes = require('./routes/verifyRoutes');
const hotspotRoutes = require("./routes/hotspotRoutes");
const emergencyContactRoutes = require('./routes/emergencyContactRoutes');
const emergencyDoctorRoutes = require('./routes/emergencyDoctorRoutes');
const emergencyHospitalRoutes = require('./routes/emergencyHospitalRoutes');
const OcrPrescriptionRoutes = require('./routes/ocrPrescriptionRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const app = express();

// ... (the rest of your server.js file is correct) ...
app.use(express.json({ limit: '10mb' }));
app.use(cors());
app.use("/uploads/ocr", express.static(path.join(__dirname, "tmp")));

// Setup sessions and passport middlewares
app.use(session({
  secret: process.env.SESSION_SECRET || 'swiftmedi-secret-key',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Mount routers
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/patients", patientRoutes);
app.use("/api/v1/appointments", appointmentRoutes);
app.use("/api/v1/doctors", doctorRoutes);
app.use("/api/v1/report", reportRoutes);
app.use("/api/v1/emergency", emergencyRoutes);
app.use("/api/v1/prescriptions", prescriptionRoutes);
app.use("/api/v1/history", historyRoutes);
app.use("/api/v1/notes", noteRoutes);
app.use("/api/v1/summary", healthSummaryRoutes);
app.use('/api/v1/readings', dailyReadingRoutes);
app.use("/api/v1/verify", verifyRoutes);
app.use("/api/v1", translationRoutes);
app.use("/api/v1/hotspots", hotspotRoutes);
app.use("/api/v1/emergency-contacts", emergencyContactRoutes);
app.use("/api/v1/emergency-doctors", emergencyDoctorRoutes);
app.use("/api/v1/emergency-hospitals", emergencyHospitalRoutes);
app.use("/api/v1/ocr-prescriptions", OcrPrescriptionRoutes);

const PORT = process.env.PORT || 5000;

app.get('/api/v1/config/maps', (req, res) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error('Google Maps API Key not found in .env file.');
    return res.status(500).json({ message: 'Server configuration error.' });
  }
  res.status(200).json({ apiKey });
});

app.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`
  );
});
