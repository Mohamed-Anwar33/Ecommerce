const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const updateUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Update all users to have role field if missing
    const result = await User.updateMany(
      { role: { $exists: false } }, // Find users without role field
      { $set: { role: 'user' } }     // Set default role to 'user'
    );

    console.log(`Updated ${result.modifiedCount} users with role field`);

    // Also ensure all users have isEmailVerified field
    const result2 = await User.updateMany(
      { isEmailVerified: { $exists: false } },
      { $set: { isEmailVerified: false } }
    );

    console.log(`Updated ${result2.modifiedCount} users with isEmailVerified field`);

    // List all users to verify
    const users = await User.find({}, 'name email isEmailVerified role');
    console.log('\nAll users:');
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}): verified=${user.isEmailVerified}, role=${user.role}`);
    });

    mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error updating users:', error);
    process.exit(1);
  }
};

updateUsers();
