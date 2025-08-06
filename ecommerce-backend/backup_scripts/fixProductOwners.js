const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/User');
require('dotenv').config();

async function fixProductOwners() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find all products without owner
    const productsWithoutOwner = await Product.find({ 
      $or: [
        { owner: { $exists: false } },
        { owner: null },
        { owner: undefined }
      ]
    });

    console.log(`Found ${productsWithoutOwner.length} products without owner`);

    if (productsWithoutOwner.length === 0) {
      console.log('All products already have owners');
      process.exit(0);
    }

    // Find the admin user to assign as default owner
    let adminUser = await User.findOne({ isAdmin: true });
    
    if (!adminUser) {
      console.log('No admin user found. Looking for any user...');
      adminUser = await User.findOne({});
      
      if (!adminUser) {
        console.log('No users found at all. Creating default admin user...');
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        adminUser = new User({
          name: 'Default Admin',
          email: 'admin@ecommerce.com',
          password: hashedPassword,
          isAdmin: true,
          emailVerified: true
        });
        
        await adminUser.save();
        console.log('Created default admin user:', adminUser.email);
      } else {
        console.log('Using existing user as owner:', adminUser.email);
      }
    }

    console.log(`Using admin user ${adminUser.email} as default owner`);

    // Update all products without owner
    const updateResult = await Product.updateMany(
      { 
        $or: [
          { owner: { $exists: false } },
          { owner: null },
          { owner: undefined }
        ]
      },
      { owner: adminUser._id }
    );

    console.log(`Updated ${updateResult.modifiedCount} products`);
    console.log('All products now have owners!');

    // Verify the fix
    const remainingProductsWithoutOwner = await Product.find({ 
      $or: [
        { owner: { $exists: false } },
        { owner: null },
        { owner: undefined }
      ]
    });

    console.log(`Remaining products without owner: ${remainingProductsWithoutOwner.length}`);

    process.exit(0);
  } catch (error) {
    console.error('Error fixing product owners:', error);
    process.exit(1);
  }
}

fixProductOwners();
