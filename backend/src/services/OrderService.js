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

class OrderService {
 async createOrder(user, shippingAddress, cart, fulfillmentType = 'DELIVERY', pickupTime = null) { // 👈 Add pickupTime parameter
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

    // Group items by seller
    const itemsBySeller = cart.cartItems.reduce((acc, item) => {
      const sellerId = item.product.seller._id.toString();
      if (!acc[sellerId]) {
        acc[sellerId] = [];
      }
      acc[sellerId].push(item);
      return acc;
    }, {});

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

      // Create order - sellerId must be ObjectId
      const newOrder = new Order({
        user: user._id,
        seller: new mongoose.Types.ObjectId(sellerId),
        totalMrpPrice,
        totalSellingPrice,
        totalItem: totalItemCount,
        shippingAddress: finalShippingAddress,
        orderStatus: orderStatus,
        fulfillmentType: fulfillmentType, // Store fulfillment type
        paymentStatus: PaymentStatus.PENDING,
        orderItems: orderItemIds,
        orderDate: new Date(),
        deliverDate: deliverDate,
        pickupTime: orderPickupTime // 👈 Store pickup time
      });

      const savedOrder = await newOrder.save();
      await TransactionService.createTransaction(savedOrder._id);
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
        populate: { 
          path: "product", 
          populate: { 
            path: "seller", 
            populate: { path: "pickupAddress" } 
          } 
        } 
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
          populate: { 
            path: "product", 
            populate: { 
              path: "seller", 
              populate: { path: "pickupAddress" } 
            } 
          } 
        },
      ]);
  }

  async getShopsOrders(sellerId) {
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      throw new OrderError("Invalid Seller ID");
    }

    return await Order.find({ seller: sellerId })
      .sort({ orderDate: -1 })
      .populate([
        { path: "user" },
        { path: "shippingAddress" },
        { path: "orderItems", populate: { path: "product" } },
      ]);
  }

  async updateOrderStatus(orderId, orderStatus) {
    // Validate order status
    if (!Object.values(OrderStatus).includes(orderStatus)) {
      throw new OrderError("Invalid order status");
    }

    const order = await this.findOrderById(orderId);
    order.orderStatus = orderStatus;

    return await Order.findByIdAndUpdate(
      orderId,
      { orderStatus },
      { new: true, runValidators: true }
    ).populate([
      { path: "seller" },
      { path: "shippingAddress" },
      { path: "orderItems", populate: { path: "product" } },
    ]);
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
  
}

module.exports = new OrderService();