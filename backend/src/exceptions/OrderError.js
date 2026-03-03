const AppError = require('./AppError');

class OrderError extends AppError {
    constructor(message) {
        super(message, 400); 
    }
}

module.exports = OrderError;