// D:\Mani\Code with Zosh\Backup\source code\backend\src\services\PaymentService.js

require("dotenv").config();
const PaymentOrder = require('../models/PaymentOrder');
const Order = require('../models/Order');
const User = require('../models/User');
const PaymentStatus = require('../domain/PaymentStatus');
const PaymentOrderStatus = require('../domain/PaymentOrderStatus');
const OrderStatus = require('../domain/OrderStatus');
const razorpay = require("../config/razorpayClient");
const mongoose = require('mongoose');

class PaymentService {

    // ✅ NEW METHOD: Create payment session (no orders yet)
    async createPaymentOrder(user, cart, shippingAddress) {
        if (!cart || !cart.cartItems || cart.cartItems.length === 0) {
            throw new Error("Cannot create payment for empty cart");
        }

        const paymentOrder = new PaymentOrder({
            amount: cart.totalSellingPrice,
            user: user._id,
            status: PaymentOrderStatus.PENDING,
            // Store shipping address for later order creation
            shippingAddress: shippingAddress._id || null
        });

        return await paymentOrder.save();
    }

    // Keep existing createOrder method for backward compatibility
    async createOrder(user, orders) {
        const amount = orders.reduce((sum, order) => sum + order.totalSellingPrice, 0);

        const paymentOrder = new PaymentOrder({
            amount,
            user: user._id,
            orders: orders.map(order => order._id),
            status: PaymentOrderStatus.PENDING
        });

        return await paymentOrder.save();
    }

    async getPaymentOrderById(orderId) {
        const paymentOrder = await PaymentOrder.findById(orderId);
        if (!paymentOrder) {
            throw new Error('Payment order not found');
        }
        return paymentOrder;
    }

async getPaymentOrderByPaymentId(paymentLinkId) {
  // Try to find by paymentLinkId field (Razorpay order ID) first
  let paymentOrder = await PaymentOrder.findOne({ paymentLinkId });
  
  // If not found, try to find by MongoDB _id (in case frontend sends _id)
  if (!paymentOrder && mongoose.Types.ObjectId.isValid(paymentLinkId)) {
    paymentOrder = await PaymentOrder.findById(paymentLinkId);
  }
  
  if (!paymentOrder) {
    console.error("❌ PaymentOrder not found for:", {
      paymentLinkId,
      isValidObjectId: mongoose.Types.ObjectId.isValid(paymentLinkId)
    });
    throw new Error('Payment order not found with provided payment link id');
  }
  
  return paymentOrder;
}

    // ✅ UPDATED: Handle both scenarios - with and without pre-created orders
    async proceedPaymentOrder(paymentOrder, paymentId, paymentLinkId) {
        if (paymentOrder.status !== PaymentOrderStatus.PENDING) {
            return false;
        }

        try {
            const payment = await razorpay.payments.fetch(paymentId);

            if (payment.status === 'captured') {
                // Update payment order status
                paymentOrder.status = PaymentOrderStatus.SUCCESS;
                await paymentOrder.save();

                return true;
            } else {
                paymentOrder.status = PaymentOrderStatus.FAILED;
                await paymentOrder.save();
                return false;
            }
        } catch (error) {
            console.error("Payment verification error:", error);
            paymentOrder.status = PaymentOrderStatus.FAILED;
            await paymentOrder.save();
            throw error;
        }
    }

    async createRazorpayPaymentLink(user, amount, paymentOrderId) {
        try {
            // Validate user has required fields
            if (!user.fullName || !user.email) {
                throw new Error("User must have fullName and email");
            }

            // ✅ Use env var for callback URL with fallback
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const callback_url = `${frontendUrl}/payment-success?payment_order_id=${paymentOrderId}`;

            const paymentLinkRequest = {
                amount: amount * 100, // Convert to paise
                currency: 'INR',
                customer: {
                    name: user.fullName,
                    email: user.email,
                    contact: user.mobile || ''
                },
                notify: {
                    sms: false,  // Disable SMS in test mode to avoid spam
                    email: true
                },
                callback_url: callback_url,  // ✅ Now uses env var
                callback_method: 'get'
            };

            console.log('🔗 Creating Razorpay payment link:', {
                amount: paymentLinkRequest.amount,
                customer: paymentLinkRequest.customer.email,
                callback: callback_url
            });

            const paymentLink = await razorpay.paymentLink.create(paymentLinkRequest);
            console.log("✅ Payment link created:", paymentLink.id);
            return paymentLink;

        } catch (err) {
            // ✅ FIXED: Handle Razorpay error object properly
            console.error("❌ Razorpay Error Details:", {
                name: err.name,
                message: err.message,
                description: err.description,
                statusCode: err.statusCode,
                error: err.error,
                reason: err.error?.reason,
                field: err.error?.field,
                source: err.error?.source,
                step: err.error?.step,
                // Full serialized error for debugging
                fullError: JSON.stringify(err, Object.getOwnPropertyNames(err), 2)
            });

            // ✅ Extract meaningful error message
            const errorMessage =
                err.description ||
                err.error?.description ||
                err.error?.reason ||
                err.message ||
                err.error ||
                'Unknown Razorpay error - check server logs';

            throw new Error(`Failed to create payment link: ${errorMessage}`);
        }
    }

    

    async createStripePaymentLink(user, amount, paymentOrderId) {
        try {
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                mode: 'payment',
                success_url: `http://localhost:5173/payment-success?session_id={CHECKOUT_SESSION_ID}&payment_order_id=${paymentOrderId}`,
                cancel_url: 'http://localhost:5173/checkout',
                line_items: [{
                    price_data: {
                        currency: 'inr', // Use INR for Indian users
                        unit_amount: amount * 100,
                        product_data: {
                            name: 'Near Look Order Payment'
                        }
                    },
                    quantity: 1
                }],
                metadata: {
                    paymentOrderId: paymentOrderId
                }
            });

            return session.url;
        } catch (err) {
            console.error("Stripe payment link error:", err);
            throw new Error(`Failed to create Stripe payment link: ${err.message}`);
        }
    }
}

module.exports = new PaymentService();