// D:\Mani\Code with Zosh\Backup\source code\frontend\src\admin\pages\Home Page\ShopByCategoryTable.tsx
import React from 'react'
import HomeCategoryCard from '../../../customer/pages/Home/HomeCategory/HomeCategoryCard'
import HomeCategoryTable from './HomeCategoryTable'
import { useAppSelector } from '../../../Redux Toolkit/Store';

const ShopByCategoryTable = () => {
    const homePage = useAppSelector((state) => state.homePage);
  return (
    <HomeCategoryTable categories={homePage.homePageData?.shopByCategories}/>
  )
}

export default ShopByCategoryTable