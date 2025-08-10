const mongoose = require('mongoose');

const wastageSchema = new mongoose.Schema({
  branches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  }],
  section: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section',
    required: true
  },
  eventDate: {
    type: Date,
    required: true
  },
  eventName: {
    type: String,
    required: true
  },
  media: {
    type: String, // URL to uploaded image
    default: null
  },
  itemName: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  itemCode: {
    type: String,
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  qty: {
    type: Number,
    required: true,
    min: 0.01
  },
  wastageType: {
    type: String,
    enum: ['Expired', 'Unsold', 'Spill Over'],
    required: true
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
}, {
  timestamps: true
});

// Index for better query performance
wastageSchema.index({ eventDate: -1 });
wastageSchema.index({ branches: 1 });
wastageSchema.index({ section: 1 });
wastageSchema.index({ wastageType: 1 });

module.exports = mongoose.model('Wastage', wastageSchema);
