// D:\Mani\Code with Zosh\Backup\source code\backend\src\services\CategoryAttributeService.js
const CategoryAttribute = require('../models/CategoryAttribute');
const Category = require('../models/Category');
const CategoryAttributeError = require('../exceptions/CategoryAttributeError');

class CategoryAttributeService {
  /**
   * ✅ Create a new attribute for a category
   * @param {string} categoryId - Level 3 category's categoryId slug (e.g., "tshirt")
   * @param {object} attributeData - Attribute configuration
   * @param {string} adminId - Admin user ID for tracking
   * @returns {Promise<CategoryAttribute>}
   */
  async createAttribute(categoryId, attributeData, adminId = null) {
    try {
      // ✅ Validate category exists and is Level 3
      const category = await Category.findOne({ categoryId, level: 3 });
      if (!category) {
        throw new CategoryAttributeError(
          `Category "${categoryId}" not found or is not a Level 3 category`
        );
      }

      // ✅ Normalize attribute name (lowercase, no spaces)
      const normalizedName = attributeData.name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_');

      // ✅ Check for duplicate attribute name in same category
      const existing = await CategoryAttribute.findOne({
        categoryId,
        name: normalizedName,
      });

      if (existing) {
        throw new CategoryAttributeError(
          `Attribute "${normalizedName}" already exists for category "${categoryId}"`
        );
      }

      // ✅ Validate select type has options
      if (attributeData.type === 'select' && (!attributeData.options || attributeData.options.length === 0)) {
        throw new CategoryAttributeError(
          'Select type attributes must have at least one option'
        );
      }

      // ✅ Create attribute
      const attribute = new CategoryAttribute({
        categoryId,
        name: normalizedName,
        label: attributeData.label.trim(),
        type: attributeData.type,
        options: attributeData.type === 'select' ? attributeData.options.map(opt => opt.trim()) : [],
        required: attributeData.required || false,
        placeholder: attributeData.placeholder?.trim() || '',
        min: attributeData.type === 'number' ? attributeData.min : undefined,
        max: attributeData.type === 'number' ? attributeData.max : undefined,
        step: attributeData.type === 'number' ? (attributeData.step || 1) : undefined,
        order: attributeData.order || 0,

        // ✅✅✅ NEW: Variant Control Fields
        isVariantField: attributeData.isVariantField ?? false,
        displayInHighlights: attributeData.displayInHighlights ?? true,
        sortOrder: attributeData.sortOrder ?? 0,
        isFilterable: attributeData.isFilterable ?? true,

        isActive: true,
        createdBy: adminId || null,
      });

      await attribute.save();
      console.log(`✅ Attribute "${attribute.name}" created for category "${categoryId}"`);

      return attribute;
    } catch (error) {
      console.error('❌ Create attribute error:', error.message);
      if (error instanceof CategoryAttributeError) {
        throw error;
      }
      throw new CategoryAttributeError(error.message || 'Failed to create attribute');
    }
  }

  /**
   * ✅ Get all active attributes for a category (for product form)
   * @param {string} categoryId - Level 3 category's categoryId slug
   * @param {boolean} includeInactive - Include deactivated attributes (admin view)
   * @returns {Promise<CategoryAttribute[]>}
   */
async getAttributesByCategory(categoryId, includeInactive = false) {
  try {
    console.log('📥 [Service] Fetching attributes for categoryId:', categoryId, { includeInactive });

    if (!categoryId) {
      throw new CategoryAttributeError('Category ID is required');
    }

    // ✅ Build query with categoryId (slug) and optional isActive filter
    const query = { categoryId: categoryId.toLowerCase() };
    if (!includeInactive) {
      query.isActive = true;
    }

    const attributes = await CategoryAttribute.find(query)
      .sort({ sortOrder: 1, order: 1, name: 1 });

    return attributes;
  } catch (error) {
    console.error('❌ [Service] Get attributes error:', error.message);
    throw new CategoryAttributeError(error.message || 'Failed to fetch category attributes');
  }
}

  /**
   * ✅ Get a single attribute by ID
   * @param {string} attributeId - MongoDB _id
   * @returns {Promise<CategoryAttribute>}
   */
  async getAttributeById(attributeId) {
    try {
      const attribute = await CategoryAttribute.findById(attributeId);
      if (!attribute) {
        throw new CategoryAttributeError(`Attribute not found with id "${attributeId}"`);
      }
      return attribute;
    } catch (error) {
      console.error('❌ Get attribute by ID error:', error.message);
      if (error instanceof CategoryAttributeError) {
        throw error;
      }
      throw new CategoryAttributeError(error.message || 'Failed to fetch attribute');
    }
  }

