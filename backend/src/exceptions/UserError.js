const AppError = require('./AppError');

class UserError extends AppError {
    constructor(message) {
        super(message, 400); 
    }
}

module.exports = UserError;
