const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Patient = require('../models/patientModel'); // Using Patient model

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key';

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

/**
 * Creates a new patient after verifying they don't already exist.
 */
const registerUser = async (userData, password, email) => {
  // 1. Generate the unique username first
  const nameWithoutSpaces = userData.name.replace(/\s/g, '');
  const uidLast4 = userData.uid.slice(-4);
  const username = `${nameWithoutSpaces}${uidLast4}`;

  // 2. Check if a patient with this username already exists
  const existingPatient = await Patient.findOne({ username });
  if (existingPatient) {
    // If they exist, throw a specific error to be caught by the controller.
    throw new Error('This user is already registered. Please log in.');
  }

  // 3. If they don't exist, proceed with creating the new patient record.
  const hashedPassword = await hashPassword(password);
  const patientData = {
    fullName: userData.name,
    aadhaarNumber: userData.uid,
    username: username,
    password: hashedPassword,
    email: email,
    gender: userData.gender,
    address: { street: userData.address },
    age: userData.age,
  };

  // 4. Safely handle and parse the dateOfBirth
  if (userData.dob) {
    // Let JavaScript's Date parser handle it directly.
    const parsedDate = new Date(userData.dob);
    
    // Check if the resulting date is valid before assigning it.
    if (!isNaN(parsedDate.getTime())) {
      patientData.dateOfBirth = parsedDate;
    } else {
      console.warn(`Could not parse invalid date string from KYC data: ${userData.dob}`);
    }
  }

  // 5. Create the new user in the database
  return await Patient.create(patientData);
};

/**
 * Authenticates a patient using the constructed username and password.
 */
const authenticateUser = async (uid, name, password) => {
  // Reconstruct the username to find the user
  const nameWithoutSpaces = name.replace(/\s/g, '');
  const uidLast4 = uid.slice(-4);
  const usernameToFind = `${nameWithoutSpaces}${uidLast4}`;
  
  const patient = await Patient.findOne({ username: usernameToFind });
  
  if (!patient || !patient.password) {
    return null; // Patient not found
  }

  const isMatch = await bcrypt.compare(password, patient.password);
  return isMatch ? patient : null;
};

/**
 * Generates a JWT for a patient.
 */
const generateToken = (patient) => {
  const payload = { 
    id: patient._id, 
    username: patient.username, 
    name: patient.fullName,
    role: 'patient'
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
};

module.exports = {
  registerUser,
  authenticateUser,
  generateToken,
};