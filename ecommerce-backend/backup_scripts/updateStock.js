const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function updateAllProductsStock() {
  try {
    console.log('Updating stock for all products...');
    
    const result = await Product.updateMany(
      {}, 
      { 
        $set: { 
          quantity: 100 
        } 
      }
    );
    
    console.log(`Updated ${result.modifiedCount} products with new stock quantity.`);
    
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

updateAllProductsStock();
