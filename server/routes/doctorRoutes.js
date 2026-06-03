// routes/doctorRoutes.js
const express = require("express");
const axios = require("axios");
const https = require("https");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Doctor = require("../models/Doctor");

const agent = new https.Agent({
  rejectUnauthorized: false,
});

const router = express.Router();

// --- STEP 1: VERIFICATION ENDPOINT ---
router.post("/verify-doctor", express.json(), async (req, res) => {
  try {
    const { doctorId, licenseNumber } = req.body;

    if (!doctorId || !licenseNumber) {
      return res.status(400).json({ message: "Doctor ID and License Number are required." });
    }

    const nmcURL = "https://www.nmc.org.in/MCIRest/open/getDataFromService?service=searchDoctor";
    const payload = { registrationNo: licenseNumber };

    const response = await axios.post(nmcURL, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 10000,
      httpsAgent: agent,
    });

    const data = response.data;
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(404).json({ message: "No doctor found with that registration number." });
    }

    const nmcDoctor = data[0];
    const apiRegNo = String(nmcDoctor.registrationNo || "").trim();
    const apiDoctorId = String(nmcDoctor.doctorId || "").trim();

    if (apiRegNo !== String(licenseNumber).trim() || apiDoctorId !== String(doctorId).trim()) {
      return res.status(400).json({ message: "Invalid Details: The Doctor ID and Registration Number do not match." });
    }
    
    // Send back the clean, verified data
    const doctorData = {
        doctorId: nmcDoctor.doctorId,
        registrationNo: nmcDoctor.registrationNo,
        name: nmcDoctor.firstName,
        council: nmcDoctor.smcName,
        yearInfo: nmcDoctor.yearInfo,
        address: nmcDoctor.address,
    };
    
    res.json({ success: true, message: "Doctor verified successfully.", doctor: doctorData });

  } catch (error) {
    console.error("Verification Error:", error.message);
    res.status(503).json({ message: "NMC server is temporarily unavailable." });
  }
});


// --- STEP 2: REGISTRATION ENDPOINT ---
router.post("/register", express.json(), async (req, res) => {
  const { username, email, password, verifiedDoctor } = req.body;

  if (!username || !email || !password || !verifiedDoctor) {
    return res.status(400).json({ message: "All registration fields are required." });
  }
  
  try {
    const existingDoctor = await Doctor.findOne({
      $or: [{ email }, { registrationNo: verifiedDoctor.registrationNo }],
    });

    if (existingDoctor) {
      return res.status(409).json({ message: "A user with this email or registration number already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newDoctor = new Doctor({
      // Data from the verification step
      doctorId: verifiedDoctor.doctorId,
      registrationNo: verifiedDoctor.registrationNo,
      name: verifiedDoctor.name,
      council: verifiedDoctor.council,
      yearInfo: verifiedDoctor.yearInfo,
      address: verifiedDoctor.address,
      // User's chosen credentials
      username,
      email,
      password: hashedPassword,
    });

    await newDoctor.save();

    res.status(201).json({ success: true, message: "Doctor registered successfully! You can now log in." });

  } catch(error) {
    console.error("Registration Error:", error.message);
    res.status(500).json({ message: "An internal server error occurred during registration." });
  }
});


// --- LOGIN ENDPOINT ---
router.post("/login", express.json(), async (req, res) => {
    // ... your existing login code remains here
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }
  
    try {
      const doctor = await Doctor.findOne({ email });
      if (!doctor) {
        return res.status(401).json({ message: "Invalid credentials." });
      }
  
      const isMatch = await bcrypt.compare(password, doctor.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials." });
      }
  
      const payload = { id: doctor._id, name: doctor.name };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" });
  
      res.json({
        success: true,
        token: token,
        doctor: { id: doctor._id, name: doctor.name },
      });
    } catch (error) {
      console.error("Login Error:", error.message);
      res.status(500).json({ message: "An internal server error occurred." });
    }
});



router.get("/", async (req, res) => {
    try {
        // Fetch all doctors but exclude their passwords for security.
        const doctors = await Doctor.find({}).select('-password');
        res.status(200).json(doctors);
    } catch (error) {
        console.error('Error fetching all doctors:', error.message);
        res.status(500).json({ message: 'Server error while fetching doctors.' });
    }
});


module.exports = router;