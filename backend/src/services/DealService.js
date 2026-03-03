// D:\Mani\Code with Zosh\Backup\source code\backend\src\services\DealService.js
const Deal = require("../models/Deal");
const HomeCategory = require("../models/HomeCategory");

class DealService {
  async getDeals() {
    try {
      const deals = await Deal.find().populate({ 
        path: "category",
        select: "name categoryId image description" // ✅ Only select needed fields
      });
      return deals;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async createDeal(deal) {
    try {
      // ✅ FIXED: Handle category properly
      const categoryId = deal.category?._id || deal.category;
      
      if (!categoryId) {
        throw new Error("Category is required");
      }

      const category = await HomeCategory.findById(categoryId);
      if (!category) {
        throw new Error("Category not found");
      }

      const newDeal = new Deal({
        discount: deal.discount,
        category: categoryId, // ✅ Store only the ID
      });

      const savedDeal = await newDeal.save();
      
      // ✅ Populate category after save
      return await Deal.findById(savedDeal._id).populate({ 
        path: "category",
        select: "name categoryId image description"
      });
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // ✅ FIXED: Update both discount and category
  async updateDeal(dealData, id) {
    try {
      const existingDeal = await Deal.findById(id);
      if (!existingDeal) {
        throw new Error("Deal not found");
      }

      // ✅ Update discount
      if (dealData.discount !== undefined) {
        existingDeal.discount = dealData.discount;
      }

      // ✅ Update category if provided
      if (dealData.category) {
        const categoryId = dealData.category._id || dealData.category;
        const category = await HomeCategory.findById(categoryId);
        
        if (!category) {
          throw new Error("Category not found");
        }
        
        existingDeal.category = categoryId;
      }

      const updatedDeal = await existingDeal.save();
      
      // ✅ Populate category
      return await Deal.findById(updatedDeal._id).populate({ 
        path: "category",
        select: "name categoryId image description"
      });
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // ✅ FIXED: Delete deal
  async deleteDeal(id) {
    try {
      const deal = await Deal.findById(id);
      if (!deal) {
        throw new Error("Deal not found");
      }
      
      await Deal.deleteOne({ _id: id });
      return { message: "Deal deleted successfully" };
    } catch (error) {
      throw new Error(error.message);
    }
  }
}

module.exports = new DealService();