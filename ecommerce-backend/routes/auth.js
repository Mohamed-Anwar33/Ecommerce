const express = require("express");
const {
  signup,
  login,
  verifyEmail,
  resendVerification,
  updateUser,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { check } = require("express-validator");

const router = express.Router();

router.post(
  "/signup",
  [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password must be 6 or more characters").isLength({
      min: 6,
    }),
  ],
  signup
);

router.post(
  "/login",
  [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists(),
  ],
  login
);

router.get("/verify/:token", verifyEmail);

// Resend verification email
router.post("/resend-verification", [
  check("email", "Please include a valid email").isEmail(),
], resendVerification);

router.put("/update", protect, updateUser);

module.exports = router;
