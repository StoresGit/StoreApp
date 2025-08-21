const mongoose = require('mongoose');
const Item = require('./models/Item');
const ItemCategory = require('./models/ItemCategory');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your_database_name', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function fixSubcategoryNames() {
  try {
    console.log('Starting subcategory name fix...');
    
    // Get all items
    const items = await Item.find().populate('subCategory', 'nameEn name');
    
    console.log(`Found ${items.length} items`);
    
    let fixedCount = 0;
    
    for (const item of items) {
      console.log(`\nItem: ${item.nameEn || item.name}`);
      console.log(`SubCategory ID: ${item.subCategory?._id}`);
      console.log(`SubCategory Name: ${item.subCategory?.nameEn || item.subCategory?.name || 'NO NAME'}`);
      
      // If subcategory has no name, try to find it in categories
      if (item.subCategory && (!item.subCategory.nameEn && !item.subCategory.name)) {
        console.log('Subcategory has no name, checking if it exists in categories...');
        
        // Check if this subcategory ID exists in categories
        const category = await ItemCategory.findById(item.subCategory._id);
        if (category) {
          console.log(`Found category: ${category.nameEn || category.name}`);
          // Update the subcategory with the category name
          item.subCategory.nameEn = category.nameEn;
          item.subCategory.name = category.name;
          await item.save();
          fixedCount++;
          console.log('Fixed subcategory name');
        } else {
          console.log('Category not found, this might be a real subcategory');
        }
      }
    }
    
    console.log(`\nFixed ${fixedCount} subcategory names`);
    
  } catch (error) {
    console.error('Error fixing subcategory names:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixSubcategoryNames();
