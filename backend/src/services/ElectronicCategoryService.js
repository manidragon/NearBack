// D:\Mani\Code with Zosh\Backup\source code\backend\src\services\ElectronicCategoryService.js
const ElectronicCategory = require('../models/ElectronicCategory');

class ElectronicCategoryService {
  // Create single electronic category
  async createElectronicCategory(data) {
    const existing = await ElectronicCategory.findOne({ categoryId: data.categoryId });
    if (existing) {
      throw new Error(`Category ID "${data.categoryId}" already exists`);
    }
    return await ElectronicCategory.create(data);
  }

  // Create multiple categories (for initialization)
  async createMultipleCategories(categories) {
    const existingCount = await ElectronicCategory.countDocuments();
    if (existingCount === 0) {
      return await ElectronicCategory.insertMany(categories);
    }
    return await this.getAllElectronicCategories();
  }

  // Get all active electronic categories
  async getAllElectronicCategories() {
    return await ElectronicCategory.find({ isActive: true }).sort({ createdAt: 1 });
  }

  // Get all electronic categories (including inactive) for admin
  async getAllForAdmin() {
    return await ElectronicCategory.find().sort({ createdAt: -1 });
  }

  // Update electronic category
  async updateElectronicCategory(id, data) {
    const category = await ElectronicCategory.findById(id);
    if (!category) {
      throw new Error("Electronic category not found");
    }
    
    // Check for duplicate categoryId if changing
    if (data.categoryId && data.categoryId !== category.categoryId) {
      const duplicate = await ElectronicCategory.findOne({ 
        categoryId: data.categoryId,
        _id: { $ne: id } 
      });
      if (duplicate) {
        throw new Error(`Category ID "${data.categoryId}" already exists`);
      }
    }
    
    return await ElectronicCategory.findByIdAndUpdate(id, data, { new: true });
  }

  // Delete electronic category (soft delete)
  async deleteElectronicCategory(id) {
    const category = await ElectronicCategory.findById(id);
    if (!category) {
      throw new Error("Electronic category not found");
    }
    return await ElectronicCategory.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }

  // Restore deleted category
  async restoreElectronicCategory(id) {
    return await ElectronicCategory.findByIdAndUpdate(id, { isActive: true }, { new: true });
  }
}

module.exports = new ElectronicCategoryService();