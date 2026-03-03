import { useAppSelector } from '../../../Redux Toolkit/Store';
import WishlistProductCard from './WishlistProductCard';

const Wishlist = () => {
  const { wishlist, loading } = useAppSelector(state => state.wishlist);

  // Handle case where wishlist hasn't loaded yet
  if (loading && !wishlist) {
    return (
      <div className="h-[85vh] flex justify-center items-center">
        Loading your wishlist...
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
              <WishlistProductCard key={item._id} item={item} />
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