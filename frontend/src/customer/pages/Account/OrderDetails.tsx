// D:\Mani\Code with Zosh\Backup\source code\frontend\src\customer\pages\Account\OrderDetails.tsx
import {
  Box,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Typography,
  Chip,
  Card,
  Avatar,
  Rating
} from '@mui/material';
import { useEffect, useState } from 'react';
import PaymentsIcon from '@mui/icons-material/Payments';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { Replay, AccountBalanceWallet } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../Redux Toolkit/Store';
import { cancelOrder, fetchOrderById, fetchOrderItemById } from '../../../Redux Toolkit/Customer/OrderSlice';
import { fetchReviewsByProductId } from '../../../Redux Toolkit/Customer/ReviewSlice';
import { fetchSellerReviews } from '../../../Redux Toolkit/Customer/SellerReviewSlice';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import type { ReturnRequest } from '../../../types/orderTypes';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import StarIcon from '@mui/icons-material/Star';
import OrderStepper from './OrderStepper';


// Helper function to format date and time
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
        if (value === null || value === undefined || value === '') return;
        const stringValue = String(value).trim();
        if (!stringValue) return;
        const formattedLabel = key
          .replace(/_/g, ' ')
          .replace(/([A-Z])/g, ' $1')
          .trim()
          .replace(/^\w/, c => c.toUpperCase());
        specs.push({ label: formattedLabel, value: stringValue });
      });
      if (specs.length > 0) return specs;
    }
  }

  if (product.variants && orderItem?.size) {
    const orderColor = orderItem.size.trim();
    const matchingVariant = product.variants.find((v: any) =>
      v.color?.toLowerCase() === orderColor.toLowerCase() && v.isActive !== false
    );
    if (matchingVariant?.specifications) {
      Object.entries(matchingVariant.specifications).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') return;
        const stringValue = String(value).trim();
        if (!stringValue) return;
        const formattedLabel = key
          .replace(/_/g, ' ')
          .replace(/([A-Z])/g, ' $1')
          .trim()
          .replace(/^\w/, c => c.toUpperCase());
        specs.push({ label: formattedLabel, value: stringValue });
      });
      if (matchingVariant.color && !specs.some(s => s.label.toLowerCase() === 'color')) {
        specs.push({ label: 'Color', value: matchingVariant.color });
      }
      if (specs.length > 0) return specs;
    }
    if (matchingVariant?.color) {
      return [{ label: 'Color', value: matchingVariant.color }];
    }
  }

  if (orderItem?.size && orderItem.size !== 'Default') {
    if (orderItem.size.includes('+')) {
      return orderItem.size.split('+').map((part: string, idx: number) => {
        const trimmed = part.trim();
        const match = trimmed.match(/^(\d+\s*[A-Za-z]+)\s*(.*)$/);
        if (match) {
          return { label: match[2] || `Spec ${idx + 1}`, value: match[1] };
        }
        return { label: `Spec ${idx + 1}`, value: trimmed };
      });
    }
    return [{ label: 'Variant', value: orderItem.size }];
  }

  return [];
};

