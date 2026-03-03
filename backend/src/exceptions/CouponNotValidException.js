const AppError = require('./AppError');

class CouponNotValidException extends AppError {
    constructor(message) {
        super(message, 400); 
    }
}

module.exports = CouponNotValidException;
