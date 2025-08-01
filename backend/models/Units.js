const mongoose = require('mongoose');

const UnitSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  baseUnit: {
    type: String,
    enum: ['kg', 'liter', 'pieces'],
    required: true,
  },
  standardUnit: {
    type: String,
    required: false, // Making this optional as requested
  },
  symbol: {
    type: String,
    required: true,
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  },
  unitType: {
    type: String,
    enum: ['standard', 'branch'],
    default: 'standard'
  }
}, { timestamps: true });

module.exports = mongoose.model('Unit', UnitSchema);