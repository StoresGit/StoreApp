const mongoose = require("mongoose");

const supplierItemSchema = new mongoose.Schema({
  supplier: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Supplier", 
    required: true 
  },
  item: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Item", 
    required: true 
  },
  packaging: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Packaging", 
    required: false 
  },
  packagingType: { 
    type: String, 
    enum: ['base', 'pack', 'additional'], 
    required: true 
  },
  unitPrice: { 
    type: Number, 
    min: 0,
    default: 0
  },
  priceIncludesVAT: { 
    type: Boolean, 
    default: true 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, {
  timestamps: true
});

// Index for better performance
supplierItemSchema.index({ supplier: 1, item: 1, packaging: 1 });
supplierItemSchema.index({ item: 1 });
supplierItemSchema.index({ supplier: 1 });

module.exports = mongoose.model("SupplierItem", supplierItemSchema); 