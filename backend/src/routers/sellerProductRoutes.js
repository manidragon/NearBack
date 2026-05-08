// ✅ backend/src/routers/sellerProductRoutes.js
const express = require("express");
const productController = require("../controllers/productController");
const sellerAuthMiddleware = require("../middlewares/sellerAuthMiddleware");
const router = express.Router();

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

// ✅ GET /api/seller/products/catalog-offers
router.get('/catalog-offers', sellerAuthMiddleware, productController.getSellerCatalogOffers);

module.exports = router;