const mongoose = require('mongoose');

const purchaseCategorySchema = new mongoose.Schema({
  nameEn: {
    type: String,
    required: true,
    trim: true
  },
  nameUr: {
    type: String,
    required: true,
    trim: true
  },
  totalItems: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PurchaseCategory', purchaseCategorySchema); 