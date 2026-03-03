import { Divider } from "@mui/material";
import {
  sumCartItemMrpPrice,
  sumCartItemSellingPrice,
} from "../../../util/cartCalculator";
import { useAppSelector } from "../../../Redux Toolkit/Store";

const PricingCard = () => {
  const cart = useAppSelector((state) => state.cart);
  
  // ✅ Define shipping fee as constant
  const SHIPPING_FEE = 60;
  const PLATFORM_FEE = 0; // Free
  
  // ✅ Calculate correct total: selling price + shipping + platform fee
  const totalAmount = (cart.cart?.totalSellingPrice || 0) + SHIPPING_FEE + PLATFORM_FEE;

  return (
    <div>
      <div className="space-y-3 p-5">
        <div className="flex justify-between items-center">
          <span>Subtotal</span>
          <span>₹ {cart.cart?.totalMrpPrice || 0}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Discount</span>
          <span>
            ₹{" "}
            {(sumCartItemMrpPrice(cart.cart?.cartItems || []) -
              sumCartItemSellingPrice(cart.cart?.cartItems || [])) || 0}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span>Shipping</span>
          <span>₹ {SHIPPING_FEE}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Platform fee</span>
          <span className="text-teal-600">Free</span>
        </div>
      </div>
      <Divider />

      <div className="font-medium px-5 py-2 flex justify-between items-center">
        <span>Total</span>
        {/* ✅ Display correct total with shipping */}
        <span>₹ {totalAmount}</span>
      </div>
    </div>
  );
};

export default PricingCard;