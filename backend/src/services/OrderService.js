// D:\Mani\Code with Zosh\Backup\source code\backend\src\services\OrderService.js
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Address = require("../models/Address");
const User = require("../models/User");
const OrderItem = require("../models/OrderItem");
const CartService = require("../services/CartService");
const OrderError = require("../exceptions/OrderError");
const OrderStatus = require("../domain/OrderStatus");
const PaymentStatus = require("../domain/PaymentStatus");
const mongoose = require("mongoose");
const TransactionService = require("./TransactionService");
const Seller = require("../models/Seller");
const SellerReportService = require("./SellerReportService");
const Transaction = require("../models/Transaction");

class OrderService {
  async createOrder(user, shippingAddress, cart, fulfillmentType = 'DELIVERY', pickupTime = null, paymentMethod = 'RAZORPAY') {
    try {
      // Validate cart is not empty
      if (!cart || !cart.cartItems || cart.cartItems.length === 0) {
        throw new OrderError("Cannot create order: cart is empty");
      }

      let addressDoc = null;

      // Handle address based on fulfillment type
      if (fulfillmentType === 'SELF_PICKUP') {
        // For self-pickup, we don't need user shipping address
        // Address will be set per seller later
      } else {
        // Existing delivery address logic
        if (shippingAddress._id) {
          const userHasAddress = user.addresses.some(addr => {
            const addrId = typeof addr === 'object' ? addr._id : addr;
            return addrId.toString() === shippingAddress._id.toString();
          });

          if (!userHasAddress) {
            throw new OrderError("Invalid shipping address: not associated with user");
          }

          addressDoc = await Address.findById(shippingAddress._id);
          if (!addressDoc) {
            throw new OrderError("Shipping address not found");
          }
        } else {
          try {
            addressDoc = await Address.create(shippingAddress);
            const addressExists = user.addresses.some(addr => {
              const addrId = typeof addr === 'object' ? addr._id : addr;
              return addrId.toString() === addressDoc._id.toString();
            });

            if (!addressExists) {
              user.addresses.push(addressDoc._id);
              await User.findByIdAndUpdate(user._id, { addresses: user.addresses });
            }
          } catch (addressError) {
            throw new OrderError(`Failed to create shipping address: ${addressError.message}`);
          }
        }
      }

      const itemsBySeller = cart.cartItems.reduce((acc, item) => {
        // ✅ Null safety: check if product and seller exist
        if (!item.product || !item.product.seller || !item.product.seller._id) {
          console.error("⚠️ Cart item missing product/seller:", {
            itemId: item._id,
            productId: item.product?._id,
            sellerId: item.product?.seller?._id
          });
          // Skip this item or throw error based on your business logic
          return acc;
        }

        const sellerId = item.product.seller._id.toString();

        if (!acc[sellerId]) {
          acc[sellerId] = [];
        }
        acc[sellerId].push(item);
        return acc;
      }, {});

      // ✅ Check if we have any valid items to process
      if (Object.keys(itemsBySeller).length === 0) {
        throw new OrderError("No valid cart items found for order creation");
      }

      const orders = [];

      for (const [sellerId, cartItems] of Object.entries(itemsBySeller)) {
        // ✅ FIXED: Prices are already totals, no need to multiply by quantity
        const totalMrpPrice = cartItems.reduce(
          (sum, item) => sum + item.mrpPrice,
          0
        );
        const totalSellingPrice = cartItems.reduce(
          (sum, item) => sum + item.sellingPrice,
          0
        );
        const totalItemCount = cartItems.reduce(
          (sum, item) => sum + item.quantity,
          0
        );

        // Create order items first
        const orderItemIds = [];
        for (const cartItem of cartItems) {
          const orderItem = new OrderItem({
            product: cartItem.product._id,
            size: cartItem.size,
            quantity: cartItem.quantity,
            mrpPrice: cartItem.mrpPrice,
            sellingPrice: cartItem.sellingPrice,
            userId: user._id
          });
          const savedOrderItem = await orderItem.save();
          orderItemIds.push(savedOrderItem._id);
        }

        // Handle shipping address for this seller
        let finalShippingAddress = null;
        if (fulfillmentType === 'SELF_PICKUP') {
          // Use seller's pickup address
          const seller = await Seller.findById(sellerId).populate('pickupAddress');
          if (!seller || !seller.pickupAddress) {
            throw new OrderError("Seller pickup address not available for self-pickup");
          }
          finalShippingAddress = seller.pickupAddress._id;
        } else {
          // ✅ Null safety for addressDoc
          if (!addressDoc?._id) {
            throw new OrderError("Address document is missing _id");
          }
          finalShippingAddress = addressDoc._id;
        }

        // ✅ FIX: Set order status to PLACED for ALL orders (both delivery and self-pickup)
        const orderStatus = OrderStatus.PLACED; // 👈 Changed from conditional logic

        // Set deliver date (sooner for pickup)
        const deliverDate = fulfillmentType === 'SELF_PICKUP'
          ? new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        // ✅ Set pickup time (only for self-pickup orders)
        const orderPickupTime = fulfillmentType === 'SELF_PICKUP' ? pickupTime : null;

       // ✅ Determine initial payment status based on payment method
const initialPaymentStatus = paymentMethod === 'WALLET' 
    ? PaymentStatus.COMPLETED   // ✅ Wallet payment is instant
    : PaymentStatus.PENDING;    // COD/Razorpay start as pending

// Create order - sellerId must be ObjectId
const newOrder = new Order({
    user: user._id,
    seller: new mongoose.Types.ObjectId(sellerId),
    totalMrpPrice,
    totalSellingPrice,
    totalItem: totalItemCount,
    shippingAddress: finalShippingAddress,
    orderStatus: orderStatus,
    fulfillmentType: fulfillmentType,
    paymentStatus: initialPaymentStatus,  // ✅ Smart payment status
    paymentMethod: paymentMethod,
    orderItems: orderItemIds,
    orderDate: new Date(),
    deliverDate: deliverDate,
    pickupTime: orderPickupTime
});

        const savedOrder = await newOrder.save();

        // ✅ NEW: Create transaction immediately for COD orders
        if (paymentMethod === 'CASH_ON_DELIVERY') {
          try {
            await TransactionService.createTransaction(savedOrder._id, {
              paymentStatus: 'PENDING',  // ✅ CORRECT - pending until delivery
              paymentMethod: 'CASH_ON_DELIVERY',
              razorpayPaymentId: null,
              razorpayOrderId: null
            });
            console.log("✅ COD Transaction created (PENDING) for order:", savedOrder._id);
          } catch (txErr) {
            console.error("⚠️ Failed to create COD transaction:", txErr.message);
          }
        }

        orders.push(savedOrder);
      }

      return orders;

    } catch (error) {
      console.log("Order creation error:", error);
      if (error instanceof OrderError) {
        throw error;
      }
      throw new OrderError(`Failed to create order: ${error.message}`);
    }
  }

