const express = require("express");
const {
  addToCart,
  getCart,
  updateCart,
  deleteCartItem,
  clearCart,
} = require("../controllers/cartController");
const { protect } = require("../middleware/authMiddleware");
const { check } = require("express-validator");

const router = express.Router();

router
  .route("/")
  .post(
    protect,
    [
      check("productId", "Product ID is required").not().isEmpty()
        .isMongoId().withMessage("Product ID must be a valid MongoDB ObjectId"),
      check("quantity", "Quantity must be a number").isNumeric()
        .isInt({ min: 1 }).withMessage("Quantity must be a positive integer"),
    ],
    addToCart
  )
  .get(protect, getCart);

// Clear entire cart - MUST be before /:itemId route
router.route("/clear")
  .delete(protect, clearCart);

router
  .route("/:itemId")
  .put(
    protect,
    [
      check("quantity", "Quantity must be a number")
        .isNumeric().withMessage("Quantity must be a number")
        .isInt({ min: 1 }).withMessage("Quantity must be a positive integer"),
    ],
    updateCart
  )
  .delete(protect, deleteCartItem);

module.exports = router;
