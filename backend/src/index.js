require('dotenv').config();

const express = require('express');
const connectDB = require('./config/db.js');
const bodyParser = require('body-parser');
const cors = require('cors');
const enquiryRoutes = require("./routers/enquiryRoutes");

const app = express();

app.use(cors());
app.use(bodyParser.json());

const productRouters = require("./routers/productRoutes.js");
const authRouters = require("./routers/authRouters.js");
const adminRouters = require("./routers/adminRouters.js");
const cartRouters = require("./routers/cartRoutes.js");
const revenueRouters = require("./routers/revenueRoutes.js");
const sellerOrderRouters = require("./routers/sellerOrderRoutes.js");
const sellerProductRouters = require("./routers/sellerProductRoutes.js");
const sellerReportRouters = require("./routers/sellerReportRoutes.js");
const sellerRouters = require("./routers/sellerRoutes.js");
const transactionRouters = require("./routers/transactionRoutes.js");
const userRouters = require("./routers/userRoutes.js");
const wishlistRouters = require("./routers/wishlistRoutes.js");
const orderRouters = require("./routers/orderRoutes.js");
const paymentRoutres = require("./routers/paymentRoutes.js");
const dealRoutres = require("./routers/dealRoutes.js");
const couponRouters = require("./routers/couponRoutes.js");
const homeRouters = require("./routers/homeCategoryRoutes.js");
const chatboatRouters = require("./routers/chatboatRoutes.js");
const reviewRouters = require("./routers/reviewRouters.js");
const addressRoutes = require('./routers/addressRoutes');
const categoryRouters = require("./routers/categoryRoutes");
const electronicCategoryRoutes = require('./routers/electronicCategoryRoutes');
const categoryAttributeRoutes = require('./routers/categoryAttributeRoutes');
const catalogRoutes = require('./routers/catalogRoutes');
const returnRoutes = require('./routers/returnRoutes.js');
const walletRoutes = require('./routers/walletRoutes.js');
const webhookRoutes = require('./routers/webhookRoutes.js');

app.use('/api/webhooks', webhookRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/admin/categories', categoryAttributeRoutes);
app.use('/api/admin/electronics', electronicCategoryRoutes);
app.use('/api/categories', categoryRouters);
app.use('/api/addresses', addressRoutes);

app.use('/auth', authRouters);
app.use("/api/users", userRouters);
app.use("/sellers", sellerRouters);
app.use("/products", productRouters);
app.use("/api/sellers/product", sellerProductRouters);
app.use("/api/cart", cartRouters);
app.use("/api/orders", orderRouters);
app.use("/api/seller/orders", sellerOrderRouters);
app.use("/api/transactions", transactionRouters);
app.use("/api/wishlist", wishlistRouters);
app.use("/api/sellers/report", sellerReportRouters);

app.use("/api/payment", paymentRoutres);
app.use("/home", homeRouters);
app.use("/api/deals", dealRoutres);
app.use("/admin", adminRouters);

app.use("/api/coupons", couponRouters);
app.use("/api/sellers/revenue", revenueRouters);

app.use("/api/reviews", reviewRouters);

// chatbot
app.use("/chat", chatboatRouters);

// enquiry routes
app.use("/api/enquiries", enquiryRoutes);

const port = process.env.PORT || 8080;

console.clear();

app.listen(port, async () => {
    try {
        await connectDB();
        console.log(`Server is running on port ${port}`);
    } catch (error) {
        console.error("Database connection failed:", error);
    }
});