const AppError = require('./AppError');

class SellerError extends AppError {
    constructor(message) {
        super(message, 400); // Bad Request
    }
}

module.exports = SellerError;
