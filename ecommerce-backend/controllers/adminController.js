const Admin = require("../models/Admin");
const User = require("../models/User");
const { generateToken } = require("../utils/generateToken");
const { validationResult } = require("express-validator");

const adminLogin = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin || !(await admin.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      token: generateToken(admin._id, true),
      admin: { id: admin._id, email: admin.email },
    });
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password'); // Exclude password from response
    // Transform users to include additional info for admin dashboard
    const transformedUsers = users.map(user => ({
      ...user.toObject(),
      id: user._id.toString(),
      createdAt: user.createdAt || new Date(),
      status: user.isEmailVerified ? 'Active' : 'Pending Verification'
    }));
    res.json(transformedUsers);
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { name, email, password, isEmailVerified = true } = req.body;
    
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }
    
    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    const user = await User.create({
      name,
      email,
      password,
      isEmailVerified, // Admin can set verification status
    });
    
    // Return user without password
    const userResponse = {
      ...user.toObject(),
      id: user._id.toString(),
      status: user.isEmailVerified ? 'Active' : 'Pending Verification'
    };
    delete userResponse.password;
    
    res.status(201).json({ message: "User created successfully", user: userResponse });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { name, email, password, isEmailVerified } = req.body;
    
    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email, _id: { $ne: req.params.id } });
      if (emailExists) {
        return res.status(400).json({ message: "Email already exists" });
      }
      user.email = email;
    }
    
    if (name) user.name = name;
    if (password) user.password = password;
    if (typeof isEmailVerified === 'boolean') user.isEmailVerified = isEmailVerified;

    await user.save();
    
    // Return updated user without password
    const userResponse = {
      ...user.toObject(),
      id: user._id.toString(),
      status: user.isEmailVerified ? 'Active' : 'Pending Verification'
    };
    delete userResponse.password;
    
    res.json({ message: "User updated successfully", user: userResponse });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    // Also delete user's products when deleting user
    const Product = require('../models/Product');
    await Product.deleteMany({ owner: req.params.id });
    
    // Delete the user
    await User.findByIdAndDelete(req.params.id);
    
    res.json({ 
      message: "User deleted successfully", 
      deletedUser: {
        id: user._id.toString(),
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { adminLogin, getUsers, createUser, updateUser, deleteUser };
