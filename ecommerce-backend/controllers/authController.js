const User = require("../models/User");
const { sendVerificationEmail } = require("../utils/sendEmail");
const { generateToken } = require("../utils/generateToken");
const { validationResult } = require("express-validator");

const signup = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    const verificationToken = Math.random().toString(36).substring(2);
    const user = await User.create({
      name,
      email,
      password,
      verificationToken,
    });

    await sendVerificationEmail(email, verificationToken);
    res.status(201).json({ message: "User created, please verify your email" });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({ message: "Please verify your email" });
    }

    res.json({
      token: generateToken(user._id),
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        role: user.role
      },
    });
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ verificationToken: token });
    if (!user)
      return res.status(400).json({ message: "Invalid or expired token" });

    user.isEmailVerified = true;
    user.verificationToken = undefined;
    await user.save();

    // Return JSON response with updated user data instead of redirect
    res.json({ 
      message: "Email verified successfully!", 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { name, email, password } = req.body;
    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.password = password;

    await user.save();
    res.json({ message: "User updated successfully" });
  } catch (error) {
    next(error);
  }
};

const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }
    
    // Generate new verification token
    const verificationToken = Math.random().toString(36).substring(2);
    user.verificationToken = verificationToken;
    await user.save();
    
    // Send new verification email
    await sendVerificationEmail(email, verificationToken);
    
    res.json({ message: "Verification email sent successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = { signup, login, verifyEmail, updateUser, resendVerification };
