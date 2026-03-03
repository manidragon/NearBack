const AppError = require('./AppError');

class ProductError extends AppError {
    constructor(message) {
        super(message, 400); 
    }
}

module.exports = ProductError;