  /**
   * ✅ Update an existing attribute
   * @param {string} attributeId - MongoDB _id
   * @param {object} updates - Fields to update
   * @param {string} adminId - Admin user ID for tracking
   * @returns {Promise<CategoryAttribute>}
   */
  async updateAttribute(attributeId, updates, adminId = null) {
    try {
      const attribute = await this.getAttributeById(attributeId);

      // ✅ Prevent changing categoryId (would break relationships)
      if (updates.categoryId && updates.categoryId !== attribute.categoryId) {
        throw new CategoryAttributeError('Cannot change category of an existing attribute');
      }

      // ✅ Normalize name if being updated
      if (updates.name) {
        const normalizedName = updates.name.toLowerCase().trim().replace(/\s+/g, '_');

        // ✅ Check for duplicate name (excluding current attribute)
        const existing = await CategoryAttribute.findOne({
          categoryId: attribute.categoryId,
          name: normalizedName,
          _id: { $ne: attributeId },
        });

        if (existing) {
          throw new CategoryAttributeError(
            `Attribute "${normalizedName}" already exists for this category`
          );
        }

        updates.name = normalizedName;
      }

      // ✅ Validate select type has options
      if (updates.type === 'select' && (!updates.options || updates.options.length === 0)) {
        throw new CategoryAttributeError(
          'Select type attributes must have at least one option'
        );
      }

      // ✅ Update allowed fields
      const allowedUpdates = [
        'label', 'name', 'type', 'options', 'required',
        'placeholder', 'min', 'max', 'step', 'order', 'isActive',
        'isVariantField', 'displayInHighlights', 'sortOrder', 'isFilterable'
      ];

      const updateData = {};
      for (const field of allowedUpdates) {
        if (updates[field] !== undefined) {
          updateData[field] = updates[field];
        }
      }

      // ✅ Add admin tracking
      if (adminId) {
        updateData.updatedBy = adminId;
      }

      // ✅ Perform update
      const updatedAttribute = await CategoryAttribute.findByIdAndUpdate(
        attributeId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      console.log(`✅ Attribute "${updatedAttribute.name}" updated`);

      return updatedAttribute;
    } catch (error) {
      console.error('❌ Update attribute error:', error.message);
      if (error instanceof CategoryAttributeError) {
        throw error;
      }
      throw new CategoryAttributeError(error.message || 'Failed to update attribute');
    }
  }

  /**
   * ✅ Soft delete an attribute (set isActive = false)
   * @param {string} attributeId - MongoDB _id
   * @param {string} adminId - Admin user ID for tracking
   * @returns {Promise<CategoryAttribute>}
   */
  // ✅✅✅ UPDATED: Permanent delete attribute (remove from DB completely)
  async deleteAttribute(attributeId, adminId = null) {
    try {
      // ✅ First, get the attribute to log its name
      const attribute = await this.getAttributeById(attributeId);

      // ✅✅✅ PERMANENT DELETE: Remove document from database completely
      const deletedAttribute = await CategoryAttribute.findByIdAndDelete(attributeId);

      if (!deletedAttribute) {
        throw new CategoryAttributeError('Attribute not found');
      }

      // ✅ Optional: Log who deleted it (for audit purposes)
      console.log(`✅ Attribute "${attribute.name}" permanently deleted by admin ${adminId || 'system'}`);

      // ✅ Return the deleted attribute data for confirmation
      return {
        _id: deletedAttribute._id,
        name: deletedAttribute.name,
        categoryId: deletedAttribute.categoryId,
        message: 'Attribute permanently deleted'
      };
    } catch (error) {
      console.error('❌ Permanent delete error:', error.message);
      if (error instanceof CategoryAttributeError) {
        throw error;
      }
      throw new CategoryAttributeError(error.message || 'Failed to permanently delete attribute');
    }
  }

  /**
   * ✅ Permanently delete an attribute (use with caution)
   * @param {string} attributeId - MongoDB _id
   * @returns {Promise<void>}
   */
  async permanentlyDeleteAttribute(attributeId) {
    try {
      const attribute = await this.getAttributeById(attributeId);
      await CategoryAttribute.findByIdAndDelete(attributeId);
      console.log(`🗑️ Attribute "${attribute.name}" permanently deleted`);
    } catch (error) {
      console.error('❌ Permanent delete error:', error.message);
      throw new CategoryAttributeError(error.message || 'Failed to permanently delete attribute');
    }
  }

  /**
   * ✅ Reorder attributes (for drag-drop UI)
   * @param {string} categoryId - Level 3 category's categoryId slug
   * @param {string[]} orderedIds - Array of attribute _id in new order
   * @returns {Promise<CategoryAttribute[]>}
   */
  async reorderAttributes(categoryId, orderedIds) {
    try {
      // ✅ Validate all attributes belong to this category
      const attributes = await CategoryAttribute.find({
        _id: { $in: orderedIds },
        categoryId,
      });

      if (attributes.length !== orderedIds.length) {
        throw new CategoryAttributeError(
          'Some attributes do not belong to this category'
        );
      }

      // ✅ Update order for each attribute
      const updateOperations = orderedIds.map((id, index) => ({
        updateOne: {
          filter: { _id: id },
          update: { $set: { order: index } },
        },
      }));

      await CategoryAttribute.bulkWrite(updateOperations);

      // ✅ Fetch and return updated attributes
      const updatedAttributes = await CategoryAttribute.find({
        categoryId,
        isActive: true,
      }).sort({ order: 1 });

      console.log(`✅ Reordered ${updatedAttributes.length} attributes for category "${categoryId}"`);

      return updatedAttributes;
    } catch (error) {
      console.error('❌ Reorder attributes error:', error.message);
      if (error instanceof CategoryAttributeError) {
        throw error;
      }
      throw new CategoryAttributeError(error.message || 'Failed to reorder attributes');
    }
  }

  /**
   * ✅ Bulk create attributes for a category (for initial seeding)
   * @param {string} categoryId - Level 3 category's categoryId slug
   * @param {object[]} attributesData - Array of attribute configurations
   * @param {string} adminId - Admin user ID for tracking
   * @returns {Promise<CategoryAttribute[]>}
   */
  async bulkCreateAttributes(categoryId, attributesData, adminId = null) {
    try {
      const createdAttributes = [];

      for (const attrData of attributesData) {
        try {
          const attribute = await this.createAttribute(categoryId, attrData, adminId);
          createdAttributes.push(attribute);
        } catch (error) {
          // ✅ Skip duplicates, log warning
          console.warn(`⚠️ Skipping attribute "${attrData.name}": ${error.message}`);
        }
      }

      console.log(`✅ Bulk created ${createdAttributes.length} attributes for category "${categoryId}"`);

      return createdAttributes;
    } catch (error) {
      console.error('❌ Bulk create error:', error.message);
      throw new CategoryAttributeError(error.message || 'Failed to bulk create attributes');
    }
  }

  /**
   * ✅ Get attributes for multiple categories (admin dashboard)
   * @param {string[]} categoryIds - Array of category slugs
   * @returns {Promise<Object>} - Map of categoryId → attributes
   */
  async getAttributesForMultipleCategories(categoryIds) {
    try {
      const attributes = await CategoryAttribute.find({
        categoryId: { $in: categoryIds },
        isActive: true,
      }).sort({ categoryId: 1, order: 1 });

      // ✅ Group by categoryId
      const grouped = attributes.reduce((acc, attr) => {
        if (!acc[attr.categoryId]) {
          acc[attr.categoryId] = [];
        }
        acc[attr.categoryId].push(attr);
        return acc;
      }, {});

      console.log(`✅ Fetched attributes for ${Object.keys(grouped).length} categories`);

      return grouped;
    } catch (error) {
      console.error('❌ Get multiple categories error:', error.message);
      throw new CategoryAttributeError(error.message || 'Failed to fetch attributes');
    }
  }

  /**
   * ✅ Check if a category has any attributes
   * @param {string} categoryId - Level 3 category's categoryId slug
   * @returns {Promise<boolean>}
   */
  async categoryHasAttributes(categoryId) {
    try {
      const count = await CategoryAttribute.countDocuments({
        categoryId,
        isActive: true,
      });
      return count > 0;
    } catch (error) {
      console.error('❌ Check attributes error:', error.message);
      return false;
    }
  }
}

module.exports = new CategoryAttributeService();