const OrderDetails = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { orderItemId, orderId } = useParams();

  const orders = useAppSelector((state) => state.orders);
  const reviewState = useAppSelector((state) => state.review);
  const sellerReviewState = useAppSelector((state) => state.sellerReview);
  const currentUser = useAppSelector((state: any) => state.user.user);

  const [showAllUpdates, setShowAllUpdates] = useState(false);

  // Fetch order data
  useEffect(() => {
    if (orderItemId && orderId) {
      dispatch(fetchOrderItemById({ orderItemId, jwt: localStorage.getItem("jwt") || "" }));
      dispatch(fetchOrderById({ orderId, jwt: localStorage.getItem("jwt") || "" }));
    }
  }, [dispatch, orderId, orderItemId]);

  const item = orders.orderItem;

  // Fetch product reviews
  useEffect(() => {
    if (item?.product?._id) {
      dispatch(fetchReviewsByProductId({ productId: item.product._id }));
    }
  }, [dispatch, item?.product?._id]);

  // Fetch seller reviews
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

  // My product review
  const myReview = reviewState.reviews.find(
  (review: any) =>
    String(review.user?._id) === String(currentUser?._id) &&
    String(review.product?._id || review.product) ===
      String(item?.product?._id)
);

  // Seller reviews & my seller review
  const sellerReviews = sellerId
    ? sellerReviewState.reviewsBySeller[sellerId] || []
    : [];

  const mySellerReview = sellerReviews.find(
    (r: any) => String(r.user?._id) === String(currentUser?._id)
  );

  // Seller rating summary
  const sellerRatingCount = sellerReviews.length;
  const sellerRatingAvg =
    sellerRatingCount > 0
      ? (
        sellerReviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) /
        sellerRatingCount
      ).toFixed(1)
      : null;

  const handleCancelOrder = () => {
    if (orderId) dispatch(cancelOrder(orderId));
  };

  // Helper: Get return status for this order item
  const getItemReturnStatus = (): ReturnRequest | null => {
    return orders.orderItem?.returnRequest || null;
  };

  // Helper: Format return status display
  const getReturnStatusDisplay = (status: string) => {
    switch (status) {
      case 'PENDING': return { label: 'Pending Approval', color: '#FFA500' as const };
      case 'APPROVED': return { label: 'Approved - Awaiting Pickup', color: '#1E90FF' as const };
      case 'REJECTED': return { label: 'Rejected', color: '#FF0000' as const };
      case 'PICKED_UP': return { label: 'Picked Up - Processing', color: '#9C27B0' as const };
      case 'COMPLETED': return { label: 'Refunded to Wallet', color: '#32CD32' as const };
      case 'CANCELLED': return { label: 'Cancelled', color: '#999' as const };
      default: return { label: status, color: '#999' as const };
    }
  };

  // Check if any item has pending return (for cancel button logic)
  const hasPendingReturn = orders.currentOrder?.orderItems?.some(
    (item: any) => item.returnRequest?.status === 'PENDING'
  );

  return (
    <Box className='space-y-5 px-4 py-6'>
      {/* ── Product Header ── */}
      <section className='flex flex-col gap-5 justify-center items-center'>
        <img
          className='w-[100px] h-[100px] object-cover rounded border'
          src={imageUrl}
          alt={productTitle}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23f5f5f5"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="10" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
          }}
        />

        <div className='text-sm space-y-1 text-center'>
          <h1 className='font-bold'>{sellerName}</h1>
          <p>{productTitle}</p>

          {/* Dynamic Variant Specs */}
          {variantSpecs.length > 0 && (
            <div className='flex flex-wrap justify-center gap-1 mt-2'>
              {variantSpecs.map((spec, idx) => (
                <Chip
                  key={`${spec.label}-${idx}`}
                  label={`${spec.label}: ${spec.value}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.75rem' }}
                />
              ))}
            </div>
          )}

          {/* Return Status Badge */}
          {(() => {
            const returnReq = getItemReturnStatus();
            if (!returnReq) return null;
            const statusDisplay = getReturnStatusDisplay(returnReq.status);
            return (
              <Box
                sx={{
                  mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2,
                  border: '1px dashed', borderColor: statusDisplay.color, maxWidth: 400,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Replay fontSize="small" sx={{ color: statusDisplay.color }} />
                  <Typography variant="caption" fontWeight="bold" sx={{ color: statusDisplay.color }}>
                    Return: {statusDisplay.label}
                  </Typography>
                </Box>

                {returnReq.status === 'COMPLETED' && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                    <AccountBalanceWallet fontSize="small" color="success" />
                    <Typography variant="caption" color="success.main" fontWeight="medium">
                      ₹{returnReq.refundAmount} credited to wallet
                    </Typography>
                  </Box>
                )}

                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  Requested: {dayjs(returnReq.createdAt).format('MMM DD, YYYY')}
                </Typography>
              </Box>
            );
          })()}
        </div>


      </section>

      {/* ── Order Tracking Card ── */}
      <Card className="p-5">
        <div className="space-y-4">
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
                      {isShipped
                        ? "Shipped"
                        : isArriving
                          ? "Out For Delivery"
                          : isConfirmed
                            ? "Packed"
                            : isPending
                              ? "Pending"
                              : "Processing"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {isShipped
                        ? "Product shipped successfully"
                        : isArriving
                          ? "Your item is out for delivery"
                          : isConfirmed
                            ? "Your item packed successfully"
                            : "Order processing"}
                    </Typography>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* ── Reviews (only after delivery) ── */}
      {isDelivered && (
        <Card className="p-5 space-y-5">

          {/* PRODUCT REVIEW */}
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
                    <img
                      key={index}
                      src={image}
                      alt="review"
                      className="w-28 h-28 object-cover rounded-lg border"
                    />
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
              <Button
                variant="contained"
                onClick={() => navigate(`/reviews/${item?.product?._id}/create`)}
              >
                WRITE REVIEW
              </Button>
            </div>
          )}

          <Divider />

          {/* SELLER REVIEW */}
          {mySellerReview ? (
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
            <div className="border rounded-md p-5 flex flex-col items-start gap-3">
              <Typography variant="h6" fontWeight="bold">Review For Seller</Typography>
              <Typography variant="body2" color="text.secondary">
                Share your experience about {sellerName}
              </Typography>

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

      {/* ── Cancel Order Button ── */}
      {!isShipped &&
        !isDelivered &&
        !isArriving &&
        orders.currentOrder?.orderStatus !== "CANCELLED" && (
          <div className='p-10'>
            <Button
              disabled={hasPendingReturn}
              onClick={handleCancelOrder}
              color='error'
              sx={{ py: "0.7rem" }}
              variant='outlined'
              fullWidth
            >
              {hasPendingReturn
                ? "Return Request Pending"
                : "Cancel Order"}
            </Button>
          </div>
        )}
    </Box>
  );
};

export default OrderDetails;