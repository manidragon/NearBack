// D:\Mani\Code with Zosh\Backup\source code\frontend\src\customer\pages\Home\Electronic Category\ElectronicCategory.tsx
import ElectronicCategoryCard from "./ElectronicCategoryCard";
import { useMediaQuery } from "@mui/material";
import { useAppSelector } from "../../../../Redux Toolkit/Store";
import type { ElectronicCategoryItem } from "../../../../types/homeDataTypes"; // ✅ ADD IMPORT

const ElectronicCategory = () => {
  const homePage = useAppSelector((state) => state.homePage);
  const isSmallScreen = useMediaQuery("(max-width:600px)");

  // ✅ TypeScript now knows this is ElectronicCategoryItem[]
  const electricCategories: ElectronicCategoryItem[] = 
    homePage.homePageData?.electricCategories || [];

  return (
    <div className="flex flex-wrap justify-between py-5 lg:px-20 border-b">
      {electricCategories.map((item) => (
        <ElectronicCategoryCard 
          key={item._id || item.categoryId} // ✅ Safe fallback
          item={item} 
        />
      ))}
    </div>
  );
};

export default ElectronicCategory;