const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected for migration'))
.catch(err => console.error('MongoDB connection error:', err));

// Import the ItemCategory model
const ItemCategory = require('./models/ItemCategory');

async function migrateItemCategories() {
  try {
    console.log('Starting ItemCategory migration...');
    
    // Find all existing categories
    const categories = await ItemCategory.find({});
    console.log(`Found ${categories.length} existing categories`);
    
    // Update each category to include the new fields
    for (const category of categories) {
      const updateData = {
        parentId: category.parentId || null,
        isSubCategory: category.isSubCategory || false,
        level: category.level || 0
      };
      
      // If the category name contains a dash, it might be a sub-category
      if (category.nameEn && category.nameEn.includes(' - ')) {
        updateData.isSubCategory = true;
        updateData.level = 1;
        // Extract the parent name (everything before the dash)
        const parentName = category.nameEn.split(' - ')[0];
        console.log(`Category "${category.nameEn}" appears to be a sub-category of "${parentName}"`);
      }
      
      await ItemCategory.findByIdAndUpdate(category._id, updateData, { new: true });
      console.log(`Updated category: ${category.nameEn || category.name}`);
    }
    
    console.log('Migration completed successfully!');
    
    // Display the results
    const updatedCategories = await ItemCategory.find({});
    console.log('\nUpdated categories:');
    updatedCategories.forEach(cat => {
      console.log(`- ${cat.nameEn || cat.name} (Level: ${cat.level}, SubCategory: ${cat.isSubCategory})`);
    });
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the migration
migrateItemCategories(); 