const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Production MongoDB URI
const MONGODB_URI = 'mongodb+srv://Karyanastore:Karyanastore123@cluster0.izvxlqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

console.log('Connecting to production MongoDB...');

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  isActive: Boolean
});

const User = mongoose.model('User', userSchema);

async function updateAdminPassword() {
  try {
    // Find admin user
    const admin = await User.findOne({ email: 'admin@gmail.com' });
    console.log('Current admin user:', admin ? {
      _id: admin._id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      isActive: admin.isActive
    } : 'Not found');

    if (!admin) {
      console.log('Admin user not found. Creating new admin user...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      const newAdmin = new User({
        name: 'Admin',
        email: 'admin@gmail.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true
      });
      
      await newAdmin.save();
      console.log('New admin user created successfully!');
    } else {
      console.log('Admin user found. Updating password...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      // Update all fields to ensure consistency
      admin.name = 'Admin';
      admin.password = hashedPassword;
      admin.role = 'admin';
      admin.isActive = true;
      
      await admin.save();
      console.log('Admin user updated successfully!');
      
      // Verify the password was saved correctly
      const verifyAdmin = await User.findOne({ email: 'admin@gmail.com' });
      console.log('Verification - Admin user after update:', {
        _id: verifyAdmin._id,
        email: verifyAdmin.email,
        name: verifyAdmin.name,
        role: verifyAdmin.role,
        isActive: verifyAdmin.isActive,
        hasPassword: !!verifyAdmin.password
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}

updateAdminPassword(); 