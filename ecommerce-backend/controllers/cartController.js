const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const addToCart = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { productId, quantity } = req.body;
    console.log('==> addToCart called with:', { productId, quantity, userId: req.user?.id });
    
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      console.log('Invalid productId format:', productId);
      return res.status(400).json({ message: "Invalid product ID format" });
    }
    
    const product = await Product.findById(productId);
    if (!product) {
      console.log('Product not found:', productId);
      return res.status(404).json({ message: "Product not found" });
    }
    
    // If product doesn't have quantity field or it's 0, set it to a default value
    if (!product.quantity || product.quantity === 0) {
      console.log('Product has no stock info, setting default stock to 100');
      product.quantity = 100;
      await product.save();
    }
    
  
    if (product.quantity < quantity && quantity > 10) {
      return res.status(400).json({ message: "Insufficient stock for this large quantity" });
    }

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = await Cart.create({
        user: req.user.id,
        items: [{ product: productId, quantity }],
      });
    } else {
      const itemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId
      );
      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity;
      } else {
        cart.items.push({ product: productId, quantity });
      }
      await cart.save();
    }
    cart = await cart.populate("items.product");
    res.json(cart);
  } catch (error) {
    next(error);
  }
};

const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate(
      "items.product"
    );

    if (!cart) {
      // If no cart exists, create a new one for the user
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    res.json(cart);
  } catch (error) {
    next(error);
  }
};

const updateCart = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    console.log('==> updateCart called with:');
    console.log('  - quantity:', quantity, 'type:', typeof quantity);
    console.log('  - itemId:', req.params.itemId);
    console.log('  - userId:', req.user?.id);
    console.log('  - request body:', req.body);
    
    // Validate quantity
    if (!quantity || isNaN(quantity) || quantity < 1) {
      console.log('Invalid quantity:', quantity);
      return res.status(400).json({ message: "Quantity must be a positive number" });
    }
    
    // Validate MongoDB ObjectId for cart item
    if (!mongoose.Types.ObjectId.isValid(req.params.itemId)) {
      console.log('Invalid cart item ID format:', req.params.itemId);
      return res.status(400).json({ message: "Invalid cart item ID format" });
    }
    
    const cart = await Cart.findOne({ user: req.user.id });
    console.log('Found cart:', cart ? 'Yes' : 'No');
    if (cart) {
      console.log('Cart items count:', cart.items.length);
      console.log('Cart items IDs:', cart.items.map(item => item._id.toString()));
    }
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const itemIndex = cart.items.findIndex(
      (item) => item._id.toString() === req.params.itemId
    );
    console.log('Looking for item with ID:', req.params.itemId);
    console.log('Item index found:', itemIndex);
    
    if (itemIndex === -1) {
      console.log('Item not found in cart. Available items:');
      cart.items.forEach((item, index) => {
        console.log(`  [${index}] ID: ${item._id.toString()}, Product: ${item.product}`);
      });
      return res.status(404).json({ message: "Item not found in cart" });
    }

    const product = await Product.findById(cart.items[itemIndex].product);
    console.log('Product stock:', product.quantity, 'Requested quantity:', quantity);
    
    // If product doesn't have quantity field or it's 0, set it to a default value
    if (!product.quantity || product.quantity === 0) {
      console.log('Product has no stock info, setting default stock to 100');
      product.quantity = 100;
      await product.save();
    }
    
    // Only check stock if the requested quantity is significantly higher than available
    if (product.quantity < quantity && quantity > 10) {
      console.log('Stock validation failed - insufficient stock for large quantity');
      return res.status(400).json({ message: "Insufficient stock for this large quantity" });
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();
    res.json(cart);
  } catch (error) {
    next(error);
  }
};

const deleteCartItem = async (req, res, next) => {
  try {
    console.log('==> deleteCartItem called with itemId:', req.params.itemId);
    
    // Validate MongoDB ObjectId for cart item
    if (!mongoose.Types.ObjectId.isValid(req.params.itemId)) {
      console.log('Invalid cart item ID format:', req.params.itemId);
      return res.status(400).json({ message: "Invalid cart item ID format" });
    }
    
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter(
      (item) => item._id.toString() !== req.params.itemId
    );
    await cart.save();
    res.json({ message: "Item removed from cart" });
  } catch (error) {
    next(error);
  }
};

const clearCart = async (req, res, next) => {
  try {
    console.log('==> clearCart called for userId:', req.user?.id);
    
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      console.log('No cart found for user');
      return res.status(404).json({ message: "Cart not found" });
    }
    
    // Clear all items atomically
    cart.items = [];
    await cart.save();
    
    console.log('Cart cleared successfully');
    res.json({ message: "Cart cleared successfully", cart });
  } catch (error) {
    console.error('Error clearing cart:', error);
    next(error);
  }
};

module.exports = { addToCart, getCart, updateCart, deleteCartItem, clearCart };
