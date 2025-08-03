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
  unitType: {
    type: String,
    enum: ['Branch Unit', 'Standard Unit'],
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
}, { timestamps: true });

module.exports = mongoose.model('Unit', UnitSchema);