const Patient = require('../models/patientModel'); // Adjust path as needed

/**
 * @desc    Calculate AGGREGATE statistics for the hero counter cards.
 * @route   GET /api/v1/patients/statistics
 * @access  Public
 */
exports.getPatientStatistics = async (req, res) => {
  try {
    // This logic is restored to calculate all original stats
    const underTreatmentCount = await Patient.countDocuments({ status: 'under treatment' });
    const criticalCount = await Patient.countDocuments({ status: 'critical' });
    const dischargedCount = await Patient.countDocuments({ status: 'discharged' });
    const totalPatients = await Patient.countDocuments();

    res.status(200).json({
      success: true,
      message: 'Patient statistics fetched successfully.',
      statistics: {
        patientsBeingCured: underTreatmentCount + criticalCount,
        patientsDischarged: dischargedCount, // This is the 'cured' count
        totalPatients: totalPatients,
      },
    });
  } catch (error) {
    console.error('Error calculating patient statistics:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Get monthly registration data for the DYNAMIC CHART.
 * @route   GET /api/v1/patients/analytics/registrations
 * @access  Public
 */
exports.getRegistrationAnalytics = async (req, res) => {
  try {
    const analytics = await Patient.aggregate([
      {
        $project: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
      },
      {
        $group: {
          _id: { year: '$year', month: '$month' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1,
        },
      },
    ]);
    res.status(200).json({ success: true, analytics });
  } catch (error) {
    console.error('Error fetching registration analytics:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};


// Add these new functions to your existing patientController.js

/**
 * @desc    Search for patients by name
 * @route   GET /api/v1/patients/search?q=John
 * @access  Private (Doctor)
 */
exports.searchPatients = async (req, res) => {
  try {
    const query = req.query.q || '';
    if (query.length < 2) {
      return res.status(200).json([]); // Don't search for very short strings
    }
    
    // Using regex for a case-insensitive "contains" search
    const patients = await Patient.find({ 
      fullName: { $regex: query, $options: 'i' } 
    }).limit(10); // Limit to 10 results for performance

    res.status(200).json(patients);
  } catch (error) {
    console.error('Error searching patients:', error);
    res.status(500).json({ message: 'Server error during patient search.' });
  }
};

/**
 * @desc    Get a single patient by their MongoDB ID
 * @route   GET /api/v1/patients/:id
 * @access  Private (Doctor)
 */
exports.getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found.' });
    }
    res.status(200).json(patient);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * @desc    Get patients filtered by status
 * @route   GET /api/v1/patients?status=under treatment
 * @access  Private (Doctor)
 */
exports.getPatientsByStatus = async (req, res) => {
  try {
    const status = req.query.status;
    const filter = status ? { status } : {}; // If no status, get all patients
    
    const patients = await Patient.find(filter).sort({ updatedAt: -1 });
    res.status(200).json(patients);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};