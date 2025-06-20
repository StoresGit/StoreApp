const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  nameEn: { type: String },
  nameAlt: { type: String },
  baseUnit: { type: mongoose.Schema.Types.ObjectId, ref: "Unit", required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "ItemCategory", required: true },
  tax: { type: mongoose.Schema.Types.ObjectId, ref: "Tax" },
  assignBranch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
  assignBrand: { type: mongoose.Schema.Types.ObjectId, ref: "Brand" },
  image: { type: mongoose.Schema.Types.ObjectId, ref: "Image" },
  departments: [{ type: mongoose.Schema.Types.ObjectId, ref: "departments" }],
  unit: { type: mongoose.Schema.Types.ObjectId, ref: "Unit", required: true },
  name: { type: String, required: true },
  unitCount: { type: Number }, // Number of units
}, {
  timestamps: true
});

module.exports = mongoose.model("Item", itemSchema);
