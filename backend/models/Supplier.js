const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema({
  // Basic Supplier Information (required for all suppliers)
  legalName: { type: String, required: true, trim: true }, // Legal Name - required
  shortName: { type: String, trim: true }, // Short Name - optional
  taxRegistrationNo: { type: String, trim: true }, // Tax Registration No - optional
  googleLocation: { type: String, trim: true }, // Google Location - optional
  repName: { type: String, trim: true }, // Rep. Name - optional
  mobileCall: { type: String, trim: true }, // Mobile No - Call - optional
  mobileWhatsapp: { type: String, trim: true }, // Mobile No - Whatsapp - optional
  image: { type: mongoose.Schema.Types.ObjectId, ref: "Image" }, // Image - optional
  assignBranch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" }, // Assign Branch - optional
  
  // Supplier status
  isActive: { type: Boolean, default: true }, // Whether supplier is active
}, {
  timestamps: true
});

// Index for better performance
supplierSchema.index({ legalName: 1 });
supplierSchema.index({ shortName: 1 });
supplierSchema.index({ isActive: 1 });

// Virtual to get supplier type (always standalone now)
supplierSchema.virtual('supplierType').get(function() {
  return 'standalone';
});

// Method to get supplier display name
supplierSchema.methods.getDisplayName = function() {
  return this.shortName || this.legalName;
};

module.exports = mongoose.model("Supplier", supplierSchema); 