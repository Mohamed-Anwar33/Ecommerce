const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config();

const resetAdminPassword = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find the admin
    const admin = await Admin.findOne({ email: 'eisam2350@gmail.com' });
    if (!admin) {
      console.log('❌ Admin not found with email: eisam2350@gmail.com');
      process.exit(1);
    }

    console.log('👤 Admin found:', admin.email);

    // Set new password
    const newPassword = 'admin123';
    admin.password = newPassword; // This will be hashed automatically by the pre-save middleware
    await admin.save();

    console.log('✅ Admin password updated successfully!');
    console.log('📧 Email: eisam2350@gmail.com');
    console.log('🔒 New Password: admin123');
    console.log('');
    console.log('You can now login to the admin dashboard with these credentials.');
    
  } catch (error) {
    console.error('❌ Error updating admin password:', error.message);
  } finally {
    mongoose.connection.close();
  }
};

resetAdminPassword();
