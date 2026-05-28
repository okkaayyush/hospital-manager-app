const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  specialization: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  experience: {
    type: Number,
    default: 0
  },
  fees: {
    type: Number,
    required: true
  },
  availableDays: {
    type: [String],
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  },
  availableTimeSlots: {
    type: [String],
    default: ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00']
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema);