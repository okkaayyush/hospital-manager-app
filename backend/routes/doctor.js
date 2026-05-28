const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// GET all approved doctors (public - anyone can view)
router.get('/', async (req, res) => {
  try {
    const doctors = await Doctor.find({ isApproved: true })
      .populate('user', 'name email phone');
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET doctors by specialization
router.get('/specialization/:spec', async (req, res) => {
  try {
    const doctors = await Doctor.find({
      specialization: req.params.spec,
      isApproved: true
    }).populate('user', 'name email phone');
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET single doctor by ID
router.get('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate('user', 'name email phone');
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST create doctor profile (doctor only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { specialization, department, experience, fees, availableDays, availableTimeSlots } = req.body;

    const doctor = new Doctor({
      user: req.user.id,
      specialization,
      department,
      experience,
      fees,
      availableDays,
      availableTimeSlots
    });

    await doctor.save();
    res.status(201).json(doctor);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT update doctor profile
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;