// D:\Mani\Code with Zosh\Backup\source code\backend\src\routers\electronicCategoryRoutes.js
const express = require('express');
const electronicCategoryController = require('../controllers/electronicCategoryController');
const { adminAuth } = require('../middlewares/adminAuthMiddleware');

const router = express.Router();

console.log('🔌 Loading electronic category routes...');

// ✅ TEMPORARY: Remove adminAuth to test if route works
router.get('/', electronicCategoryController.getElectronicCategoriesForAdmin);
router.post('/', electronicCategoryController.createElectronicCategory);
router.patch('/:id', electronicCategoryController.updateElectronicCategory);
router.delete('/:id', electronicCategoryController.deleteElectronicCategory);
router.patch('/:id/restore', electronicCategoryController.restoreElectronicCategory);

// ✅ Public routes
router.get('/all', electronicCategoryController.getElectronicCategories);
router.post('/initialize', electronicCategoryController.initializeCategories);

console.log('✅ Electronic category routes initialized');

module.exports = router;