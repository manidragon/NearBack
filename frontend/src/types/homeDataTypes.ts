// ✅ KEEP EXISTING HomeCategorySection const
export const HomeCategorySection = {
  GRID: "GRID",
  SHOP_BY_CATEGORIES: "SHOP_BY_CATEGORIES",
  ELECTRIC_CATEGORIES: "ELECTRIC_CATEGORIES",
  DEALS: "DEALS"
} as const;

export type HomeCategorySectionType = typeof HomeCategorySection[keyof typeof HomeCategorySection];

// ✅ ADD NEW INTERFACE FOR ELECTRONIC CATEGORIES
export interface ElectronicCategoryItem {
  _id?: string;
  name: string;          // Required for display
  image: string;         // Required for image
  categoryId: string;    // Required for routing
  description?: string;  // Optional description
}

// ✅ KEEP EXISTING HomeCategory (for GRID, SHOP_BY_CATEGORIES, DEALS)
export interface HomeCategory {
  _id?: string;
  image: string;
  description: string;
  section: string;
}

interface Deal {
  category: HomeCategory | ElectronicCategoryItem; // ✅ Support both types
  discount: number;
}

export interface HomeData {
  _id: string; 
  grid: HomeCategory[]; 
  shopByCategories: HomeCategory[]; 
  electricCategories: ElectronicCategoryItem[]; // ✅ UPDATED TYPE
  deals: Deal[]; 
  dealCategories: HomeCategory[];
}