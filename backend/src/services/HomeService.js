// D:\Mani\Code with Zosh\Backup\source code\backend\src\services\HomeService.js
const HomeCategorySection = require('../domain/HomeCategorySection');
const Deal = require('../models/Deal');
const ElectronicCategory = require('../models/ElectronicCategory'); // ✅ ADD THIS

class HomeService {
    async createHomePageData(allCategories) {
        // Filter categories based on their section
        const gridCategories = allCategories.filter(category => 
            category.section === HomeCategorySection.GRID
        );

        const shopByCategories = allCategories.filter(category => 
            category.section === HomeCategorySection.SHOP_BY_CATEGORIES
        );

        // ✅ FETCH ELECTRONIC CATEGORIES FROM NEW COLLECTION
        const electricCategories = await ElectronicCategory.find({ isActive: true }).sort({ createdAt: 1 });

        const dealCategories = allCategories.filter(category => 
            category.section === HomeCategorySection.DEALS
        );

        // Get existing deals
        const existingDeals = await Deal.find().populate("category");
        
        const dealsToReturn = existingDeals.length > 0 
            ? existingDeals 
            : [];

        const home = {
            grid: gridCategories,
            shopByCategories: shopByCategories,
            electricCategories: electricCategories, // ✅ USE NEW DATA
            deals: dealsToReturn,
            dealCategories: dealCategories
        };

        return home; 
    }
}

module.exports = new HomeService();