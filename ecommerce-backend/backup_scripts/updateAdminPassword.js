const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config();

const updateAdminPassword = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get admin credentials from environment variables
    const adminEmail = process.env.ADMIN_EMAIL;
    const newPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !newPassword) {
      console.log('❌ Admin credentials not provided in environment variables');
      console.log('Please set ADMIN_EMAIL and ADMIN_PASSWORD in your .env file');
      process.exit(1);
    }

    // Find the admin
    const admin = await Admin.findOne({ email: adminEmail });
    if (!admin) {
      console.log(`❌ Admin not found with email: ${adminEmail}`);
      process.exit(1);
    }

    console.log('👤 Admin found:', admin.email);
    console.log('🔐 Current password hash:', admin.password);

    // Set new password - this will be automatically hashed by the pre-save middleware
    admin.password = newPassword;
    
    // Save - the pre-save middleware will hash the password automatically
    await admin.save();

    console.log('✅ Admin password updated successfully!');
    console.log(`📧 Email: ${adminEmail}`);
    console.log('🔒 New Password: [HIDDEN FOR SECURITY]');
    console.log('');
    console.log('🎉 You can now login to the admin dashboard!');
    
  } catch (error) {
    console.error('❌ Error updating admin password:', error.message);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the script
updateAdminPassword();
