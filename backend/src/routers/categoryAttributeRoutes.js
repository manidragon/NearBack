// D:\Mani\Code with Zosh\Backup\source code\backend\src\routers\categoryAttributeRoutes.js
const express = require('express');
const router = express.Router();

// ✅ Import controller instance
const categoryAttributeController = require('../controllers/CategoryAttributeController');

// ✅ REMOVED: No adminAuth middleware - routes are now public
// const { adminAuth } = require('../middlewares/adminAuthMiddleware');

// ✅ GET /api/admin/categories/:categoryId/attributes
// Get all attributes for a specific category (Level 3) - PUBLIC
router.get(
  '/:categoryId/attributes',
  categoryAttributeController.getAttributesByCategory
);

// ✅ POST /api/admin/categories/attributes/bulk
// Get attributes for multiple categories at once (admin dashboard) - PUBLIC
router.post(
  '/attributes/bulk',
  categoryAttributeController.getAttributesForMultipleCategories
);

// ✅ POST /api/admin/categories/:categoryId/attributes
// Create a new attribute for a category - PUBLIC
router.post(
  '/:categoryId/attributes',
  categoryAttributeController.createAttribute
);

// ✅ PUT /api/admin/categories/attributes/:id
// Update an existing attribute - PUBLIC
router.put(
  '/attributes/:id',
  categoryAttributeController.updateAttribute
);

// ✅ DELETE /api/admin/categories/attributes/:id
// Soft delete an attribute (set isActive = false) - PUBLIC
router.delete(
  '/attributes/:id',
  categoryAttributeController.deleteAttribute
);

// ✅ PUT /api/admin/categories/:categoryId/attributes/reorder
// Reorder attributes (for drag-drop UI) - PUBLIC
router.put(
  '/:categoryId/attributes/reorder',
  categoryAttributeController.reorderAttributes
);

// ✅ POST /api/admin/categories/:categoryId/attributes/bulk
// Bulk create attributes (for initial seeding) - PUBLIC
router.post(
  '/:categoryId/attributes/bulk',
  categoryAttributeController.bulkCreateAttributes
);

// ✅ GET /api/admin/categories/attributes/check/:categoryId
// Check if a category has any attributes - PUBLIC
router.get(
  '/attributes/check/:categoryId',
  categoryAttributeController.checkCategoryHasAttributes
);

// ✅ POST /api/admin/categories/attributes/seed
// Seed initial attributes from static file (one-time migration) - PUBLIC
router.post(
  '/attributes/seed',
  categoryAttributeController.seedInitialAttributes
);

module.exports = router;