const Appointment = require('../models/appointmentModel');
const Doctor = require('../models/Doctor');
const mongoose = require('mongoose');

/**
 * @desc    Book a new appointment
 * @route   POST /api/appointments
 * @access  Public
 */
const bookAppointment = async (req, res) => {
  try {
    const { doctorId, appointmentDate, reason, patientId } = req.body;

    if (!doctorId || !appointmentDate || !reason || !patientId) {
      return res.status(400).json({ message: 'Doctor, date, reason, and patientId are required.' });
    }

    // Check doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found.' });
    }

    const appointment = new Appointment({
      doctorId,
      patientId,
      appointmentDate,
      reason,
      status: 'scheduled',
    });

    const savedAppointment = await appointment.save();
    res.status(201).json(savedAppointment);
  } catch (err) {
    console.error("Error booking appointment:", err);
    res.status(500).json({ message: 'Server error while booking appointment.' });
  }
};

/**
 * @desc    Get appointments for a specific doctor
 * @route   GET /api/appointments/doctor/:doctorId
 * @access  Public
 */
const getDoctorAppointments = async (req, res) => {
    try {
        const { doctorId } = req.params; // Get doctorId from URL parameters

        if (!mongoose.Types.ObjectId.isValid(doctorId)) {
            return res.status(400).json({ message: 'Invalid Doctor ID format.' });
        }

        const appointments = await Appointment.find({
            doctorId: doctorId,
            status: 'scheduled',
        })
        .populate('patientId', 'fullName age') // Populate with patient's name and age
        .sort({ appointmentDate: 1 }); // Sort by the nearest appointment date

        res.status(200).json(appointments);
    } catch (err) {
        console.error("Error fetching doctor appointments:", err);
        res.status(500).json({ message: 'Server error fetching appointments.' });
    }
};


/**
 * @desc    Get open (scheduled) appointments for a patient
 * @route   GET /api/appointments/patient/:patientId
 * @access  Public
 */
const getPatientAppointments = async (req, res) => {
  try {
    const { patientId } = req.params;

    const openAppointments = await Appointment.find({
      patientId,
      status: 'scheduled',
    })
      .sort({ appointmentDate: 1 })
      .populate('doctorId', 'name council');

    const pastAppointments = await Appointment.find({
      patientId,
      status: { $in: ['completed', 'cancelled'] },
    })
      .sort({ appointmentDate: -1 })
      .populate('doctorId', 'name council');

    res.status(200).json({
      openAppointments,
      pastAppointments,
    });
  } catch (err) {
    console.error("Error fetching appointments:", err);
    res.status(500).json({ message: 'Server error fetching appointments.' });
  }
};

/**
 * @desc    Get count of open appointments
 * @route   GET /api/appointments/patient/:patientId/count
 * @access  Public
 */
const getPatientAppointmentCount = async (req, res) => {
  try {
    const { patientId } = req.params;
    const count = await Appointment.countDocuments({
      patientId,
      status: 'scheduled',
    });
    res.status(200).json({ count });
  } catch (err) {
    console.error("Error counting appointments:", err);
    res.status(500).json({ message: 'Server error counting appointments.' });
  }
};

/**
 * @desc    Mark appointment as completed or cancelled (doctor action)
 * @route   PATCH /api/appointments/:appointmentId/status
 * @access  Public
 */
const updateAppointmentStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status } = req.body;

    if (!['completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Status must be completed or cancelled.' });
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { status },
      { new: true }
    );

    if (!updatedAppointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    res.status(200).json(updatedAppointment);
  } catch (err) {
    console.error("Error updating appointment status:", err);
    res.status(500).json({ message: 'Server error updating appointment status.' });
  }
};

module.exports = {
  bookAppointment,
  getDoctorAppointments,
  getPatientAppointments,
  getPatientAppointmentCount,
  updateAppointmentStatus,
};

