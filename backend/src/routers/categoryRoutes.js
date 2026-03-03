// D:\Mani\Code with Zosh\Backup\source code\backend\src\routers\categoryRoutes.js
const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { adminAuth } = require('../middlewares/adminAuthMiddleware');

// Get all categories (with optional level filter)
router.get('/', categoryController.getAllCategories);

// Get categories by level
router.get('/level/:level', categoryController.getCategoriesByLevel);

// Get single category by ID
router.get('/:id', categoryController.getCategoryById);

// Create new category
router.post('/', adminAuth, categoryController.createCategory);

// Update category
router.patch('/:id', adminAuth, categoryController.updateCategory);

// Delete category
router.delete('/:id', adminAuth, categoryController.deleteCategory);

// Get child categories by parent ID
router.get('/parent/:parentId', categoryController.getChildCategories);

module.exports = router;