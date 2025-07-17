const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const PurchaseCategory = require('./models/PurchaseCategory');
const BranchCategory = require('./models/BranchCategory');

// Sample data for Purchase Categories
const purchaseCategories = [
  { nameEn: 'Raw Materials', nameUr: 'خام مال' },
  { nameEn: 'Packaging Materials', nameUr: 'پیکنگ مواد' },
  { nameEn: 'Spices & Seasonings', nameUr: 'مصالحے اور مسالے' },
  { nameEn: 'Dairy Products', nameUr: 'دودھ کی مصنوعات' },
  { nameEn: 'Meat & Poultry', nameUr: 'گوشت اور مرغی' },
  { nameEn: 'Vegetables', nameUr: 'سبزیاں' },
  { nameEn: 'Fruits', nameUr: 'پھل' },
  { nameEn: 'Grains & Cereals', nameUr: 'اناج اور غلے' },
  { nameEn: 'Oils & Fats', nameUr: 'تیل اور چربی' },
  { nameEn: 'Beverages', nameUr: 'مشروبات' }
];

// Sample data for Branch Categories
const branchCategories = [
  { nameEn: 'Main Kitchen', nameUr: 'مین کچن' },
  { nameEn: 'Bakery', nameUr: 'بیکری' },
  { nameEn: 'Cold Kitchen', nameUr: 'کولڈ کچن' },
  { nameEn: 'Hot Kitchen', nameUr: 'ہاٹ کچن' },
  { nameEn: 'Dessert Station', nameUr: 'ڈیزرٹ سٹیشن' },
  { nameEn: 'Beverage Station', nameUr: 'بیوریج سٹیشن' },
  { nameEn: 'Salad Station', nameUr: 'سلاد سٹیشن' },
  { nameEn: 'Grill Station', nameUr: 'گرل سٹیشن' },
  { nameEn: 'Fry Station', nameUr: 'فرائی سٹیشن' },
  { nameEn: 'Prep Station', nameUr: 'پریپ سٹیشن' }
];

const seedCategories = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Clear existing data
    await PurchaseCategory.deleteMany({});
    await BranchCategory.deleteMany({});
    console.log('Cleared existing category data');

    // Insert purchase categories
    const insertedPurchaseCategories = await PurchaseCategory.insertMany(purchaseCategories);
    console.log(`Inserted ${insertedPurchaseCategories.length} purchase categories`);

    // Insert branch categories
    const insertedBranchCategories = await BranchCategory.insertMany(branchCategories);
    console.log(`Inserted ${insertedBranchCategories.length} branch categories`);

    console.log('Category seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
};

// Run the seed function
seedCategories(); 