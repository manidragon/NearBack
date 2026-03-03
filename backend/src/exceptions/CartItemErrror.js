const AppError = require('./AppError');

class CartItemError extends AppError {
    constructor(message) {
        super(message, 400); 
    }
}

module.exports = CartItemError;
