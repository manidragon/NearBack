const OrderStatus = Object.freeze({
    PENDING: "PENDING",
    PLACED: "PLACED",
    READY_FOR_PICKUP: "READY_FOR_PICKUP",
    CONFIRMED: "CONFIRMED",
    SHIPPED: "SHIPPED",
    DELIVERED: "DELIVERED",
    CANCELLED: "CANCELLED",

});

module.exports = OrderStatus;
