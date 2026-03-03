// D:\Mani\Code with Zosh\Backup\source code\frontend\src\admin\pages\Home Page\DealsCategoryTable.tsx

import { useAppSelector } from "../../../Redux Toolkit/Store";
import HomeCategoryTable from "./HomeCategoryTable";

function DealsCategoryTable() {
  const homePage= useAppSelector((state) => state.homePage);

  return (
    <>
      <HomeCategoryTable categories={homePage.homePageData?.dealCategories}/>
    </>
  );
}


export default DealsCategoryTable