// D:\Mani\Code with Zosh\Backup\source code\backend\src\exceptions\CatalogError.js

/**
 * ✅ Custom Error Class for Product Catalog Operations
 * Used for multi-seller catalog-related errors
 */
class CatalogError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'CatalogError';
    this.statusCode = statusCode;
    this.isOperational = true;
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = CatalogError;