const HomeCategory = require('../models/HomeCategory');

class HomeCategoryService {
 
    // Create a single home category
    async createHomeCategory(homeCategory) {
        return await HomeCategory.create(homeCategory);
    }

    // Create multiple home categories or return existing ones
    async createCategories(homeCategories) {
        const existingCategories = await HomeCategory.find();
        if (existingCategories.length === 0) {
            return await HomeCategory.insertMany(homeCategories);
        }
        return existingCategories;
    }

    // Update an existing home category
    async updateHomeCategory(category, id) {
        const existingCategory = await HomeCategory.findById(id);
        if (!existingCategory) {
            throw new Error("Category not found");
        }
        return await HomeCategory.findByIdAndUpdate(existingCategory._id, category, { new: true });
    }

    // ✅ NEW: Delete home category
    async deleteHomeCategory(id) {
        const existingCategory = await HomeCategory.findById(id);
        if (!existingCategory) {
            throw new Error("Category not found");
        }
        await HomeCategory.findByIdAndDelete(id);
        return { message: 'Category deleted successfully' };
    }

    // Get all home categories
    async getAllHomeCategories() {
        return await HomeCategory.find();
    }
}

module.exports = new HomeCategoryService();