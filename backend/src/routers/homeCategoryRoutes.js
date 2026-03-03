// D:\Mani\Code with Zosh\Backup\source code\backend\src\routers\homeCategoryRoutes.js
const express = require('express');
const homeCategoryController = require('../controllers/homeCategoryController');

const router = express.Router();

// Define routes
router.post('/categories', homeCategoryController.createHomeCategories);
router.get('/home-category', homeCategoryController.getHomeCategory);
router.post('/home-category', homeCategoryController.createHomeCategory); // ✅ NEW
router.patch('/home-category/:id', homeCategoryController.updateHomeCategory);
router.delete('/home-category/:id', homeCategoryController.deleteHomeCategory); // ✅ NEW

module.exports = router;