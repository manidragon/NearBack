// D:\Mani\Code with Zosh\Backup\source code\backend\src\controllers\CategoryAttributeController.js
const mongoose = require('mongoose');  // ✅ ADD THIS LINE
const CategoryAttribute = require('../models/CategoryAttribute');
const CategoryAttributeService = require('../services/CategoryAttributeService');
const CategoryAttributeError = require('../exceptions/CategoryAttributeError');

class CategoryAttributeController {
  /**
   * ✅ GET /api/admin/categories/:categoryId/attributes
   */
 getAttributesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { includeInactive } = req.query;

    console.log('📥 [Backend] Fetching attributes for:', categoryId, { includeInactive });

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Category ID is required'
      });
    }

    // ✅ Try to find category by EITHER _id (ObjectId) OR categoryId (slug)
    const Category = mongoose.model('Category');
    let categoryDoc;
    
    if (mongoose.Types.ObjectId.isValid(categoryId)) {
      categoryDoc = await Category.findById(categoryId);
    }
    
    if (!categoryDoc) {
      categoryDoc = await Category.findOne({ 
        categoryId: categoryId.toLowerCase(),
        level: 3
      });
    }
    
    if (!categoryDoc) {
      return res.status(404).json({
        success: false,
        message: `Category "${categoryId}" not found or is not a Level 3 category`
      });
    }
    
    if (categoryDoc.level !== 3) {
      return res.status(400).json({
        success: false,
        message: `Category "${categoryId}" is not a Level 3 category (found level ${categoryDoc.level})`
      });
    }

    const attributes = await CategoryAttributeService.getAttributesByCategory(
      categoryDoc.categoryId,
      includeInactive === 'true'
    );

    res.status(200).json({
      success: true,
      count: attributes.length,
      data: attributes  // ✅ Return as "data" to match frontend expectation
    });
  } catch (error) {
    console.error('❌ [Backend] Get attributes error:', error.message, error.stack);

    if (error instanceof CategoryAttributeError) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while fetching attributes: ' + error.message
    });
  }
}

  /**
   * ✅ GET /api/admin/categories/attributes/bulk
   */
  getAttributesForMultipleCategories = async (req, res) => {
    try {
      const { categoryIds } = req.body;

      if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'categoryIds array is required'
        });
      }

      const groupedAttributes = await CategoryAttributeService.getAttributesForMultipleCategories(categoryIds);

      res.status(200).json({
        success: true,
        data: groupedAttributes
      });
    } catch (error) {
      console.error('❌ Bulk get attributes error:', error.message);

      res.status(500).json({
        success: false,
        message: 'Server error while fetching attributes'
      });
    }
  }

  /**
   * ✅ POST /api/admin/categories/:categoryId/attributes
   */
  createAttribute = async (req, res) => {
    try {
      const { categoryId } = req.params;
      const {
        name, label, type, options, required, placeholder, min, max, step, order, isVariantField, displayInHighlights, sortOrder, isFilterable
      } = req.body;

      if (!name || !label || !type) {
        return res.status(400).json({
          success: false,
          message: 'name, label, and type are required fields'
        });
      }

      const validTypes = ['text', 'number', 'select', 'textarea', 'boolean'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: `type must be one of: ${validTypes.join(', ')}`
        });
      }

      if (type === 'select' && (!options || !Array.isArray(options) || options.length === 0)) {
        return res.status(400).json({
          success: false,
          message: 'Select type attributes must have at least one option'
        });
      }

      const adminId = req.admin?._id || req.user?._id || null;

      const attribute = await CategoryAttributeService.createAttribute(
        categoryId,
        {
          name, label, type, options,
          required: required || false,
          placeholder,
          min: type === 'number' ? min : undefined,
          max: type === 'number' ? max : undefined,
          step: type === 'number' ? (step || 1) : undefined,
          order: order || 0,

          isVariantField: isVariantField ?? false,
          displayInHighlights: displayInHighlights ?? true,
          sortOrder: sortOrder ?? 0,
          isFilterable: isFilterable ?? true,
        },
        adminId
      );

      res.status(201).json({
        success: true,
        message: 'Attribute created successfully',
        data: attribute
      });
    } catch (error) {
      console.error('❌ Create attribute error:', error.message);

      if (error instanceof CategoryAttributeError) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Server error while creating attribute'
      });
    }
  }

  /**
   * ✅ PUT /api/admin/categories/attributes/:id
   */
  updateAttribute = async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      if (!updates || Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No fields to update'
        });
      }

      const adminId = req.admin?._id || req.user?._id || null;

      const attribute = await CategoryAttributeService.updateAttribute(
        id, updates, adminId
      );

      res.status(200).json({
        success: true,
        message: 'Attribute updated successfully',
        data: attribute
      });
    } catch (error) {
      console.error('❌ Update attribute error:', error.message);

      if (error instanceof CategoryAttributeError) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Server error while updating attribute'
      });
    }
  }

  /**
   * ✅ DELETE /api/admin/categories/attributes/:id
   */
  deleteAttribute = async (req, res) => {
    try {
      const { id } = req.params;
      const adminId = req.admin?._id || req.user?._id || null;

      const attribute = await CategoryAttributeService.deleteAttribute(id, adminId);

      res.status(200).json({
        success: true,
        message: 'Attribute deactivated successfully',
        data: attribute
      });
    } catch (error) {
      console.error('❌ Delete attribute error:', error.message);

      if (error instanceof CategoryAttributeError) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Server error while deleting attribute'
      });
    }
  }

  /**
   * ✅ PUT /api/admin/categories/:categoryId/attributes/reorder
   */
  reorderAttributes = async (req, res) => {
    try {
      const { categoryId } = req.params;
      const { orderedIds } = req.body;

      if (!orderedIds || !Array.isArray(orderedIds) || orderedIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'orderedIds array is required'
        });
      }

      const attributes = await CategoryAttributeService.reorderAttributes(
        categoryId, orderedIds
      );

      res.status(200).json({
        success: true,
        message: 'Attributes reordered successfully',
        data: attributes
      });
    } catch (error) {
      console.error('❌ Reorder attributes error:', error.message);

      if (error instanceof CategoryAttributeError) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Server error while reordering attributes'
      });
    }
  }

  /**
   * ✅ POST /api/admin/categories/:categoryId/attributes/bulk
   */
  bulkCreateAttributes = async (req, res) => {
    try {
      const { categoryId } = req.params;
      const { attributes } = req.body;

      if (!attributes || !Array.isArray(attributes) || attributes.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'attributes array is required'
        });
      }

      const adminId = req.admin?._id || req.user?._id || null;

      const createdAttributes = await CategoryAttributeService.bulkCreateAttributes(
        categoryId, attributes, adminId
      );

      res.status(201).json({
        success: true,
        message: `Created ${createdAttributes.length} attributes`,
        data: createdAttributes
      });
    } catch (error) {
      console.error('❌ Bulk create attributes error:', error.message);

      res.status(500).json({
        success: false,
        message: 'Server error while bulk creating attributes'
      });
    }
  }

  /**
   * ✅ GET /api/admin/categories/attributes/check/:categoryId
   */
  checkCategoryHasAttributes = async (req, res) => {
    try {
      const { categoryId } = req.params;

      const hasAttributes = await CategoryAttributeService.categoryHasAttributes(categoryId);

      res.status(200).json({
        success: true,
        data: { categoryId, hasAttributes }
      });
    } catch (error) {
      console.error('❌ Check attributes error:', error.message);

      res.status(500).json({
        success: false,
        message: 'Server error while checking attributes'
      });
    }
  }

  /**
   * ✅ POST /api/admin/categories/attributes/seed
   */
  seedInitialAttributes = async (req, res) => {
    try {
      const { categoryAttributes } = require('../../data/categoryAttributes');

      let totalCreated = 0;
      const results = [];

      for (const [categoryId, attrs] of Object.entries(categoryAttributes)) {
        try {
          const adminId = req.admin?._id || req.user?._id || null;
          const created = await CategoryAttributeService.bulkCreateAttributes(
            categoryId, attrs, adminId
          );
          totalCreated += created.length;
          results.push({ categoryId, count: created.length });
        } catch (error) {
          console.warn(`⚠️ Failed to seed ${categoryId}:`, error.message);
          results.push({ categoryId, error: error.message });
        }
      }

      res.status(201).json({
        success: true,
        message: `Seeded ${totalCreated} attributes across ${results.length} categories`,
        data: results
      });
    } catch (error) {
      console.error('❌ Seed attributes error:', error.message);

      res.status(500).json({
        success: false,
        message: 'Server error while seeding attributes'
      });
    }
  }
}

// ✅ Export instance with auto-bound methods (arrow functions)
module.exports = new CategoryAttributeController();