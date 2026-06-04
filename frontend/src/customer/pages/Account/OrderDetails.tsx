import {
  Alert,
  Button,
  Card,
  Chip,
  CircularProgress,
  Divider,
  Rating,
  Typography,
  Avatar,
} from "@mui/material";

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import PaymentsIcon from "@mui/icons-material/Payments";
import StorefrontIcon from "@mui/icons-material/Storefront";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import StarIcon from "@mui/icons-material/Star";

import dayjs from "dayjs";

import {
  cancelOrder,
  fetchOrderById,
  fetchOrderItemById,
} from "../../../Redux Toolkit/Customer/OrderSlice";

import { fetchReviewsByProductId } from "../../../Redux Toolkit/Customer/ReviewSlice";

import { fetchSellerReviews } from "../../../Redux Toolkit/Customer/SellerReviewSlice";

import {
  useAppDispatch,
  useAppSelector,
} from "../../../Redux Toolkit/Store";

import { selectUser } from "../../../Redux Toolkit/Customer/UserSlice";

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const formatDateTime = (dateString?: string) => {
  if (!dateString) return "N/A";
  return dayjs(dateString).format("MMM DD, YYYY - h:mm A");
};

const getProductImage = (orderItem: any): string => {
  const product = orderItem?.product;
  if (!product) return "https://via.placeholder.com/120";
  if (product?.variants && orderItem?.variantId) {
    const variant = product.variants.find(
      (v: any) => String(v._id) === String(orderItem.variantId)
    );
    if (variant?.images?.[0]) return variant.images[0];
  }
  if (product?.images?.[0]) return product.images[0];
  if (product?.variants?.[0]?.images?.[0]) return product.variants[0].images[0];
  return "https://via.placeholder.com/120";
};

const getSellerName = (orderItem: any): string => {
  const seller = orderItem?.product?.seller;
  if (typeof seller === "object" && seller) {
    return seller.businessDetails?.businessName || seller.sellerName || "Seller";
  }
  return "Seller";
};

// ✅ Extract seller _id from orderItem
const getSellerId = (orderItem: any): string | null => {
  const seller = orderItem?.product?.seller;
  if (typeof seller === "object" && seller?._id) return String(seller._id);
  if (typeof seller === "string") return seller;
  return null;
};

