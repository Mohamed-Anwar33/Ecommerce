const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config();

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@ecommerce.com' });
    if (existingAdmin) {
      console.log('Admin already exists!');
      console.log('Email: admin@ecommerce.com');
      console.log('Password: admin123');
      process.exit(0);
    }

    // Create new admin
    const admin = new Admin({
      email: 'admin@ecommerce.com',
      password: 'admin123' // This will be hashed automatically by the pre-save middleware
    });

    await admin.save();
    console.log('✅ Admin created successfully!');
    console.log('📧 Email: admin@ecommerce.com');
    console.log('🔒 Password: admin123');
    console.log('');
    console.log('You can now login to the admin dashboard with these credentials.');
    
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
  } finally {
    mongoose.connection.close();
  }
};

createAdmin();
