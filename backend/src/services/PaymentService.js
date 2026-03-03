// D:\Mani\Code with Zosh\Backup\source code\backend\src\services\PaymentService.js

require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const PaymentOrder = require('../models/PaymentOrder');
const Order = require('../models/Order');
const User = require('../models/User');
const PaymentStatus = require('../domain/PaymentStatus');
const PaymentOrderStatus = require('../domain/PaymentOrderStatus');
const OrderStatus = require('../domain/OrderStatus');
const razorpay = require("../config/razorpayClient");

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
        const paymentOrder = await PaymentOrder.findOne({ paymentLinkId });
        if (!paymentOrder) {
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

            console.log('Razorpay config check:');
            console.log('Key ID exists:', !!process.env.RAZORPAY_KEY_ID);
            console.log('Key Secret exists:', !!process.env.RAZORPAY_KEY_SECRET);
            // Validate user has required fields
            if (!user.fullName || !user.email) {
                throw new Error("User must have fullName and email");
            }

            const paymentLinkRequest = {
                amount: amount * 100, // Convert to paise
                currency: 'INR',
                customer: {
                    name: user.fullName,
                    email: user.email,
                    contact: user.mobile || '' // Optional mobile
                },
                notify: {
                    sms: true,
                    email: true
                },
                callback_url: `http://localhost:5173/payment-success?payment_order_id=${paymentOrderId}`,
                callback_method: 'get'
            };

            const paymentLink = await razorpay.paymentLink.create(paymentLinkRequest);
            console.log("payment link created:", paymentLink);

            return paymentLink;
        } catch (err) {
            console.error("Full Razorpay error:", JSON.stringify(err, null, 2));
            throw new Error(`Failed to create payment link: ${err.message}`);
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