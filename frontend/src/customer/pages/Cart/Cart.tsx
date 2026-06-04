// D:\Mani\Code with Zosh\Backup\source code\frontend\src\customer\pages\Cart\Cart.tsx
import {
  Alert,
  Button,
  IconButton,
  Snackbar,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";

import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import { teal } from "@mui/material/colors";
import FavoriteIcon from "@mui/icons-material/Favorite";
import CartItemCard from "./CartItemCard";
import { useNavigate } from "react-router-dom";
import PricingCard from "./PricingCard";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { fetchUserCart } from "../../../Redux Toolkit/Customer/CartSlice";
import type { CartItem } from "../../../types/cartTypes";
import { applyCoupon } from "../../../Redux Toolkit/Customer/CouponSlice";
import { Close } from "@mui/icons-material";

const Cart = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const cart = useAppSelector((store) => store.cart);
  const auth = useAppSelector((store) => store.auth);

  // ✅ FIX 1: Safe selector with fallback for coupon slice
  const couponState = useAppSelector((store) => store.coupon) || {
    couponApplied: false,
    error: null,
    message: null
  };

  const [couponCode, setCouponCode] = useState("");
  const [snackbarOpen, setOpenSnackbar] = useState(false);

  useEffect(() => {
    const jwt = localStorage.getItem("jwt");
    if (jwt) {
      // ✅ Force fresh fetch on mount and when auth changes
      dispatch(fetchUserCart(jwt));
    }
  }, [dispatch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCouponCode(e.target.value);
  };

  const handleApplyCoupon = (apply: string) => {
    const code = apply === "false" ? cart.cart?.couponCode || "" : couponCode;

    dispatch(
      applyCoupon({
        apply,
        code,
        orderValue: cart.cart?.totalSellingPrice || 100,
        jwt: localStorage.getItem("jwt") || "",
      })
    );
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  // ✅ FIX 2: Safe useEffect with optional chaining
  useEffect(() => {
    // ✅ Use optional chaining + nullish coalescing
    if (couponState?.couponApplied || couponState?.error) {
      setOpenSnackbar(true);
      if (couponState?.couponApplied) {
        setCouponCode("");
      }
    }
  }, [couponState?.couponApplied, couponState?.error]); // ✅ Safe deps

  // ✅ FIX 3: Safe cart items fallback
  const cartItems = cart?.cart?.cartItems || [];

  return (
    <>
      {cartItems.length > 0 ? (
        <div className="pt-10 px-5 sm:px-10 md:px-60 lg:px-60 min-h-screen">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-3">
              {/* ✅ FIX: Use fallback key if _id is missing */}
             {cartItems.map((item: CartItem, index: number) => {
  // ✅ Generate unique key with updatedAt to force re-render on quantity changes
  const uniqueKey = item._id 
    ? `${String(item._id)}-${item.updatedAt || index}`
    : `cart-item-${index}-${item.product?._id || 'unknown'}`;
  
  return <CartItemCard key={uniqueKey} item={item} />;
})}
            </div>

            <div className="col-span-1 text-sm space-y-3">
              <div className="border rounded-md px-5 py-3 space-y-5">
                <div className="flex gap-3 text-sm items-center">
                  <LocalOfferIcon sx={{ color: teal[600], fontSize: "17px" }} />
                  <span>Apply Coupons</span>
                </div>

                {/* ✅ FIX 4: Safe coupon code check */}
                {!cart.cart?.couponCode ? (
                  <div className="flex justify-between items-center">
                    <TextField
                      value={couponCode}
                      onChange={handleChange}
                      placeholder="coupon code"
                      size="small"
                    />
                    <Button
                      onClick={() => handleApplyCoupon("true")}
                      disabled={!couponCode.trim()}
                      size="small"
                    >
                      Apply
                    </Button>
                  </div>
                ) : (
                  <div className="flex">
                    <div className="p-1 pl-5 pr-3 border rounded-full flex gap-2 items-center">
                      <span>{cart.cart.couponCode} Applied</span>
                      <IconButton
                        onClick={() => handleApplyCoupon("false")}
                        size="small"
                      >
                        <Close className="text-red-600" />
                      </IconButton>
                    </div>
                  </div>
                )}
              </div>

              <section className="border rounded-md">
                <PricingCard />
                <div className="p-5">
                  <Button
                    onClick={() => navigate("/checkout/address")}
                    sx={{ py: "11px" }}
                    variant="contained"
                    fullWidth
                  >
                    BUY NOW
                  </Button>
                </div>
              </section>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-[85vh] flex justify-center items-center flex-col">
          <div className="text-center py-5">
            <h1 className="text-lg font-medium">Hey, it feels so light!</h1>
            <p className="text-gray-500 text-sm">
              There is nothing in your bag. Let's add some items!
            </p>
          </div>
          <Button variant="outlined" sx={{ py: "11px" }}>
            Add Item From Wishlist
          </Button>
        </div>
      )}

      {/* ✅ FIX 5: Safe snackbar with optional chaining */}
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={couponState?.error ? "error" : "success"}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {couponState?.error || "Coupon applied successfully"}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Cart;