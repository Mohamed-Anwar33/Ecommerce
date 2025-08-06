const express = require("express");
const {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct,
  getUserProducts,
  adminGetAllProducts,
  adminUpdateProduct,
  adminDeleteProduct,
} = require("../controllers/productController");
const { protect, admin } = require("../middleware/authMiddleware");
const upload = require("../middleware/multer");

const router = express.Router();

// User routes
router.route('/my-products').get(protect, getUserProducts);

// Admin routes - full control over all products
router.route('/admin/all').get(protect, admin, adminGetAllProducts);
router.route('/admin/:id')
  .put(protect, admin, upload.single("image"), adminUpdateProduct)
  .delete(protect, admin, adminDeleteProduct);

// General routes
router
  .route("/")
  .post(protect, upload.single("image"), createProduct)
  .get(getProducts);

router
  .route("/:id")
  .put(protect, upload.single("image"), updateProduct)
  .delete(protect, deleteProduct);

module.exports = router;
