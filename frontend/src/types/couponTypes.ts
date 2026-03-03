import {type Cart } from "./cartTypes";

export interface Coupon {
  _id: string;
  code: string;
  discountPercentage: number;
  validityStartDate: string;
  validityEndDate: string;
  minimumOrderValue: number;
  isActive: boolean;
}

export interface CouponState {
  coupons: Coupon[];
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  couponCreated:boolean;
  couponApplied: boolean,
}
