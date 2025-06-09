const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Load environment variables
dotenv.config();

// Import routes
const roleRoutes = require('./routes/roleRoutes');
const departmentRoutes = require('./routes/departmentsRoute');
const userRoutes = require('./routes/userRoute');
const galleryRoutes = require('./routes/galleryRoutes');
const unitRoutes = require('./routes/unitRoutes');
const ItemCategoryRoutes = require('./routes/ItemCategoryRoute');
const ItemRoutes = require('./routes/itemRoutes');
const RecipeExpertRoutes = require('./routes/recipeExpertRoutes');
const BranchRoutes = require('./routes/branchRoutes');
const BrandRoutes = require('./routes/brandRoute');
const CurrencyRoutes = require('./routes/currencyRoute');
const MenuItemRoutes = require('./routes/MenuItem');
const TaxRoutes = require('./routes/tax');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://your-production-domain.com' 
    : 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
// app.use(limiter);

app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Root route to check API
app.get('/', (req, res) => {
  res.json({ message: "API running successfully", status: "ok" });
});

// API routes
app.use('/api/roles', roleRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/item-categories', ItemCategoryRoutes);
app.use('/api/items', ItemRoutes); 
app.use('/api/recipe-experts', RecipeExpertRoutes); 
app.use('/api/branch', BranchRoutes); 
app.use('/api/brand', BrandRoutes); 
app.use('/api/currency', CurrencyRoutes);
app.use('/api/menu', MenuItemRoutes) 
app.use('/api/tax', TaxRoutes) 

// Start server
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
