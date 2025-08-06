const Product = require("../models/Product");
const { validationResult } = require("express-validator");
const cloudinary = require("../config/cloudinary");

const createProduct = async (req, res, next) => {
  try {
    console.log('createProduct called');
    console.log('req.user:', req.user);
    console.log('req.body:', req.body);
    console.log('req.file:', req.file);

    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { name, description, price, quantity, category } = req.body;

    let imageUrl = "";
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ resource_type: "image" }, (error, result) => {
            if (error) {
              console.error("Cloudinary Upload Error:", error);
              return reject(error);
            }
            resolve(result);
          })
          .end(req.file.buffer);
      });
      imageUrl = result.secure_url;
    }

    const product = await Product.create({
      name,
      description,
      price,
      quantity,
      category,
      image: imageUrl || undefined,
      owner: req.user && req.user.id ? req.user.id : undefined, // Defensive
    });

    res.status(201).json(product);
  } catch (error) {
    console.error("Create Product Error:", error.stack || error);
    res.status(500).json({ message: "Internal Server Error", error: error.message, stack: error.stack });
  }
};

const getProducts = async (req, res, next) => {
  try {
    const products = await Product.find({});
    // Transform products to include ownerId for frontend compatibility
    const transformedProducts = products.map(product => ({
      ...product.toObject(),
      id: product._id.toString(),
      ownerId: product.owner ? product.owner.toString() : null
    }));
    res.json(transformedProducts);
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    console.log('==> updateProduct called, user:', req.user, 'productId:', req.params.id);
    
    // Try to find product by ObjectId first, then by custom id field
    let product;
    try {
      // Try finding by MongoDB ObjectId
      product = await Product.findById(req.params.id);
    } catch (error) {
      // If ObjectId cast fails, try finding by custom id field
      console.log('ObjectId cast failed, trying custom id field');
      product = await Product.findOne({ id: req.params.id });
    }
    
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Debug log
    console.log('Product owner:', product.owner.toString(), 'Req user id:', req.user.id);
    if (product.owner.toString() !== String(req.user.id) && !req.user.isAdmin) {
      return res.status(403).json({ message: "You are not authorized to update this product" });
    }

    const { name, description, price, quantity, category } = req.body;

    let imageUrl = product.image;
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ resource_type: "image" }, (error, result) => {
            if (error) {
              console.error("Cloudinary Upload Error:", error);
              return reject(error);
            }
            resolve(result);
          })
          .end(req.file.buffer);
      });
      imageUrl = result.secure_url;
    }

    if (name) product.name = name;
    if (description) product.description = description;
    if (price) product.price = price;
    if (quantity) product.quantity = quantity;
    if (category) product.category = category;
    if (imageUrl) product.image = imageUrl;

    await product.save();
    res.json({ message: "Product updated successfully", product });
  } catch (error) {
    console.error("Update Product Error:", error);
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    console.log('==> deleteProduct called, user:', req.user, 'productId:', req.params.id);
    
    let product;
    try {
      product = await Product.findById(req.params.id);
    } catch (error) {
      console.log('ObjectId cast failed, trying custom id field');
      product = await Product.findOne({ id: req.params.id });
    }
    if (!product) return res.status(404).json({ message: "Product not found" });

    console.log('Product owner:', product.owner.toString(), 'Req user id:', req.user.id);
    if (product.owner.toString() !== String(req.user.id) && !req.user.isAdmin) {
      return res.status(403).json({ message: "You are not authorized to delete this product" });
    }

    await Product.findByIdAndDelete(product._id);
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const getUserProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ owner: req.user.id });
    const transformedProducts = products.map(product => ({
      ...product.toObject(),
      id: product._id.toString(),
      ownerId: product.owner ? product.owner.toString() : null
    }));
    res.json(transformedProducts);
  } catch (error) {
    next(error);
  }
};

const adminGetAllProducts = async (req, res, next) => {
  try {
    const products = await Product.find({}).populate('owner', 'name email');
    const transformedProducts = products.map(product => ({
      ...product.toObject(),
      id: product._id.toString(),
      ownerId: product.owner ? product.owner._id.toString() : null,
      ownerName: product.owner ? product.owner.name : 'Unknown',
      ownerEmail: product.owner ? product.owner.email : 'Unknown'
    }));
    res.json(transformedProducts);
  } catch (error) {
    next(error);
  }
};

const adminUpdateProduct = async (req, res, next) => {
  try {
    console.log('==> adminUpdateProduct called, admin:', req.user, 'productId:', req.params.id);
    
    const { name, description, price, quantity, category } = req.body;
    console.log('Update data received:', { name, description, price, quantity, category });

    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (price) updateData.price = price;
    if (quantity) updateData.quantity = quantity;
    if (category) updateData.category = category;
    
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ resource_type: "image" }, (error, result) => {
            if (error) {
              console.error("Cloudinary Upload Error:", error);
              return reject(error);
            }
            resolve(result);
          })
          .end(req.file.buffer);
      });
      updateData.image = result.secure_url;
    }

    console.log('Updating product with data:', updateData);

    // Use findByIdAndUpdate to update the product directly
    // Admin can update any product, so we bypass owner validation
    let updatedProduct;
    try {
      updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        updateData,
        { 
          new: true, // Return updated document
          runValidators: false // Skip validation to avoid owner field issues
        }
      );
    } catch (error) {
      // Try with legacy id field if ObjectId fails
      updatedProduct = await Product.findOneAndUpdate(
        { id: req.params.id },
        updateData,
        { 
          new: true,
          runValidators: false
        }
      );
    }

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    console.log('Product updated successfully:', updatedProduct._id);
    res.json({ message: "Product updated successfully by admin", product: updatedProduct });
  } catch (error) {
    console.error("Admin Update Product Error:", error);
    next(error);
  }
};

const adminDeleteProduct = async (req, res, next) => {
  try {
    console.log('==> adminDeleteProduct called, admin:', req.user, 'productId:', req.params.id);
    
    // Admin can delete any product
    let product;
    try {
      product = await Product.findById(req.params.id);
    } catch (error) {
      product = await Product.findOne({ id: req.params.id });
    }
    
    if (!product) return res.status(404).json({ message: "Product not found" });

    await Product.findByIdAndDelete(product._id);
    res.json({ message: "Product deleted successfully by admin" });
  } catch (error) {
    console.error("Admin Delete Product Error:", error);
    next(error);
  }
};

module.exports = {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct,
  getUserProducts,
  adminGetAllProducts,
  adminUpdateProduct,
  adminDeleteProduct,
};
