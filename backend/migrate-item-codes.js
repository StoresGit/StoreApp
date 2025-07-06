const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database-name');
    console.log('MongoDB connected for migration');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Import the Item model (this will include the new schema with itemCode)
const Item = require('./models/Item');

// Function to generate unique item code (same as in model)
async function generateItemCode() {
  const prefix = 'ITM';
  const currentYear = new Date().getFullYear().toString().slice(-2);
  
  // Find the latest item with current year prefix
  const latestItem = await Item.findOne({
    itemCode: { $regex: `^${prefix}${currentYear}` }
  }).sort({ itemCode: -1 });
  
  let nextNumber = 1;
  if (latestItem && latestItem.itemCode) {
    const numberPart = latestItem.itemCode.substring(5);
    nextNumber = parseInt(numberPart) + 1;
  }
  
  const paddedNumber = nextNumber.toString().padStart(4, '0');
  return `${prefix}${currentYear}${paddedNumber}`;
}

// Migration function
async function migrateItemCodes() {
  try {
    console.log('Starting item code migration...');
    
    // Find all items without item codes
    const itemsWithoutCodes = await Item.find({ 
      $or: [
        { itemCode: { $exists: false } },
        { itemCode: null },
        { itemCode: '' }
      ]
    });
    
    console.log(`Found ${itemsWithoutCodes.length} items without item codes`);
    
    if (itemsWithoutCodes.length === 0) {
      console.log('No items need migration. All items already have item codes.');
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const item of itemsWithoutCodes) {
      try {
        // Generate a unique item code
        let itemCode = await generateItemCode();
        
        // Check if this code already exists (safety check)
        let existingItem = await Item.findOne({ itemCode });
        let attempts = 0;
        
        while (existingItem && attempts < 10) {
          itemCode = await generateItemCode();
          existingItem = await Item.findOne({ itemCode });
          attempts++;
        }
        
        if (attempts >= 10) {
          console.error(`Failed to generate unique code for item ${item._id} after 10 attempts`);
          errorCount++;
          continue;
        }
        
        // Update the item with the new code
        await Item.findByIdAndUpdate(item._id, { itemCode });
        
        console.log(`✓ Updated item "${item.nameEn || item.name}" with code: ${itemCode}`);
        successCount++;
        
        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 10));
        
      } catch (error) {
        console.error(`✗ Error updating item ${item._id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\nMigration completed!');
    console.log(`✓ Successfully updated: ${successCount} items`);
    console.log(`✗ Errors: ${errorCount} items`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration
async function runMigration() {
  await connectDB();
  await migrateItemCodes();
  await mongoose.connection.close();
  console.log('Database connection closed');
  process.exit(0);
}

// Execute if run directly
if (require.main === module) {
  runMigration().catch(error => {
    console.error('Migration script error:', error);
    process.exit(1);
  });
}

module.exports = { migrateItemCodes }; 