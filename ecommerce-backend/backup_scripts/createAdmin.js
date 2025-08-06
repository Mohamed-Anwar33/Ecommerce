const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config();

const createAdmin = async () => {
  try {
    
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.error('❌ Admin credentials not provided in environment variables');
      console.log('Please set ADMIN_EMAIL and ADMIN_PASSWORD in your .env file');
      process.exit(1);
    }

    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    
    const existingAdmin = await Admin.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('Admin already exists!');
      console.log(`Email: ${adminEmail}`);
      process.exit(0);
    }

    
    const admin = new Admin({
      email: adminEmail,
      password: adminPassword 
    });

    await admin.save();
    console.log('✅ Admin created successfully!');
    console.log(`📧 Email: ${adminEmail}`);
    console.log('🔒 Password: [HIDDEN FOR SECURITY]');
    console.log('');
    console.log('You can now login to the admin dashboard with these credentials.');
    
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
  } finally {
    mongoose.connection.close();
  }
};

createAdmin();