const getVariantSpecs = (orderItem: any): { label: string; value: string }[] => {
  const specs: { label: string; value: string }[] = [];
  const product = orderItem?.product;
  if (!product) return [];
  if (product.variants && orderItem.variantId) {
    const variant = product.variants.find(
      (v: any) => String(v._id) === String(orderItem.variantId)
    );
    if (variant?.specifications) {
      Object.entries(variant.specifications).forEach(([key, value]) => {
        if (!value) return;
        specs.push({
          label: key.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()),
          value: String(value),
        });
      });
    }
  }
  return specs;
};

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────
const OrderDetails = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { orderItemId, orderId } = useParams();

  const orders = useAppSelector((state) => state.orders);
  const reviewState = useAppSelector((state) => state.review);
  const sellerReviewState = useAppSelector((state) => state.sellerReview);
  const currentUser = useAppSelector(selectUser);

  const [showAllUpdates, setShowAllUpdates] = useState(false);

  // ✅ Fetch order data
  useEffect(() => {
    if (orderItemId && orderId) {
      dispatch(fetchOrderItemById({ orderItemId, jwt: localStorage.getItem("jwt") || "" }));
      dispatch(fetchOrderById({ orderId, jwt: localStorage.getItem("jwt") || "" }));
    }
  }, [dispatch, orderId, orderItemId]);

  const item = orders.orderItem;

  // ✅ Fetch product reviews
  useEffect(() => {
    if (item?.product?._id) {
      dispatch(fetchReviewsByProductId({ productId: item.product._id }));
    }
  }, [dispatch, item?.product?._id]);

  // ✅ Fetch seller reviews
  useEffect(() => {
    const sellerId = getSellerId(item);
    if (sellerId) {
      dispatch(fetchSellerReviews({ sellerId }));
    }
  }, [dispatch, item?.product?.seller]);

  // ─── Guards ───────────────────────────────
  if (orders.loading) {
    return (
      <div className="h-[80vh] flex justify-center items-center">
        <CircularProgress />
      </div>
    );
  }
  if (orders.error) {
    return (
      <div className="h-[80vh] flex justify-center items-center">
        <Alert severity="error">{orders.error}</Alert>
      </div>
    );
  }
  if (!orders.currentOrder || !orders.orderItem) {
    return (
      <div className="h-[80vh] flex justify-center items-center">
        <Alert severity="info">Order not found</Alert>
      </div>
    );
  }

  // ─── Derived values ───────────────────────
  const order = orders.currentOrder;
  const sellerName = getSellerName(item);
  const sellerId = getSellerId(item);
  const imageUrl = getProductImage(item);
  const variantSpecs = getVariantSpecs(item);
  const productTitle = item?.product?.title || "Product";
  const address = order?.shippingAddress;
  const isSelfPickup = order.fulfillmentType === "SELF_PICKUP";
  const discount = (item?.mrpPrice || 0) - (item?.sellingPrice || 0);

  const rawStatus = String(order?.orderStatus || "");
  const status = rawStatus === "DELIVERY" ? "DELIVERED" : rawStatus;
  const isDelivered = status === "DELIVERED";
  const isShipped = status === "SHIPPED";
  const isArriving = status === "ARRIVING";
  const isConfirmed = status === "CONFIRMED";
  const isPending = status === "PENDING";

  // ✅ My product review
  const myReview = reviewState.reviews.find(
    (review: any) => String(review.user?._id) === String(currentUser?._id)
  );

  // ✅ Seller reviews & my seller review
  const sellerReviews = sellerId
    ? sellerReviewState.reviewsBySeller[sellerId] || []
    : [];

  const mySellerReview = sellerReviews.find(
    (r) => String(r.user?._id) === String(currentUser?._id)
  );

  // ✅ Seller rating summary
  const sellerRatingCount = sellerReviews.length;
  const sellerRatingAvg =
    sellerRatingCount > 0
      ? (
          sellerReviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
          sellerRatingCount
        ).toFixed(1)
      : null;

  const handleCancelOrder = () => {
    if (orderId) dispatch(cancelOrder(orderId));
  };

  return (
    <div className="bg-[#f1f3f6] min-h-screen p-2 md:p-5">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── LEFT ─────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* PRODUCT CARD */}
          <Card className="p-5 rounded-md">
            <div className="flex flex-col md:flex-row gap-5">

              <div className="flex justify-center">
                <img
                  src={imageUrl}
                  alt={productTitle}
                  className="w-[130px] h-[130px] object-cover border rounded"
                />
              </div>

              <div className="flex-1">
                <Typography variant="h6" fontWeight="500">{productTitle}</Typography>

                {/* ✅ Seller name + rating badge */}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Typography variant="body2" color="text.secondary">
                    Seller: {sellerName}
                  </Typography>
                  {sellerRatingAvg && (
                    <span
                      style={{
                        background: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        borderRadius: 12,
                        padding: "1px 8px",
                        fontSize: 12,
                        color: "green",
                        fontWeight: "bold",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      {sellerRatingAvg} ★ ({sellerRatingCount})
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {variantSpecs.map((spec, index) => (
                    <Chip key={index} label={`${spec.label}: ${spec.value}`} size="small" />
                  ))}
                </div>

                <Typography variant="h6" fontWeight="bold" sx={{ mt: 2 }}>
                  ₹{item?.sellingPrice}
                </Typography>

                {/* TRACKING */}
                <div className="pt-5">
                  {isDelivered ? (
                    <>
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-green-600"></div>
                          <div className="w-[2px] h-10 bg-green-600"></div>
                        </div>
                        <div className="pb-4">
                          <Typography fontWeight="500">Order Confirmed</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {dayjs(order?.orderDate).format("MMM DD, YYYY")}
                          </Typography>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-green-600"></div>
                        </div>
                        <div>
                          <Typography fontWeight="500">Delivered</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {dayjs(order?.deliverDate).format("MMM DD, YYYY")}
                          </Typography>
                        </div>
                      </div>

                      <div className="pt-5">
                        <button
                          onClick={() => setShowAllUpdates(!showAllUpdates)}
                          className="text-[#2874f0] text-sm font-medium flex items-center gap-1 hover:underline"
                        >
                          {showAllUpdates ? "Hide Updates" : "See All Updates"}
                          <KeyboardArrowRightIcon sx={{ fontSize: 18 }} />
                        </button>
                      </div>

                      {showAllUpdates && (
                        <div className="mt-5 border-t pt-5 space-y-5">
                          {[
                            { label: "Order Confirmed", desc: "Your order has been placed.", date: order?.orderDate },
                            { label: "Shipped", desc: "Product shipped successfully", date: order?.updatedAt },
                            { label: "Out For Delivery", desc: "Your item is out for delivery", date: order?.deliverDate },
                            { label: "Delivered", desc: "Your item has been delivered", date: order?.deliverDate },
                          ].map((step, i, arr) => (
                            <div key={step.label} className="flex gap-4">
                              <div className="flex flex-col items-center">
                                <div className="w-3 h-3 rounded-full bg-green-600"></div>
                                {i < arr.length - 1 && <div className="w-[2px] h-16 bg-green-600"></div>}
                              </div>
                              <div>
                                <Typography fontWeight="500">{step.label}</Typography>
                                <Typography variant="body2" color="text.secondary">{step.desc}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {formatDateTime(step.date)}
                                </Typography>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-green-600"></div>
                          <div className="w-[2px] h-10 bg-green-600"></div>
                        </div>
                        <div className="pb-4">
                          <Typography fontWeight="500">Order Confirmed</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {dayjs(order?.orderDate).format("MMM DD, YYYY")}
                          </Typography>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-green-600"></div>
                        </div>
                        <div>
                          <Typography fontWeight="500">
                            {isShipped ? "Shipped" : isArriving ? "Out For Delivery" : isConfirmed ? "Packed" : isPending ? "Pending" : "Processing"}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {isShipped ? "Product shipped successfully" : isArriving ? "Your item is out for delivery" : isConfirmed ? "Your item packed successfully" : "Order processing"}
                          </Typography>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* ✅ REVIEWS (only after delivery) */}
          {isDelivered && (
            <Card className="p-5 space-y-5">

              {/* ── PRODUCT REVIEW ── */}
              {myReview ? (
                <div className="border rounded-md p-5 space-y-3">
                  <Typography variant="h6" fontWeight="bold">Your Product Review</Typography>
                  <div className="flex items-center gap-3">
                    <Rating value={myReview.rating || 0} readOnly />
                    <Typography variant="body2" color="text.secondary">{myReview.rating}/5</Typography>
                  </div>
                  <Typography variant="body1">{myReview.reviewText}</Typography>
                  {myReview.productImages?.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {myReview.productImages.map((image: string, index: number) => (
                        <img key={index} src={image} alt="review" className="w-28 h-28 object-cover rounded-lg border" />
                      ))}
                    </div>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    Reviewed on {dayjs(myReview.createdAt).format("MMM DD, YYYY")}
                  </Typography>
                </div>
              ) : (
                <div className="border rounded-md p-5 flex flex-col items-start gap-3">
                  <Typography variant="h6" fontWeight="bold">Review For Product</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Share your experience about this product
                  </Typography>
                  <Button variant="contained" onClick={() => navigate(`/reviews/${item?.product?._id}/create`)}>
                    WRITE REVIEW
                  </Button>
                </div>
              )}

              <Divider />

              {/* ── SELLER REVIEW ── */}
              {mySellerReview ? (
                /* ✅ SHOW EXISTING SELLER REVIEW */
                <div className="border rounded-md p-5 space-y-3">
                  <Typography variant="h6" fontWeight="bold">Your Seller Review</Typography>

                  <div className="flex items-center gap-3">
                    <Avatar sx={{ width: 36, height: 36, bgcolor: "#18c1b5", fontSize: 14 }}>
                      {mySellerReview.user?.fullName?.[0] || "U"}
                    </Avatar>
                    <div>
                      <Typography fontWeight="600" variant="body2">
                        {mySellerReview.user?.fullName || "You"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        for {sellerName}
                      </Typography>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Rating value={mySellerReview.rating || 0} readOnly size="small" />
                    <Typography variant="body2" color="text.secondary">
                      {mySellerReview.rating}/5
                    </Typography>
                  </div>

                  <Typography variant="body1">{mySellerReview.reviewText}</Typography>

                  {/* ✅ SELLER REVIEW IMAGES */}
                  {mySellerReview.images?.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {mySellerReview.images.map((img: string, idx: number) => (
                        <img
                          key={idx}
                          src={img}
                          alt="seller review"
                          className="w-28 h-28 object-cover rounded-lg border"
                        />
                      ))}
                    </div>
                  )}

                  <Typography variant="caption" color="text.secondary">
                    Reviewed on {dayjs(mySellerReview.createdAt).format("MMM DD, YYYY")}
                  </Typography>
                </div>
              ) : (
                /* ✅ NO SELLER REVIEW YET */
                <div className="border rounded-md p-5 flex flex-col items-start gap-3">
                  <Typography variant="h6" fontWeight="bold">Review For Seller</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Share your experience about {sellerName}
                  </Typography>

                  {/* ✅ Show other users' ratings if any */}
                  {sellerRatingAvg && (
                    <div className="flex items-center gap-2">
                      <StarIcon sx={{ color: "gold", fontSize: 18 }} />
                      <Typography variant="body2" fontWeight="bold" color="green">
                        {sellerRatingAvg}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ({sellerRatingCount} {sellerRatingCount === 1 ? "review" : "reviews"} from others)
                      </Typography>
                    </div>
                  )}

                  <Button
                    variant="contained"
                    sx={{ bgcolor: "#18c1b5", "&:hover": { bgcolor: "#0ea999" } }}
                    onClick={() => navigate(`/account/seller-review/${sellerId}`)}
                  >
                    WRITE REVIEW
                  </Button>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* ── RIGHT ────────────────────────────── */}
        <div className="space-y-4">

          <Card className="p-5">
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>Delivery details</Typography>
            <div className="space-y-4">
              <div className="flex gap-3">
                <LocationOnOutlinedIcon fontSize="small" />
                <Typography variant="body2">
                  {address?.address}, {address?.city}, {address?.state} - {address?.pinCode}
                </Typography>
              </div>
              <Divider />
              <div className="flex gap-3">
                <PersonOutlineOutlinedIcon fontSize="small" />
                <Typography variant="body2">{address?.name} {address?.mobile}</Typography>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>Price details</Typography>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span>Listing price</span><span>₹{item?.mrpPrice}</span></div>
              <div className="flex justify-between"><span>Special price</span><span>₹{item?.sellingPrice}</span></div>
              <div className="flex justify-between"><span>Total discount</span><span className="text-green-600">-₹{discount}</span></div>
              <Divider />
              <div className="flex justify-between font-bold"><span>Total amount</span><span>₹{item?.sellingPrice}</span></div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="border rounded-md p-3 flex items-center gap-2">
                {isSelfPickup ? <StorefrontIcon fontSize="small" /> : <PaymentsIcon fontSize="small" />}
                <Typography variant="body2">
                  {isSelfPickup ? "Pay On Pickup" : "Cash On Delivery"}
                </Typography>
              </div>
              <Button fullWidth variant="outlined" startIcon={<ReceiptLongOutlinedIcon />}>
                Download Invoice
              </Button>
            </div>
          </Card>

          <Card className="p-5">
            <Button
              fullWidth color="error" variant="outlined"
              onClick={handleCancelOrder}
              disabled={order?.orderStatus === "CANCELLED"}
            >
              {order?.orderStatus === "CANCELLED" ? "Order Cancelled" : "Cancel Order"}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;