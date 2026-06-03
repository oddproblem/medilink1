const jwt = require('jsonwebtoken');
const Patient = require('../models/patientModel');
const Doctor = require('../models/Doctor');

/**
 * Unified auth middleware that works for both Patient and Doctor tokens.
 * It first tries to find a Patient, then falls back to Doctor.
 * Sets req.user and req.userRole accordingly.
 */
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Use .pop() to get the actual token at the end, cleanly handling 'Bearer Bearer ...' cached tokens
      token = req.headers.authorization.split(' ').pop();
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Try Patient first
      try {
        let user = await Patient.findById(decoded.id).select('-password');
        if (user) {
          req.user = user;
          req.userRole = 'patient';
          return next();
        }
      } catch (patientErr) {
        // If Patient.findById throws (e.g. CastError), ignore and fall through to try Doctor
        console.log("Patient lookup failed or threw:", patientErr.message);
      }

      // Fallback to Doctor
      try {
        let doctor = await Doctor.findById(decoded.id).select('-password');
        if (doctor) {
          req.user = doctor;
          req.userRole = 'doctor';
          return next();
        }
      } catch (doctorErr) {
        console.log("Doctor lookup failed or threw:", doctorErr.message);
      }

      // Token is valid but user doesn't exist in either collection
      console.log('Auth middleware: valid token but user not found in DBs for id:', decoded.id);
      return res.status(401).json({ message: 'Not authorized, user not found' });
    } catch (error) {
      console.error('Auth middleware error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };