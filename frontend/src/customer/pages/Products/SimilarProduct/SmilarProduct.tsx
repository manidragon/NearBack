// D:\Mani\Code with Zosh\Backup\source code\frontend\src\customer\pages\Products\SimilarProduct\SmilarProduct.tsx
import SimilarProductCard from "./SimilarProductCard";
import {
  useAppDispatch,
  useAppSelector,
} from "../../../../Redux Toolkit/Store";
import { useEffect } from "react";
import { getAllProducts } from "../../../../Redux Toolkit/Customer/ProductSlice";
import { useParams } from "react-router-dom";
// ✅✅✅ ADD THESE IMPORTS:
import { CircularProgress, Typography } from "@mui/material";

const SmilarProduct = () => {
  const products = useAppSelector((state) => state.products);
  const dispatch = useAppDispatch();
  const { categoryId } = useParams();

useEffect(() => {
  if (categoryId) {
    // ✅ Only fetch if NOT loading and NOT already loaded
    if (!products.loading && (!products.products || products.products.length === 0)) {
      dispatch(getAllProducts({ category: categoryId }));
    }
  }
}, [categoryId, dispatch, products.loading, products.products]);

  // ✅ Safe products array getter
  const productsToRender = products.products || [];

  return (
    <div>
      {products.loading ? (
        <div className="flex justify-center py-10">
          <CircularProgress />
        </div>
      ) : productsToRender.length > 0 ? (
        <div className="grid lg:grid-cols-6 md:grid-cols-4 sm:grid-cols-2 grid-cols-1 justify-between gap-4 gap-y-8">
          {productsToRender
            .filter((item) => item._id)  // ✅ Filter out invalid items
            .slice(0, 6)  // ✅ Limit to 6 similar products
            .map((item) => (
              <div key={item._id} className="">
                <SimilarProductCard product={item} />
              </div>
            ))}
        </div>
      ) : (
        <Typography variant="body2" color="text.secondary" align="center">
          No similar products found
        </Typography>
      )}
    </div>
  );
};

export default SmilarProduct;