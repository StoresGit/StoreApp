const mongoose = require('mongoose');

const ItemCategorySchema = new mongoose.Schema({
  nameEn: String,
  nameUr: String,
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  }
}, { timestamps: true });

module.exports = mongoose.model('ItemCategory', ItemCategorySchema);
