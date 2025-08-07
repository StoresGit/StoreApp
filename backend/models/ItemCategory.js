const mongoose = require('mongoose');

const ItemCategorySchema = new mongoose.Schema({
  nameEn: String,
  nameUr: String,
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ItemCategory',
    default: null
  },
  isSubCategory: {
    type: Boolean,
    default: false
  },
  level: {
    type: Number,
    default: 0 // 0 for main categories, 1 for sub-categories
  }
}, { timestamps: true });

module.exports = mongoose.model('ItemCategory', ItemCategorySchema);
