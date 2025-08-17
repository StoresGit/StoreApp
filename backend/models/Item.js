const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  nameEn: { type: String },
  nameAlt: { type: String },
  itemCode: { 
    type: String, 
    unique: true, 
    sparse: true, // Allows null values to not conflict with unique constraint
    index: true
  },
  baseUnit: { type: mongoose.Schema.Types.ObjectId, ref: "Unit", required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "ItemCategory", required: true },
  tax: { type: mongoose.Schema.Types.ObjectId, ref: "Tax" },
  assignBranch: [{ type: mongoose.Schema.Types.ObjectId, ref: "Branch" }],
  assignBrand: { type: mongoose.Schema.Types.ObjectId, ref: "Brand" },
  image: { type: mongoose.Schema.Types.ObjectId, ref: "Image" },
  departments: [{ type: mongoose.Schema.Types.ObjectId, ref: "departments" }],
  unit: { type: mongoose.Schema.Types.ObjectId, ref: "Unit", required: true },
  name: { type: String, required: true },
  subCategory: { type: mongoose.Schema.Types.ObjectId, ref: "ItemCategory", required: true }, // Sub Category - changed from SubCategory to ItemCategory
  
  // Pricing fields
  unitPrice: { 
    type: Number, 
    min: 0,
    default: 0
  },
  priceIncludesVAT: { 
    type: Boolean, 
    default: true 
  },
  
  basePackaging: {
    amount: Number,
    unit: String,
    createdAt: Date
  },
  packPackaging: {
    amount: Number,
    unit: String,
    packSize: Number,
    packUnit: String,
    createdAt: Date
  }
}, {
  timestamps: true
});

// Function to generate unique item code
async function generateItemCode() {
  const prefix = 'ITM';
  const currentYear = new Date().getFullYear().toString().slice(-2); // Last 2 digits of year
  
  // Find the latest item with current year prefix
  const latestItem = await mongoose.model("Item").findOne({
    itemCode: { $regex: `^${prefix}${currentYear}` }
  }).sort({ itemCode: -1 });
  
  let nextNumber = 1;
  if (latestItem && latestItem.itemCode) {
    // Extract the number part and increment
    const numberPart = latestItem.itemCode.substring(5); // Remove "ITM" + "YY" prefix
    nextNumber = parseInt(numberPart) + 1;
  }
  
  // Pad with zeros to make it 4 digits
  const paddedNumber = nextNumber.toString().padStart(4, '0');
  
  return `${prefix}${currentYear}${paddedNumber}`;
}

// Pre-save hook to generate item code
itemSchema.pre('save', async function(next) {
  // Generate item code for new items or existing items without one
  if (!this.itemCode) {
    try {
      let attempts = 0;
      const maxAttempts = 5;
      
      while (attempts < maxAttempts) {
        try {
          this.itemCode = await generateItemCode();
          break;
        } catch (error) {
          if (error.code === 11000) { // Duplicate key error
            attempts++;
            if (attempts >= maxAttempts) {
              return next(new Error('Failed to generate unique item code after multiple attempts'));
            }
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 100));
          } else {
            return next(error);
          }
        }
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model("Item", itemSchema);
