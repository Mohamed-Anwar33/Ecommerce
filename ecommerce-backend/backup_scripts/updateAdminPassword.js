const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config();

const updateAdminPassword = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find the admin
    const admin = await Admin.findOne({ email: 'eisam2350@gmail.com' });
    if (!admin) {
      console.log('❌ Admin not found with email: eisam2350@gmail.com');
      process.exit(1);
    }

    console.log('👤 Admin found:', admin.email);
    console.log('🔐 Current password hash:', admin.password);

    // Set new password - this will be automatically hashed by the pre-save middleware
    const newPassword = 'mohamed 123'; // Your desired password
    admin.password = newPassword;
    
    // Save - the pre-save middleware will hash the password automatically
    await admin.save();

    console.log('✅ Admin password updated successfully!');
    console.log('📧 Email: eisam2350@gmail.com');
    console.log('🔒 New Password: mohamed 123');
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
