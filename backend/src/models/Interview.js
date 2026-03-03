const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true
  },
  position: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Position',
    required: true
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  interviewers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  interviewType: {
    type: String,
    enum: ['phone', 'video', 'onsite', 'technical', 'behavioral'],
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  feedback: {
    strengths: String,
    weaknesses: String,
    technicalScore: {
      type: Number,
      min: 1,
      max: 10
    },
    culturalFitScore: {
      type: Number,
      min: 1,
      max: 10
    },
    overallRating: {
      type: Number,
      min: 1,
      max: 10
    },
    recommendation: {
      type: String,
      enum: ['hire', 'reject', 'consider']
    },
    notes: String
  },
  meetingLink: {
    type: String
  },
  location: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const Interview = mongoose.model('Interview', interviewSchema);
module.exports = Interview; 