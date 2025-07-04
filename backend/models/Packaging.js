const mongoose = require('mongoose');

const PackagingSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  type: {
    type: String,
    required: true,
    default: 'base'
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount must be positive']
  },
  unit: {
    type: String,
    required: [true, 'Unit is required']
  },
  packSize: {
    type: Number,
    min: [1, 'Pack size must be at least 1']
  },
  packUnit: {
    type: String,
    enum: ['x', 'per', 'of']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  branches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  }],
  brands: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand'
  }],
  // Parent packaging for sub-packaging hierarchy
  parentPackaging: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Packaging'
  },
  parentType: {
    type: String,
    enum: ['base', 'pack', 'additional']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Compound index for better queries
PackagingSchema.index({ itemId: 1, type: 1 });

// Validation: packSize and packUnit required for pack type
// PackagingSchema.pre('save', function(next) {
//   if (this.type === 'pack') {
//     if (!this.packSize || !this.packUnit) {
//       return next(new Error('Pack size and pack unit are required for pack type packaging'));
//     }
//   }
//   next();
// });

module.exports = mongoose.model('Packaging', PackagingSchema);
