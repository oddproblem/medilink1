const mongoose = require('mongoose');

// ... (emergencyContactSchema and currentMedicationSchema remain the same)

const patientSchema = new mongoose.Schema(
  {
    aadhaarNumber: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true }, // <-- ADDED USERNAME
    password: { type: String, required: true },
    fullName: { type: String, required: true },
    dateOfBirth: { type: Date }, // No longer strictly required on creation
    gender: { type: String },
    address: { /* ... */ },
    age: { type: Number },
    email: { type: String, unique: true, sparse: true }, // Not required, but must be unique if present
    phone: { type: String }, // Not required
    status: {
      type: String,
      enum: ['registered', 'under treatment', 'critical', 'discharged'],
      default: 'registered',
    },
    emergencyContacts: [/* ... */],
    currentMedications: [/* ... */],
  },
  {
    timestamps: true,
  }
);

const Patient = mongoose.model('Patient', patientSchema);
module.exports = Patient;