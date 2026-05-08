// D:\Mani\Code with Zosh\Backup\source code\frontend\src\customer\pages\Products\Products.tsx
import React, { useState, useEffect, useMemo } from "react";
import ProductCard from "./ProductCard/ProductCard";
import FilterSection from "./FilterSection";
import {
  Box,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  type SelectChangeEvent,
  useMediaQuery,
  useTheme,
  CircularProgress,
  Typography,
} from "@mui/material";

import FilterAltIcon from "@mui/icons-material/FilterAlt";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { fetchCategories } from "../../../Redux Toolkit/Admin/CategorySlice";
import type { Category } from "../../../types/categoryTypes";
import { getAllProducts, selectLocationFilter } from "../../../Redux Toolkit/Customer/ProductSlice";

const Products = () => {
  const [sort, setSort] = React.useState("");
  const theme = useTheme();
  const isLarge = useMediaQuery(theme.breakpoints.up("lg"));
  const [showFilter, setShowFilter] = useState(false);
  const { categoryId } = useParams(); // MongoDB ObjectId from URL
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const products = useAppSelector((state) => state.products);
  const categoryState = useAppSelector((state) => state.category);
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const locationFilter = useAppSelector(selectLocationFilter);

  // ✅ Fetch categories if not already loaded
  useEffect(() => {
    if (categoryState.categories.length === 0) {
      dispatch(fetchCategories());
    }
  }, [dispatch, categoryState.categories.length]);

  // ✅ Helper to resolve slug from ObjectId (for FilterSection only)
  const getCategorySlugFromId = useMemo(() => {
    return (id: string | undefined): string | undefined => {
      if (!id || !categoryState.categories?.length) return undefined;

      const category = categoryState.categories.find(
        (cat: Category) => cat._id === id
      );

      return category?.categoryId;
    };
  }, [categoryState.categories]);

  // ✅ Compute slug ONLY for FilterSection (category attributes API)
  const categorySlug = useMemo(() => {
    return getCategorySlugFromId(categoryId);
  }, [categoryId, getCategorySlugFromId]);

  // ✅ Get category name for display
  const categoryName = useMemo(() => {
    if (!categoryId) return 'Products';

    const category = categoryState.categories.find(
      (cat: Category) => cat._id === categoryId
    );

    if (category?.name) {
      return category.name;
    }

    return categoryId
      .split('_')
      .map((item: string) => item.charAt(0).toUpperCase() + item.slice(1).toLowerCase())
      .join(' ');
  }, [categoryId, categoryState.categories]);

  const handleSortProduct = (event: SelectChangeEvent) => {
    setSort(event.target.value as string);
  };

  const handleShowFilter = () => {
    setShowFilter((prev) => !prev);
  };

  const handlePageChange = (value: any) => {
    setPage(value);
  };

// ✅✅✅ FIX: Collect ALL filter params including dynamic attribute filters
useEffect(() => {
  // Skip if no categoryId from URL
  if (!categoryId) return;

  const [minPrice, maxPrice] = searchParams.get("price")?.split("-") || [];
  
  // ✅✅✅ NEW: Collect ALL search params as filters (including dynamic attributes)
  const allFilterParams: Record<string, any> = {};
  
  // Known filter params
  if (searchParams.get("brand")) allFilterParams.brand = searchParams.get("brand");
  if (searchParams.get("color")) allFilterParams.color = searchParams.get("color");
  if (minPrice) allFilterParams.minPrice = Number(minPrice);
  if (maxPrice) allFilterParams.maxPrice = Number(maxPrice);
  if (searchParams.get("discount")) {
    allFilterParams.minDiscount = Number(searchParams.get("discount"));
  }
  
  // ✅✅✅ NEW: Collect dynamic attribute filters (ram, storage, size, etc.)
  // Exclude known params to get only attribute filters
  const knownParams = ['price', 'brand', 'color', 'discount', 'sort', 'page', 'category'];
  searchParams.forEach((value, key) => {
    if (!knownParams.includes(key) && value) {
      allFilterParams[key] = value; // e.g., ram: "8GB,16GB", storage: "128GB"
    }
  });

  const validSort = sort && ['price_low', 'price_high'].includes(sort) ? sort : '';
  
  console.log('📡 [PRODUCTS] Sending filters to API:', {
    category: categoryId,
    sort: validSort,
    page: page - 1,
    locationFilter,  // ✅ Log location filter
    filters: allFilterParams
  });

  // ✅ Send ALL filters to API
  dispatch(getAllProducts({ 
    category: categoryId,  // ObjectId for products API
    sort: validSort, 
    pageNumber: page - 1,
    locationFilter,  // ✅ Pass location filter from Redux
    ...allFilterParams  // ✅ Spread all filter params
  }));
}, [searchParams, categoryId, sort, page, dispatch, locationFilter]); // ✅ Dependencies trigger re-fetch on filter change

// ✅ NEW: Reset to page 1 when locationFilter changes
useEffect(() => {
  if (locationFilter) {
    setPage(1);  // Reset to first page when district/location changes
  }
}, [locationFilter]);
  // ✅ Safe products array getter
  const productsToRender = products.products || [];

  return (
    <div className="-z-10 mt-10">
      <div className="">
        <h1 className="text-3xl text-center font-bold text-gray-700 pb-5 px-9 uppercase space-x-2">
          {categoryName}
        </h1>
      </div>
      <div className="lg:flex">
        <section className="hidden lg:block w-[20%]">
          {/* Pass categorySlug (slug) to FilterSection for attributes API */}
          <FilterSection categoryId={categorySlug} />
        </section>
        <div className="w-full lg:w-[80%] space-y-5">
          <div className="flex justify-between items-center px-9 h-[40px]">
            <div className="relative w-[50%]">
              {!isLarge && (
                <IconButton onClick={handleShowFilter}>
                  <FilterAltIcon />
                </IconButton>
              )}
              {showFilter && !isLarge && (
                <Box sx={{ zIndex: 3 }} className="absolute top-[60px]">
                  <FilterSection categoryId={categorySlug} />
                </Box>
              )}
            </div>
            <FormControl size="small" sx={{ width: "200px" }}>
              <InputLabel id="sort">Sort</InputLabel>
              <Select
                labelId="sort"
                id="sort"
                value={sort}
                label="Sort"
                onChange={handleSortProduct}
              >
                <MenuItem value={"price_low"}>Price : Low - High</MenuItem>
                <MenuItem value={"price_high"}>Price : High - Low</MenuItem>
              </Select>
            </FormControl>
          </div>
          <Divider />

          {/* Loading state */}
          {products.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
              <CircularProgress />
            </Box>
          ) : productsToRender.length > 0 ? (
            <section
              className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-5 px-5 justify-center"
            >
              {productsToRender.map((item: any) => (
                <div key={item._id}>
                  <ProductCard item={item} categoryId={categoryId} />
                </div>
              ))}
            </section>
          ) : (
            <section className="items-center flex flex-col gap-5 justify-center h-[67vh] border">
              <img
                className="w-80"
                src="https://cdn.pixabay.com/photo/2022/05/28/10/45/oops-7227010_960_720.png"
                alt="No products found"
              />
              <h1 className="font-bold text-xl text-center flex items-center gap-2">
                Product Not Found For{" "}
                <p className="text-primary-color flex gap-2 uppercase">
                  {categoryName}
                </p>
              </h1>
            </section>
          )}

          {/* Pagination */}
          {products.totalPages > 1 && (
            <div className="flex justify-center pt-10">
              <Pagination
                page={page}
                onChange={(e, value) => handlePageChange(value)}
                color="primary"
                count={products.totalPages || 1}
                shape="rounded"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;