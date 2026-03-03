// D:\Mani\Code with Zosh\Backup\source code\frontend\src\App.tsx
import './App.css';
import { ThemeProvider } from '@emotion/react';
import customeTheme from './Theme/customeTheme';
import { useEffect } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import SellerDashboard from './seller/pages/SellerDashboard/SellerDashboard';
import CustomerRoutes from './routes/CustomerRoutes';
import AdminDashboard from './admin/pages/Dashboard/Dashboard';
import SellerAccountVerification from './seller/pages/SellerAccountVerification';
import SellerAccountVerified from './seller/pages/SellerAccountVerified';
import { useAppDispatch, useAppSelector } from './Redux Toolkit/Store';
import { fetchSellerProfile } from './Redux Toolkit/Seller/sellerSlice';
import BecomeSeller from './customer/pages/BecomeSeller/BecomeSeller';
import AdminAuth from './admin/pages/Auth/AdminAuth';
import { fetchUserProfile, fetchUserAddresses } from './Redux Toolkit/Customer/UserSlice';
import { fetchUserCart as fetchCart } from './Redux Toolkit/Customer/CartSlice';
import { getWishlistByUserId as fetchWishlist } from './Redux Toolkit/Customer/WishlistSlice';
import { createHomeCategories } from './Redux Toolkit/Customer/Customer/AsyncThunk';
import { homeCategories } from './data/homeCategories';


function App() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const auth = useAppSelector((state) => state.auth); // customer auth
  const sellerAuth = useAppSelector((state) => state.sellerAuth); // seller auth
  const user = useAppSelector((state) => state.user);
  const seller = useAppSelector((state) => state.sellers.profile);

  useEffect(() => {
    dispatch(createHomeCategories(homeCategories));
  }, [dispatch]);

  // 🔑 Fetch public data (safe)
  useEffect(() => {
    const jwt = localStorage.getItem("jwt");
    if (!jwt) return;

    // Decode and validate JWT
    const getRoleFromToken = (token: string): { role: string | null; isValid: boolean } => {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log("JWT Payload:", payload);
        // Check if token is expired
        const currentTime = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < currentTime) {
          return { role: null, isValid: false }; // Expired
        }

        return {
          role: payload.role || null,
          isValid: true
        };
      } catch (error) {
        console.log("Invalid JWT format");
        return { role: null, isValid: false }; // Invalid token
      }
    };

    const { role, isValid } = getRoleFromToken(jwt);

    if (!isValid) {
      // Clear invalid/expired token
      localStorage.removeItem("jwt");
      return;
    }

    // ✅ CRITICAL FIX: Set auth state from JWT for ALL roles (including admin)
    dispatch({
      type: 'auth/signin/fulfilled',
      payload: { jwt, role: role || "ROLE_CUSTOMER" }
    });

    // ✅ Only fetch customer data for customers, not for admin
    if (role === "ROLE_CUSTOMER") {
      dispatch(fetchUserProfile({ jwt, navigate }));
      dispatch(fetchCart(jwt));
      dispatch(fetchWishlist(jwt));
      dispatch(fetchUserAddresses());
    } else if (role === "ROLE_SELLER") {
      dispatch(fetchSellerProfile(jwt));
    }
    // ✅ No data fetching for admin - prevents 403 errors
  }, [dispatch, navigate]);

  return (
    <ThemeProvider theme={customeTheme}>
      <div className='App'>
        <Routes>
          {seller && seller.role === "ROLE_SELLER" && (
            <Route path='/seller/*' element={<SellerDashboard />} />
          )}
          {/* ✅ FIXED: Check auth.role instead of user.user?.role */}
          {auth.role === "ROLE_ADMIN" && (
            <Route path='/admin/*' element={<AdminDashboard />} />
          )}
          <Route path='/verify-seller/:otp' element={<SellerAccountVerification />} />
          <Route path='/seller-account-verified' element={<SellerAccountVerified />} />
          <Route path='/become-seller' element={<BecomeSeller />} />
          <Route path='/admin-login' element={<AdminAuth />} />
          <Route path='*' element={<CustomerRoutes />} />
        </Routes>
      </div>
    </ThemeProvider>
  );
}

export default App;