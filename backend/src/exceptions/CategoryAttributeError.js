// D:\Mani\Code with Zosh\Backup\source code\backend\src\exceptions\CategoryAttributeError.js

/**
 * ✅ Custom error class for Category Attribute operations
 * Extends the base Error class with status code support
 * Used throughout CategoryAttributeService and CategoryAttributeController
 */
class CategoryAttributeError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'CategoryAttributeError';
    this.statusCode = statusCode;
    
    // ✅ Capture stack trace for debugging
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = CategoryAttributeError;