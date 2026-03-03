// D:\Mani\Code with Zosh\Backup\source code\frontend\src\customer\pages\Home\HomeCategory\HomeCategory.tsx
import HomeCategoryCard from './HomeCategoryCard'
import { useAppSelector } from '../../../../Redux Toolkit/Store';


const HomeCategory = () => {
  const homePage = useAppSelector((state) => state.homePage);
  return (
    <div className="flex justify-center gap-7 flex-wrap">
      {homePage.homePageData?.shopByCategories.map((item) => (
        <HomeCategoryCard
          key={item._id }
          item={item}
        />
      ))}
    </div>
  )
}

export default HomeCategory