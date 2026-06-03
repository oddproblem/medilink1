const Prescription = require('../models/prescriptionModel');
const Patient = require('../models/patientModel');
const Doctor = require('../models/Doctor');

/**
 * @desc      Create a new prescription
 * @route     POST /api/v1/prescriptions
 * @access    Private (e.g., Doctor only)
 */
exports.createPrescription = async (req, res) => {
  try {
    const { patientId, doctorId, medicines, diseaseHistoryId } = req.body;

    if (!patientId || !doctorId) {
      return res.status(400).json({ message: 'Missing required fields: patientId and doctorId are required.' });
    }

    const patientExists = await Patient.findById(patientId);
    if (!patientExists) {
      return res.status(404).json({ message: `Patient with ID ${patientId} not found.` });
    }

    const doctorExists = await Doctor.findById(doctorId);
    if (!doctorExists) {
      return res.status(404).json({ message: `Doctor with ID ${doctorId} not found.` });
    }

    const newPrescriptionData = {
      patientId,
      doctorId,
      medicines: medicines || [],
    };

    if (diseaseHistoryId) {
      newPrescriptionData.diseaseHistoryId = diseaseHistoryId;
    }

    const newPrescription = new Prescription(newPrescriptionData);
    const savedPrescription = await newPrescription.save();

    const populatedPrescription = await Prescription.findById(savedPrescription._id)
      .populate('doctorId', 'name')
      .populate('diseaseHistoryId', 'illnessName');

    res.status(201).json(populatedPrescription);

  } catch (error) {
    console.error('Error creating prescription:', error);
    res.status(500).json({ message: 'Server error while creating prescription.' });
  }
};

/**
 * @desc      Get all prescriptions for a specific patient
 * @route     GET /api/prescriptions/patient/:patientId
 * @access    Private
 */
exports.getPrescriptionsByPatient = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patientId: req.params.patientId })
      .populate('doctorId', 'name')
      .populate('diseaseHistoryId', 'illnessName')
      .sort({ date: -1 });

    if (!prescriptions || prescriptions.length === 0) {
      return res.status(404).json({ message: 'No prescriptions found for this patient.' });
    }
    res.status(200).json(prescriptions);
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({ message: 'Server error while fetching prescriptions.' });
  }
};

/**
 * @desc      Update an existing prescription (e.g., add/remove medicines)
 * @route     PUT /api/prescriptions/:id
 * @access    Private (e.g., Doctor only)
 */
exports.updatePrescription = async (req, res) => {
  try {
    const { medicines } = req.body;

    const updatedPrescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      { medicines },
      { new: true, runValidators: true }
    )
    .populate('doctorId', 'name')
    .populate('diseaseHistoryId', 'illnessName');

    if (!updatedPrescription) {
      return res.status(404).json({ message: 'Prescription not found.' });
    }

    res.status(200).json(updatedPrescription);

  } catch (error) {
    console.error('Error updating prescription:', error);
    res.status(500).json({ message: 'Server error while updating prescription.' });
  }
};

/**
 * @desc      Add a new medicine to an existing prescription
 * @route     POST /api/prescriptions/:id/medicines
 * @access    Private
 */
exports.addMedicineToPrescription = async (req, res) => {
  try {
    const { name, dosage, frequency, duration } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Medicine name is required.' });
    }

    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found.' });
    }

    const newMedicine = { name, dosage, frequency, duration };
    prescription.medicines.push(newMedicine);
    await prescription.save();

    const populatedPrescription = await prescription.populate([
        { path: 'doctorId', select: 'name' },
        { path: 'diseaseHistoryId', select: 'illnessName' }
    ]);

    res.status(201).json(populatedPrescription);

  } catch (error) {
    console.error('Error adding medicine:', error);
    res.status(500).json({ message: 'Server error while adding medicine.' });
  }
};

/**
 * @desc      Update a specific medicine's details in a prescription
 * @route     PUT /api/prescriptions/:prescriptionId/medicines/:medicineId
 * @access    Private
 */
exports.updateMedicineDetails = async (req, res) => {
  try {
    const { prescriptionId, medicineId } = req.params;
    const { name, dosage, frequency, duration } = req.body;

    const updateFields = {};
    if (name !== undefined) {
        if (name.trim() === '') return res.status(400).json({ message: 'Medicine name cannot be empty.' });
        updateFields['medicines.$.name'] = name;
    }
    if (dosage !== undefined) updateFields['medicines.$.dosage'] = dosage;
    if (frequency !== undefined) updateFields['medicines.$.frequency'] = frequency;
    if (duration !== undefined) updateFields['medicines.$.duration'] = duration;
    
    if (Object.keys(updateFields).length === 0) {
        return res.status(400).json({ message: 'No valid fields provided for update.' });
    }
    
    const prescription = await Prescription.findOneAndUpdate(
      { "_id": prescriptionId, "medicines._id": medicineId },
      { "$set": updateFields },
      { new: true, runValidators: true }
    ).populate('doctorId', 'name').populate('diseaseHistoryId', 'illnessName');

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription or medicine not found.' });
    }
    res.status(200).json(prescription);
  } catch (error) {
    console.error('Error updating medicine details:', error);
    res.status(500).json({ message: 'Server error while updating medicine details.' });
  }
};

/**
 * @desc      Update ONLY the status of a medicine
 * @route     PATCH /api/prescriptions/:prescriptionId/medicines/:medicineId/status
 * @access    Private
 */
exports.updateMedicineStatus = async (req, res) => {
  try {
    const { prescriptionId, medicineId } = req.params;
    const { status } = req.body;

    if (!status || !['current', 'past'].includes(status)) {
      return res.status(400).json({ message: "Status must be 'current' or 'past'." });
    }

    const prescription = await Prescription.findOneAndUpdate(
      { "_id": prescriptionId, "medicines._id": medicineId },
      { "$set": { "medicines.$.status": status } },
      { new: true }
    ).populate('doctorId', 'name').populate('diseaseHistoryId', 'illnessName');

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription or medicine not found.' });
    }
    res.status(200).json(prescription);
  } catch (error) {
    console.error('Error updating medicine status:', error);
    res.status(500).json({ message: 'Server error while updating medicine status.' });
  }
};

exports.deleteMedicineFromPrescription = async (req, res) => {
  try {
    const { prescriptionId, medicineId } = req.params;

    const prescription = await Prescription.findById(prescriptionId);

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found.' });
    }

    // Pull (remove) the medicine from the medicines array
    prescription.medicines.pull({ _id: medicineId });

    await prescription.save();
    
    // Repopulate to send the full object back
    const populatedPrescription = await Prescription.findById(prescriptionId)
        .populate('doctorId', 'name')
        .populate('diseaseHistoryId', 'illnessName');

    res.status(200).json(populatedPrescription);

  } catch (error) {
    console.error('Error deleting medicine from prescription:', error);
    res.status(500).json({ message: 'Server error while deleting medicine.' });
  }
};

/**
 * @desc      Delete a prescription
 * @route     DELETE /api/v1/prescriptions/:id
 * @access    Private
 */
exports.deletePrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findByIdAndDelete(req.params.id);

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found.' });
    }

    res.status(200).json({ success: true, message: 'Prescription deleted successfully.' });

  } catch (error) {
    console.error('Error deleting prescription:', error);
    res.status(500).json({ message: 'Server error while deleting prescription.' });
  }
};