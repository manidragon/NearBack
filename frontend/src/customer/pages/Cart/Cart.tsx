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

  // ⚠️ Make sure this name matches your store (coupone or coupon)
  const coupone = useAppSelector((store) => store.coupon);

  const [couponCode, setCouponCode] = useState("");
  const [snackbarOpen, setOpenSnackbar] = useState(false);

  // Fetch cart data
  useEffect(() => {
    const jwt = localStorage.getItem("jwt");
    if (jwt) {
      dispatch(fetchUserCart(jwt));
    }
  }, [dispatch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCouponCode(e.target.value);
  };

  const handleApplyCoupon = (apply: string) => {
    const code =
      apply === "false" ? cart?.cart?.couponCode || "" : couponCode;

    dispatch(
      applyCoupon({
        apply,
        code,
        orderValue: cart?.cart?.totalSellingPrice || 100,
        jwt: localStorage.getItem("jwt") || "",
      })
    );
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  // Snackbar trigger
  useEffect(() => {
    if (coupone?.couponApplied || coupone?.error) {
      setOpenSnackbar(true);
      if (coupone?.couponApplied) {
        setCouponCode("");
      }
    }
  }, [coupone?.couponApplied, coupone?.error]);

  // Safe fallback
  const cartItems = cart?.cart?.cartItems || [];

  return (
    <>
      {cartItems.length > 0 ? (
        <div className="pt-10 px-5 sm:px-10 md:px-60 lg:px-60 min-h-screen">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-3">
              {cartItems.map((item: CartItem) => (
                <CartItemCard key={item._id} item={item} />
              ))}
            </div>

            {/* Right Section */}
            <div className="col-span-1 text-sm space-y-3">

              {/* Coupon Section */}
              <div className="border rounded-md px-5 py-3 space-y-5">
                <div className="flex gap-3 text-sm items-center">
                  <LocalOfferIcon sx={{ color: teal[600], fontSize: "17px" }} />
                  <span>Apply Coupons</span>
                </div>

                {!cart?.cart?.couponCode ? (
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
                      <span>{cart?.cart?.couponCode} Applied</span>
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

              {/* Pricing */}
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
        // ✅ Empty Cart (Button removed)
        <div className="h-[85vh] flex justify-center items-center flex-col">
          <div className="text-center py-5">
            <h1 className="text-lg font-medium">Hey, it feels so light!</h1>
            <p className="text-gray-500 text-sm">
              There is nothing in your bag. Let's add some items!
            </p>
          </div>
        </div>
      )}

      {/* Snackbar */}
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={coupone?.error ? "error" : "success"}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {coupone?.error
            ? coupone.error
            : "Coupon applied successfully"}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Cart;