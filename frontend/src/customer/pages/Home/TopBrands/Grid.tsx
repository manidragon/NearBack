import { useAppSelector } from "../../../../Redux Toolkit/Store";

const TopBrand = () => {
  const homePage = useAppSelector(state => state.homePage);
  
  // ✅ ADD: Safety check - return null if no grid data
  if (!homePage.homePageData?.grid || homePage.homePageData.grid.length === 0) {
    return null; // Don't render grid if no data
  }

  // ✅ ADD: Helper function to safely get grid item
  const getGridItem = (index: number) => {
    return homePage.homePageData?.grid[index] || {
      image: "/placeholder-banner.jpg", // Fallback image
      description: "Coming Soon"
    };
  };

  return (
    <div className="grid gap-4 grid-rows-12 grid-cols-12 lg:h-[600px] px-5 lg:px-20">
      <div className="col-span-3 row-span-12  rounded">
        <img
          className="w-full h-full object-cover   rounded-md"
          src={getGridItem(0).image}
          alt={getGridItem(0).description || "Banner 1"}
        />
      </div>

      <div className="col-span-2 row-span-6  rounded">
        <img
          className="w-full h-full object-cover rounded-md"
          src={getGridItem(1).image}
          alt={getGridItem(1).description || "Banner 2"}
        />
      </div>

      <div className="col-span-4 row-span-6  rounded">
        <img
          className="w-full h-full object-cover object-top   rounded-md"
          src={getGridItem(2).image}
          alt={getGridItem(2).description || "Banner 3"}
        />
      </div>

      <div className="col-span-3 row-span-12  rounded">
        <img
          className="w-full h-full object-cover object-top   rounded-md"
          src={getGridItem(3).image}
          alt={getGridItem(3).description || "Banner 4"}
        />
      </div>

      <div className="col-span-4 row-span-6  rounded">
        <img
          className="w-full h-full object-cover object-top   rounded-md"
          src={getGridItem(4).image}
          alt={getGridItem(4).description || "Banner 5"}
        />
      </div>

      <div className="col-span-2 row-span-6  rounded">
        <img
          className="w-full h-full object-cover  rounded-md"
          src={getGridItem(5).image}
          alt={getGridItem(5).description || "Banner 6"}
        />
      </div>
    </div>
  );
};

export default TopBrand;