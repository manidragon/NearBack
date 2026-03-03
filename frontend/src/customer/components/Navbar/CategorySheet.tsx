// D:\Mani\Code with Zosh\Backup\source code\frontend\src\customer\components\Navbar\CategorySheet.tsx
import { Box } from "@mui/material";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { fetchCategories } from "../../../Redux Toolkit/Admin/CategorySlice";
import type { Category } from "../../../types/categoryTypes";

interface CategorySheetProps {
  selectedCategory: string;
  toggleDrawer?: () => void;
  setShowSheet?: (show: boolean) => void;
}

const CategorySheet = ({
  selectedCategory,
  toggleDrawer,
  setShowSheet,
}: CategorySheetProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const categoryState = useAppSelector((state) => state.category);
  const { categories, loading } = categoryState;

  useEffect(() => {
    if (categories.length === 0) {
      dispatch(fetchCategories());
    }
  }, [dispatch, categories.length]);

  // ✅ Level 2: SORT by ORDER field (Preserves admin-set order)
  const getLevelTwoCategories = () => {
    return categories
      .filter(
        (cat) => cat.level === 2 && cat.parentCategory === selectedCategory
      )
      .sort((a, b) => {
        // ✅ Primary sort by order field
        const orderA = a.order || 999999;
        const orderB = b.order || 999999;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        // ✅ Secondary sort by name (for same order values)
        return (a.name || '').localeCompare(b.name || '');
      });
  };

  // ✅ Level 3: SORTED ALPHABETICALLY (unchanged)
  const getLevelThreeCategories = (parentCategoryId: string) => {
    return categories
      .filter(
        (cat) => cat.level === 3 && cat.parentCategory === parentCategoryId
      )
      .sort((a, b) => {
        const nameA = a.name || "";
        const nameB = b.name || "";
        return nameA.localeCompare(nameB);
      });
  };

  const handleCategoryClick = (categoryId: string) => {
    console.log('🔍 Navigating with category _id:', categoryId);
    if (toggleDrawer) {
      toggleDrawer();
    }
    if (setShowSheet) {
      setShowSheet(false);
    }
    navigate(`/products/${categoryId}`);
  };

  const levelTwoCategories = getLevelTwoCategories();

  return (
    <Box className="bg-white shadow-lg lg:h-auto overflow-y-auto">
      {loading ? (
        <div className="p-8 text-center">Loading categories...</div>
      ) : (
        <div className="flex text-sm flex-wrap ">
          {levelTwoCategories.map((levelTwoCat) => (
            <div
              key={levelTwoCat._id}
              className={`p-8 lg:w-[20%] ${levelTwoCategories.indexOf(levelTwoCat) % 2 === 0
                ? "bg-slate-50"
                : "bg-white"
                }`}
            >
              <p className="text-[#00927c] mb-5 font-semibold">
                {levelTwoCat.name}
              </p>

              <ul className="space-y-3">
                {getLevelThreeCategories(levelTwoCat._id).map(
                  (levelThreeCat) => (
                    <div key={levelThreeCat._id}>
                      <li
                        onClick={() => handleCategoryClick(levelThreeCat._id)}  // ← Use ObjectId _id!
                        className="hover:text-[#00927c] cursor-pointer"
                      >
                        {levelThreeCat.name}
                      </li>
                    </div>
                  )
                )}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Box>
  );
};

export default CategorySheet;