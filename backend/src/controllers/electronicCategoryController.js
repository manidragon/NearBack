// D:\Mani\Code with Zosh\Backup\source code\backend\src\controllers\electronicCategoryController.js

const ElectronicCategoryService = require('../services/ElectronicCategoryService');

class ElectronicCategoryController {
  // Initialize categories (for first-time setup)
  async initializeCategories(req, res) {
    try {
      const categories = req.body;
      const result = await ElectronicCategoryService.createMultipleCategories(categories);
      return res.status(201).json(result);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Get all categories for customer display
  async getElectronicCategories(req, res) {
    try {
      const categories = await ElectronicCategoryService.getAllElectronicCategories();
      return res.status(200).json(categories);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Get all categories for admin panel
  async getElectronicCategoriesForAdmin(req, res) {
    try {
      const categories = await ElectronicCategoryService.getAllForAdmin();
      return res.status(200).json(categories);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Create new electronic category
  async createElectronicCategory(req, res) {
    try {
      const category = await ElectronicCategoryService.createElectronicCategory(req.body);
      return res.status(201).json(category);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }

  // Update electronic category
  async updateElectronicCategory(req, res) {
    try {
      const { id } = req.params;
      const category = await ElectronicCategoryService.updateElectronicCategory(id, req.body);
      return res.status(200).json(category);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }

  // Delete electronic category (soft delete)
  async deleteElectronicCategory(req, res) {
    try {
      const { id } = req.params;
      await ElectronicCategoryService.deleteElectronicCategory(id);
      return res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }

  // Restore deleted category
  async restoreElectronicCategory(req, res) {
    try {
      const { id } = req.params;
      await ElectronicCategoryService.restoreElectronicCategory(id);
      return res.status(200).json({ message: 'Category restored successfully' });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
}

module.exports = new ElectronicCategoryController();