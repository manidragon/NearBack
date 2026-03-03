// D:\Mani\Code with Zosh\Backup\source code\backend\src\controllers\homeCategoryController.js
const HomeCategoryService = require('../services/HomeCategoryService');
const HomeService = require('../services/HomeService');

class HomeCategoryController {

    // Create Home Categories (bulk initialization)
    async createHomeCategories(req, res) {
        try {
            const homeCategories = req.body; 
            const categories = await HomeCategoryService.createCategories(homeCategories);
            const home = await HomeService.createHomePageData(categories);
            return res.status(201).json(home);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    // Get All Home Categories
    async getHomeCategory(req, res) {
        try {
            const categories = await HomeCategoryService.getAllHomeCategories();
            return res.status(200).json(categories);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    // ✅ NEW: Create single home category
    async createHomeCategory(req, res) {
        try {
            const homeCategory = req.body;
            const category = await HomeCategoryService.createHomeCategory(homeCategory);
            return res.status(201).json(category);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    // Update Home Category
    async updateHomeCategory(req, res) {
        try {
            const id = req.params.id;
            const homeCategory = req.body;
            const updatedCategory = await HomeCategoryService.updateHomeCategory(homeCategory, id);
            return res.status(200).json(updatedCategory);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    // ✅ NEW: Delete home category
    async deleteHomeCategory(req, res) {
        try {
            const id = req.params.id;
            await HomeCategoryService.deleteHomeCategory(id);
            return res.status(200).json({ message: 'Category deleted successfully' });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
}

module.exports = new HomeCategoryController();