  async findOrderById(orderId) {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new OrderError("Invalid Order ID");
    }

    const order = await Order.findById(orderId).populate([
      {
        path: "seller",
        populate: {
          path: "pickupAddress"
        }
      },
      { path: "shippingAddress" },
      {
        path: "orderItems",
        populate: [
          {
            path: "product",
            populate: {
              path: "seller",
              populate: { path: "pickupAddress" }
            }
          },
          {
            path: "returnRequest",
            select: "status refundStatus refundMethod refundAmount razorpayRefundId createdAt completedAt"
          },
          {
            path: "replacementRequest",
            select: "status reason replacementVariant replacementOrder"
          }
        ]
      },
    ]);

    if (!order) {
      throw new OrderError(`Order not found with id ${orderId}`);
    }
    return order;
  }

  async findOrderItemById(orderItemId) {
    if (!mongoose.Types.ObjectId.isValid(orderItemId)) {
      throw new OrderError("Invalid Order Item ID");
    }

    const orderItem = await OrderItem.findById(orderItemId).populate([
      { path: "product", populate: { path: "seller" } },
    ]);

    if (!orderItem) {
      throw new OrderError(`Order item not found with id ${orderItemId}`);
    }
    return orderItem;
  }

  async usersOrderHistory(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new OrderError("Invalid User ID");
    }

    return await Order.find({ user: userId })
      .sort({ orderDate: -1 })
      .populate([
        {
          path: "seller",
          populate: {
            path: "pickupAddress"
          }
        },
        { path: "shippingAddress" },
        {
          path: "orderItems",
          populate: [
            {
              path: "product",
              populate: {
                path: "seller",
                populate: { path: "pickupAddress" }
              }
            },
            {
              path: "returnRequest",
              select: "status refundStatus refundMethod refundAmount razorpayRefundId createdAt completedAt"
            },
            {
              path: "replacementRequest",
              select: "status reason replacementVariant replacementOrder"
            }
          ]
        },
      ]);
  }

  async getShopsOrders(sellerId) {
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      throw new OrderError("Invalid Seller ID");
    }

    return await Order.find({
      seller: sellerId,
      replacementFor: { $exists: false }
    })
      .sort({ orderDate: -1 })
      .populate([
        { path: "user" },
        { path: "shippingAddress" },
        {
          path: "orderItems",
          populate: [
            { path: "product" },
            {
              path: "returnRequest",
              select: "status refundStatus refundMethod refundAmount razorpayRefundId createdAt completedAt"
            },
            {
              path: "replacementRequest",
              select: "status reason replacementVariant replacementOrder"
            }
          ]
        },
      ]);
  }

  async updateOrderStatus(orderId, orderStatus) {
    // Validate order status
    if (!Object.values(OrderStatus).includes(orderStatus)) {
      throw new OrderError("Invalid order status");
    }

    const order = await this.findOrderById(orderId);

    // ✅ AUTO-COMPLETE PAYMENT FOR COD ORDERS ON DELIVERY
    let updateFields = { orderStatus };

    if (orderStatus === OrderStatus.DELIVERED &&
      order.paymentStatus === PaymentStatus.PENDING &&
      order.paymentMethod === 'CASH_ON_DELIVERY') {

      updateFields.paymentStatus = PaymentStatus.COMPLETED;
      console.log(`✅ COD order ${orderId} delivered: paymentStatus auto-updated to COMPLETED`);
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).populate([
      { path: "seller" },
      { path: "shippingAddress" },
      { path: "orderItems", populate: { path: "product" } },
    ]);

    // ✅ If payment status changed to COMPLETED, update seller report & transaction
    if (updateFields.paymentStatus === PaymentStatus.COMPLETED) {
      // Update seller report
      try {
        await SellerReportService.incrementSellerReport(order.seller, {
          orderAmount: order.totalSellingPrice,
          platformFee: 7,
          orderStatus: OrderStatus.DELIVERED,
          isCancelled: false
        });
        console.log("✅ Seller report updated for delivered COD order:", orderId);
      } catch (reportErr) {
        console.error("⚠️ Failed to update seller report:", reportErr.message);
      }

      // Update transaction status
      try {
        const tx = await Transaction.findOne({ order: orderId });
        if (tx) {
          await TransactionService.updateTransactionStatus(tx._id, {
            paymentStatus: 'COMPLETED'
          });
          console.log("✅ Transaction updated to COMPLETED for COD order:", orderId);
        }
      } catch (txErr) {
        console.error("⚠️ Failed to update transaction:", txErr.message);
      }
    }

    return updatedOrder;
  }

  async deleteOrder(orderId) {
    const order = await this.findOrderById(orderId);
    return await Order.deleteOne({ _id: orderId });
  }

  async cancelOrder(orderId, user) {
    const order = await this.findOrderById(orderId);

    if (user._id.toString() !== order.user.toString()) {
      throw new OrderError(`You can't cancel order ${orderId} as it doesn't belong to you`);
    }

    // Only allow cancellation for certain statuses
    const cancellableStatuses = [OrderStatus.PENDING, OrderStatus.PLACED, OrderStatus.CONFIRMED];
    if (!cancellableStatuses.includes(order.orderStatus)) {
      throw new OrderError(`Cannot cancel order with status: ${order.orderStatus}`);
    }

    return await Order.findByIdAndUpdate(
      orderId,
      { orderStatus: OrderStatus.CANCELLED },
      { new: true }
    ).populate([
      { path: "seller" },
      { path: "shippingAddress" },
      { path: "orderItems", populate: { path: "product", populate: { path: "seller" } } },
    ]);
  }

  async cancelOrderWithReport(orderId, user, refundReason = 'Customer requested cancellation') {
    const order = await this.findOrderById(orderId);

    if (user._id.toString() !== order.user.toString()) {
      throw new OrderError(`You can't cancel order ${orderId} as it doesn't belong to you`);
    }

    // Only allow cancellation for certain statuses
    const cancellableStatuses = [OrderStatus.PENDING, OrderStatus.PLACED, OrderStatus.CONFIRMED];
    if (!cancellableStatuses.includes(order.orderStatus)) {
      throw new OrderError(`Cannot cancel order with status: ${order.orderStatus}`);
    }

    // ✅ Update order status
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        orderStatus: OrderStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: refundReason
      },
      { new: true }
    ).populate([
      { path: "seller" },
      { path: "shippingAddress" },
      { path: "orderItems", populate: { path: "product", populate: { path: "seller" } } },
    ]);

    // ✅ Adjust seller report: decrement earnings, increment refunds
    try {
      await SellerReportService.decrementSellerReport(order.seller._id, {
        orderAmount: order.totalSellingPrice,
        platformFee: 7,  // Match your platform fee
        refundReason: refundReason
      });
      console.log("✅ Seller report adjusted for cancelled order:", orderId);
    } catch (reportError) {
      console.error("⚠️ Failed to adjust seller report for cancellation:", reportError.message);
      // Don't fail the cancellation for report error
    }

    // ✅ Update transaction to REFUNDED status (with null safety)
    try {
      const existingTx = await Transaction.findOne({ order: orderId });

      if (existingTx?._id) {
        await TransactionService.updateTransactionStatus(
          existingTx._id,
          {
            paymentStatus: 'REFUNDED',
            refundAmount: order.totalSellingPrice,
            refundReason: refundReason
          }
        );
        console.log("✅ Transaction updated to REFUNDED for order:", orderId);
      } else {
        console.log("⚠️ No transaction found for order:", orderId, "- skipping refund update");
      }
    } catch (txError) {
      console.error("⚠️ Failed to update transaction for refund:", txError.message);
      // Don't fail the cancellation for transaction update error
    }

    return updatedOrder;
  }

}

module.exports = new OrderService();