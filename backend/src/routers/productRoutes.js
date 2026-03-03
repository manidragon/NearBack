// D:\Mani\Code with Zosh\Backup\source code\backend\src\routers\productRoutes.js
const express = require('express');
const productController = require('../controllers/productController');
const router = express.Router();

// 🔍 Debug logs (keep for now, remove later)
console.log('🔍 productController type:', typeof productController);
console.log('🔍 productController keys:', Object.keys(productController));

// ✅ FIX: Use correct method names that exist in controller

// Search for products by query
// ✅ Changed: searchProduct → searchProducts (add 's')
router.get('/search', productController.searchProducts);

// Get all products with filters
// ✅ Option 1: Use searchProducts with empty filters (recommended)
router.get('/', (req, res, next) => {
  // Delegate to searchProducts with no search query
  req.query = { ...req.query, page: req.query.page || 0, limit: req.query.limit || 20 };
  productController.searchProducts(req, res, next).catch(next);
});

// Get product by ID
// ✅ This was already correct
router.get('/:productId', productController.getProductById);

module.exports = router;