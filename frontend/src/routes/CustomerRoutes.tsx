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


const CustomerRoutes = () => {
  const dispatch = useAppDispatch()
  const auth = useAppSelector(state => state.auth);

  useEffect(() => {
    // ✅ FIXED: Get JWT from auth state (source of truth)
    const jwt = auth.jwt || "";
    
    // Fetch cart with JWT (handles empty string gracefully)
    dispatch(fetchUserCart(jwt));
    
    // ✅ ONLY fetch wishlist if we have a valid JWT
    if (jwt) {
      dispatch(getWishlistByUserId(jwt)); // 👈 Pass JWT token here
    }
  }, [auth.jwt, dispatch]); // ✅ Added dispatch to dependencies (best practice)

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
        <Route path='/login' element={<Auth/>} />
        <Route path='/payment-success/:orderId' element={<PaymentSuccessHandler/>} />
        <Route path='*' element={<NotFound />} />
      </Routes>
      <Footer />
    </>
  )
}

export default CustomerRoutes