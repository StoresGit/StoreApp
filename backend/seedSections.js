const mongoose = require('mongoose');
const Section = require('./models/Section');
require('dotenv').config();

const defaultSections = [
  {
    name: 'Main Kitchen',
    code: 'MAIN',
    description: 'Primary kitchen area for main course preparation',
    isActive: true
  },
  {
    name: 'Bakery',
    code: 'BAKERY',
    description: 'Bakery section for breads, pastries, and desserts',
    isActive: true
  },
  {
    name: 'Pantry',
    code: 'PANTRY',
    description: 'Dry goods and non-perishable items storage',
    isActive: true
  },
  {
    name: 'Cold Storage',
    code: 'COLD',
    description: 'Refrigerated storage for perishable items',
    isActive: true
  },
  {
    name: 'Freezer',
    code: 'FREEZER',
    description: 'Frozen food storage and preparation area',
    isActive: true
  },
  {
    name: 'Salad Station',
    code: 'SALAD',
    description: 'Fresh salads and cold appetizers preparation',
    isActive: true
  },
  {
    name: 'Grill Station',
    code: 'GRILL',
    description: 'Grilled items and BBQ preparation',
    isActive: true
  },
  {
    name: 'Dessert Station',
    code: 'DESSERT',
    description: 'Desserts and sweet items preparation',
    isActive: true
  }
];

async function seedSections() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');

    // Clear existing sections
    await Section.deleteMany({});
    console.log('Cleared existing sections');

    // Insert default sections
    const sections = await Section.insertMany(defaultSections);
    console.log(`Successfully seeded ${sections.length} sections:`);
    
    sections.forEach(section => {
      console.log(`- ${section.name} (${section.code})`);
    });

    console.log('Section seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding sections:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seed function
seedSections(); 