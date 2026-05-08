// D:\Mani\Code with Zosh\Backup\source code\frontend\src\customer\pages\Wishlist\Wishlist.tsx

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../Redux Toolkit/Store';
import { getWishlistByUserId } from '../../../Redux Toolkit/Customer/WishlistSlice';
import WishlistProductCard from './WishlistProductCard';

const Wishlist = () => {
  const dispatch = useAppDispatch();
  const { wishlist, loading, error } = useAppSelector(state => state.wishlist);

  // ✅ FIX: Fetch wishlist on mount
  useEffect(() => {
    const jwt = localStorage.getItem('jwt');
    if (jwt) {
      dispatch(getWishlistByUserId(jwt));
    }
  }, [dispatch]);

  // Handle loading state
  if (loading && !wishlist) {
    return (
      <div className="h-[85vh] flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
        <span className="ml-2">Loading your wishlist...</span>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="h-[85vh] flex justify-center items-center">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  // Safe check: ensure wishlist and products exist
  const products = wishlist?.products || [];

  return (
    <div className="h-[85vh] p-5 lg:p-20">
      {products.length > 0 ? (
        <section>
          <h1>
            <strong>My Wishlist</strong> {products.length} items
          </h1>
          <div className="pt-10 flex flex-wrap gap-5">
            {products.map((item) => (
              // ✅ FIX: Use composite key for stability
              <WishlistProductCard key={item._id || item.title} item={item} />
            ))}
          </div>
        </section>
      ) : (
        <div className="h-full flex justify-center items-center flex-col">
          <div className="text-center py-5">
            <h1 className="text-lg font-medium">Hey, it feels so light!</h1>
            <p className="text-gray-500 text-sm">
              There is nothing in your wishlist. Let's add some items!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wishlist;