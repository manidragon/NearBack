// D:\Mani\Code with Zosh\Backup\source code\backend\src\controllers\categoryController.js
const Category = require('../models/Category');

class CategoryController {
  
  // Get all categories
  async getAllCategories(req, res) {
    try {
      const { level } = req.query;
      
      let query = {};
      if (level) {
        query.level = parseInt(level);
      }
      
      // ✅ SORT by order field (not alphabetically)
      const categories = await Category.find(query).sort({ 
        level: 1, 
        order: 1,  // ✅ Primary sort by order
        name: 1    // ✅ Secondary sort by name (for same order values)
      });
      
      res.status(200).json({
        success: true,
        count: categories.length,
        categories
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get categories by level
  async getCategoriesByLevel(req, res) {
    try {
      const { level } = req.params;
      
      // ✅ SORT by order field
      const categories = await Category.find({ level: parseInt(level) })
        .sort({ order: 1, name: 1 });
      
      res.status(200).json({
        success: true,
        count: categories.length,
        categories
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get single category by ID
  async getCategoryById(req, res) {
    try {
      const { id } = req.params;
      
      const category = await Category.findById(id);
      
      if (!category) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }
      
      res.status(200).json({
        success: true,
        category
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Create new category
  async createCategory(req, res) {
    try {
      const { name, categoryId, parentCategory, level, image, order } = req.body;
      
      // Validate required fields
      if (!name || !categoryId || level === undefined) {
        return res.status(400).json({ success: false, message: 'Name, categoryId, and level are required' });
      }
      
      // Validate level (1, 2, or 3)
      if (![1, 2, 3].includes(level)) {
        return res.status(400).json({ success: false, message: 'Level must be 1, 2, or 3' });
      }
      
      // For level 2 and 3, parentCategory is required
      if (level > 1 && !parentCategory) {
        return res.status(400).json({ success: false, message: `Parent category is required for level ${level}` });
      }
      
      // Check if categoryId already exists
      const existingCategory = await Category.findOne({ categoryId });
      if (existingCategory) {
        return res.status(400).json({ success: false, message: 'Category ID already exists' });
      }
      
      // ✅ Auto-assign order if not provided (for Level 1 & 2)
      let finalOrder = order;
      if (level <= 2 && order === undefined) {
        const maxOrderCategory = await Category.findOne({ level }).sort({ order: -1 });
        finalOrder = maxOrderCategory ? maxOrderCategory.order + 1 : 1;
      }
      
      // Create new category with optional image
      const category = await Category.create({
        name,
        categoryId,
        parentCategory: parentCategory || null,
        level,
        image: image || null,
        order: finalOrder !== undefined ? finalOrder : 0  // ✅ Include order
      });
      
      res.status(201).json({
        success: true,
        category
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({ success: false, message: 'Category ID already exists' });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Update category
  async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const { name, categoryId, parentCategory, level, image, order } = req.body;
      
      // Find category
      const category = await Category.findById(id);
      
      if (!category) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }
      
      // Update fields
      if (name !== undefined) category.name = name;
      if (categoryId !== undefined) category.categoryId = categoryId;
      if (parentCategory !== undefined) category.parentCategory = parentCategory;
      if (level !== undefined) category.level = level;
      if (image !== undefined) category.image = image;
      if (order !== undefined) category.order = order;  // ✅ Update order
      
      await category.save();
      
      res.status(200).json({
        success: true,
        category
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({ success: false, message: 'Category ID already exists' });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Delete category
  async deleteCategory(req, res) {
    try {
      const { id } = req.params;
      
      // Find category
      const category = await Category.findById(id);
      
      if (!category) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }
      
      // Check if category has children
      const childCount = await Category.countDocuments({ 
        parentCategory: id 
      });
      
      if (childCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete category with ${childCount} child categories. Delete children first.`
        });
      }
      
      // Delete category
      await Category.findByIdAndDelete(id);
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get child categories by parent ID
  async getChildCategories(req, res) {
    try {
      const { parentId } = req.params;
      
      // If parentId is "null", get root categories (level 1)
      const query = parentId === 'null' 
        ? { parentCategory: null }
        : { parentCategory: parentId };
      
      // ✅ SORT by order field
      const categories = await Category.find(query).sort({ order: 1, name: 1 });
      
      res.status(200).json({
        success: true,
        count: categories.length,
        categories
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new CategoryController();