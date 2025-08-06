const mongoose = require('mongoose');
const Product = require('../models/Product');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/ecommerce', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function updateAllProductsStock() {
  try {
    console.log('Updating stock for all products...');
    
    // Update all products to have a stock quantity of 100
    const result = await Product.updateMany(
      {}, // Empty filter means all products
      { 
        $set: { 
          quantity: 100 // Set stock to 100 for all products
        } 
      }
    );
    
    console.log(`Updated ${result.modifiedCount} products with new stock quantity.`);
    
    // Display all products with their new quantities
    const products = await Product.find({}).select('name quantity category');
    console.log('\nCurrent product stock levels:');
    products.forEach(product => {
      console.log(`- ${product.name}: ${product.quantity} units (${product.category})`);
    });
    
    console.log('\nStock update completed successfully!');
    
  } catch (error) {
    console.error('Error updating stock:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the update
updateAllProductsStock();
