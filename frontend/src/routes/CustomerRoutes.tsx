// D:\Mani\Code with Zosh\Backup\source code\frontend\src\routes\CustomerRoutes.tsx
import { Route, Routes } from 'react-router-dom'
import Home from '../customer/pages/Home/Home'
import Products from '../customer/pages/Products/Products'
import ProductDetails from '../customer/pages/Products/ProductDetails/ProductDetails'
import Cart from '../customer/pages/Cart/Cart'
import Address from '../customer/pages/Checkout/AddressPage'
import Profile from '../customer/pages/Account/Profile'
import Footer from '../customer/components/Footer/Footer'
import Navbar from '../customer/components/Navbar/Navbar'
import NotFound from '../customer/pages/NotFound/NotFound'
import Auth from '../customer/pages/Auth/Auth'
import { useAppDispatch, useAppSelector } from '../Redux Toolkit/Store'
import { fetchUserCart } from '../Redux Toolkit/Customer/CartSlice'
import PaymentSuccessHandler from '../customer/pages/Pyement/PaymentSuccessHandler'
import Reviews from '../customer/pages/Review/Reviews'
import WriteReviews from '../customer/pages/Review/WriteReview'
import Wishlist from '../customer/pages/Wishlist/Wishlist'
import { getWishlistByUserId } from '../Redux Toolkit/Customer/WishlistSlice'
import SearchProducts from '../customer/pages/Search/SearchProducts'
import { useEffect } from 'react'

// ✅ Public seller profile page (customer-facing)
import SellerProfile from '../customer/pages/Seller/SellerProfile'

// ✅ Customer writes a review for a seller (after delivery)
import SellerReviewForm from '../customer/pages/Review/SellerReviewForm'

const CustomerRoutes = () => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(state => state.auth);

  useEffect(() => {
    const jwt = auth.jwt || "";
    dispatch(fetchUserCart(jwt));
    if (jwt) {
      dispatch(getWishlistByUserId(jwt));
    }
  }, [auth.jwt, dispatch]);

  return (
    <>
      <Navbar />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/products/:categoryId' element={<Products />} />
        <Route path='/search-products' element={<SearchProducts />} />
        <Route path='/reviews/:productId' element={<Reviews />} />
        <Route path='/reviews/:productId/create' element={<WriteReviews />} />
        <Route path='/product-details/:categoryId/:name/:productId' element={<ProductDetails />} />
        <Route path='/cart' element={<Cart />} />
        <Route path='/wishlist' element={<Wishlist />} />
        <Route path='/checkout/address' element={<Address />} />
        <Route path='/account/*' element={<Profile />} />
        <Route path='/login' element={<Auth />} />
        <Route path='/payment-success' element={<PaymentSuccessHandler />} />

        {/* ✅ Public seller profile — navigated to from ProductDetails seller name click */}
        <Route path='/seller/:sellerId' element={<SellerProfile />} />

        {/* ✅ Customer writes a seller review from OrderDetails */}
        <Route path='/account/seller-review/:sellerId' element={<SellerReviewForm />} />

        <Route path='*' element={<NotFound />} />
      </Routes>
      <Footer />
    </>
  )
}

export default CustomerRoutes;