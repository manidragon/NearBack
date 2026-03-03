// ✅ backend/src/routers/sellerProductRoutes.js
const express = require("express");
const productController = require("../controllers/productController");
const sellerAuthMiddleware = require("../middlewares/sellerAuthMiddleware");
const router = express.Router();

// 🔍 Debug: Verify method exists before using
console.log('🔍 [SELLER ROUTES] Checking getProductBySellerId vs getSellerProducts:');
console.log('  - productController.getSellerProducts:', typeof productController.getSellerProducts);
console.log('  - productController.getProductBySellerId:', typeof productController.getProductBySellerId);

// ✅ FIX: Changed getProductBySellerId → getSellerProducts (matches controller)
router.get(
  "/",
  sellerAuthMiddleware,
  productController.getSellerProducts  // ✅ CORRECT method name
);

router.post(
  "/",
  sellerAuthMiddleware,
  productController.createProduct  // ✅ Already correct
);

router.delete(
  "/:productId",
  sellerAuthMiddleware,
  productController.deleteProduct  // ✅ Already correct
);

// Update a product
router.put(
  "/:productId",
  sellerAuthMiddleware,
  productController.updateProduct  // ✅ Already correct
);

console.log('✅ [SELLER ROUTES] All routes registered successfully');

module.exports = router;