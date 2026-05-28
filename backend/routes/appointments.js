const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const authMiddleware = require('../middleware/auth');

// POST book an appointment (patients only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can book appointments' });
    }

    const { doctorId, date, timeSlot, symptoms } = req.body;

    // Check if slot is already taken
    const existing = await Appointment.findOne({
      doctor: doctorId,
      date,
      timeSlot,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (existing) {
      return res.status(400).json({ message: 'This time slot is already booked' });
    }

    const appointment = new Appointment({
      patient: req.user.id,
      doctor: doctorId,
      date,
      timeSlot,
      symptoms
    });

    await appointment.save();
    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET patient's own appointments
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user.id })
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'name email' }
      })
      .sort({ createdAt: -1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET doctor's appointments
router.get('/doctor/:doctorId', authMiddleware, async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctor: req.params.doctorId })
      .populate('patient', 'name email phone')
      .sort({ date: 1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT update appointment status (doctor confirms/cancels)
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE cancel appointment (patient cancels their own)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Appointment cancelled' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;