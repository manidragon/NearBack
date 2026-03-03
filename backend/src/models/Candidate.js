const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  resume: {
    type: String, // URL to stored resume file
    required: true
  },
  coverLetter: {
    type: String
  },
  appliedPositions: [{
    position: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Position'
    },
    appliedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'],
      default: 'applied'
    }
  }],
  skills: [String],
  experience: [{
    company: String,
    title: String,
    duration: String,
    description: String
  }],
  education: [{
    institution: String,
    degree: String,
    field: String,
    graduationYear: Number
  }],
  notes: {
    type: String
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

const Candidate = mongoose.model('Candidate', candidateSchema);
module.exports = Candidate; 