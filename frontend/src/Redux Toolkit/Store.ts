// D:\Mani\Code with Zosh\Backup\source code\frontend\src\Redux Toolkit\Store.ts
import {
  configureStore,
  combineReducers,
} from "@reduxjs/toolkit";
import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";

// Customer slices
import AuthSlice from "./Customer/AuthSlice";
import UserSlice from "./Customer/UserSlice";
import ProductSlice from "./Customer/ProductSlice";
import CartSlice from "./Customer/CartSlice";
import OrderSlice from "./Customer/OrderSlice";
import ReturnSlice from "./Customer/ReturnSlice"; 
import CouponSlice from "./Customer/CouponSlice";
import ReviewSlice from "./Customer/ReviewSlice";
import WishlistSlice from "./Customer/WishlistSlice";
import AiChatBotSlice from "./Customer/AiChatBotSlice";
import CustomerSlice from "./Customer/Customer/CustomerSlice";

// Seller slices
import sellerSlice from "./Seller/sellerSlice";
import sellerAuthenticationSlice from "./Seller/sellerAuthenticationSlice";
import sellerProductSlice from "./Seller/sellerProductSlice";
import sellerOrderSlice from "./Seller/sellerOrderSlice";
import payoutSlice from "./Seller/payoutSlice";
import transactionSlice from "./Seller/transactionSlice";
import revenueChartSlice from "./Seller/revenueChartSlice";
import replacementsReducer from "./Seller/ReplacementSlice";

// Admin slices
import AdminCouponSlice from "./Admin/AdminCouponSlice";
import DealSlice from "./Admin/DealSlice";
import AdminSlice from "./Admin/AdminSlice";
import categoryReducer from "./Admin/CategorySlice";
import electronicCategoryReducer from "./Admin/ElectronicCategorySlice";
import categoryAttributeReducer from "./Admin/CategoryAttributeSlice"; // ✅ ADD THIS

const rootReducer = combineReducers({
  // Customer
  auth: AuthSlice,
  user: UserSlice,
  products: ProductSlice,
  cart: CartSlice,
  orders: OrderSlice,
    returns: ReturnSlice,
  coupon: CouponSlice, 
  review: ReviewSlice,
  wishlist: WishlistSlice,
  aiChatBot: AiChatBotSlice,
  homePage: CustomerSlice,

  // Seller
  sellers: sellerSlice,
  sellerAuth: sellerAuthenticationSlice,
  sellerProduct: sellerProductSlice,
  sellerOrder: sellerOrderSlice,
  payouts: payoutSlice,
  transaction: transactionSlice,
  revenueChart: revenueChartSlice,
  replacements: replacementsReducer,
  
  // Admin
  adminCoupon: AdminCouponSlice,
  deal: DealSlice, 
  admin: AdminSlice,
  category: categoryReducer,
  electronicCategories: electronicCategoryReducer,
  categoryAttribute: categoryAttributeReducer, 

});

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, 
    }),
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof rootReducer>;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;