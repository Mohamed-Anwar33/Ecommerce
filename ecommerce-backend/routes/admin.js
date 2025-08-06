const express = require("express");
const {
  adminLogin,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/adminController");
const { protect, admin } = require("../middleware/authMiddleware");
const { check } = require("express-validator");

const router = express.Router();

router.post(
  "/login",
  [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists(),
  ],
  adminLogin
);

router
  .route("/users")
  .get(protect, admin, getUsers)
  .post(protect, admin, createUser);
router
  .route("/users/:id")
  .put(protect, admin, updateUser)
  .delete(protect, admin, deleteUser);

module.exports = router;
