// D:\Mani\Code with Zosh\Backup\source code\frontend\src\customer\pages\Cart\PricingCard.tsx
import { Divider } from "@mui/material";
import {
  sumCartItemMrpPrice,
  sumCartItemSellingPrice,
} from "../../../util/cartCalculator";
import { useAppSelector } from "../../../Redux Toolkit/Store";

const PricingCard = () => {
  const cart = useAppSelector((state) => state.cart);
  
  // ✅ Fee constants - all set to 0 for free shipping & no platform fee
  const SHIPPING_FEE = 0;
  const PLATFORM_FEE = 7;
  
  // ✅ Calculate total: selling price only (no extra fees)
  const totalAmount = cart.cart?.totalSellingPrice || 0;

  // ✅ Calculate discount for display
  const discount = sumCartItemMrpPrice(cart.cart?.cartItems || []) -
                   sumCartItemSellingPrice(cart.cart?.cartItems || []);

 return (
  <div>
    <div className="space-y-3 p-5">
      {/* Subtotal (MRP) */}
      <div className="flex justify-between items-center">
        <span>Subtotal</span>
        <span>₹ {cart.cart?.totalMrpPrice || 0}</span>
      </div>
      
      {/* Discount */}
      <div className="flex justify-between items-center">
        <span>Discount</span>
        <span>₹ {discount || 0}</span>
      </div>
      
      {/* ✅ Show shipping only if fee > 0 */}
      {SHIPPING_FEE > 0 && (
        <div className="flex justify-between items-center">
          <span>Shipping</span>
          <span>₹ {SHIPPING_FEE}</span>
        </div>
      )}
      
      {/* ✅ Platform fee row - ALWAYS show since it's ₹7 */}
      <div className="flex justify-between items-center">
        <span>Platform fee</span>
        <span>₹ {PLATFORM_FEE}</span>  {/* ✅ Shows: ₹ 7 */}
      </div>
    </div>
    
    <Divider />

    {/* Total */}
    <div className="font-medium px-5 py-2 flex justify-between items-center">
      <span>Total</span>
      <span>₹ {totalAmount}</span>  {/* ✅ Includes ₹7 platform fee */}
    </div>
  </div>
);
};

export default PricingCard;