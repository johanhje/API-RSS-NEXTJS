/**
 * Centralized Error Handling Module
 * 
 * Provides custom error classes and error handling utilities.
 */

/**
 * Base application error class
 * 
 * @extends Error
 */
export class AppError extends Error {
  /**
   * Create a new application error
   * 
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code (default: 500)
   * @param {string} code - Error code for client (default: INTERNAL_ERROR)
   */
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true; // Operational errors are expected and can be handled gracefully
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * API error - Used for REST API related errors
 * 
 * @extends AppError
 */
export class ApiError extends AppError {
  constructor(message, statusCode = 400, code = 'API_ERROR') {
    super(message, statusCode, code);
  }
}

/**
 * Database error
 * 
 * @extends AppError
 */
export class DatabaseError extends AppError {
  constructor(message, code = 'DATABASE_ERROR') {
    super(message, 500, code);
  }
}

/**
 * Geocoding error
 * 
 * @extends AppError
 */
export class GeocodingError extends AppError {
  constructor(message, code = 'GEOCODING_ERROR') {
    super(message, 500, code);
  }
}

/**
 * RSS parsing error
 * 
 * @extends AppError
 */
export class RssError extends AppError {
  constructor(message, code = 'RSS_ERROR') {
    super(message, 500, code);
  }
}

/**
 * Validation error
 * 
 * @extends AppError
 */
export class ValidationError extends AppError {
  constructor(message, code = 'VALIDATION_ERROR') {
    super(message, 400, code);
  }
}

/**
 * Not found error
 * 
 * @extends AppError
 */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', code = 'NOT_FOUND') {
    super(message, 404, code);
  }
}

/**
 * Central error handler function
 * 
 * @param {Error} err - Error object
 * @param {Object} req - Express/Next.js request object
 * @param {Object} res - Express/Next.js response object
 */
export function handleError(err, req, res) {
  // Get request ID if available
  const requestId = req?.headers?.['x-request-id'] || 'unknown';
  
  // Log error with context
  console.error('Application error:', {
    requestId,
    message: err.message,
    name: err.name,
    code: err.code,
    statusCode: err.statusCode,
    path: req?.url,
    method: req?.method,
    timestamp: new Date().toISOString(),
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
  
  // Send appropriate response if response object is available
  if (res && !res.headersSent) {
    const statusCode = err.statusCode || 500;
    const errorResponse = {
      success: false,
      error: {
        message: err.isOperational ? err.message : 'Internal server error',
        code: err.code || 'INTERNAL_ERROR'
      },
      requestId
    };
    
    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
      errorResponse.error.stack = err.stack;
    }
    
    res.status(statusCode).json(errorResponse);
  }
  
  // If error is not operational (unexpected), we might want to do more
  // like sending alerts or crashing in production to restart the process
  if (!err.isOperational && process.env.NODE_ENV === 'production') {
    // In a real app, we might want to use a process manager like PM2
    // to restart the application after an unexpected error
    console.error('CRITICAL: Non-operational error occurred');
    // process.exit(1); // Uncomment in production with proper process manager
  }
}

/**
 * Create middleware for handling async route errors in Next.js API routes
 * 
 * @param {Function} fn - Async handler function
 * @returns {Function} Wrapped handler function with error handling
 */
export function asyncHandler(fn) {
  return async (req, res) => {
    try {
      await fn(req, res);
    } catch (err) {
      handleError(err, req, res);
    }
  };
}

/**
 * Create error from known HTTP status code
 * 
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Optional custom message
 * @returns {AppError} Appropriate error instance
 */
export function createHttpError(statusCode, message) {
  switch (statusCode) {
    case 400:
      return new ValidationError(message || 'Bad request');
    case 401:
      return new ApiError(message || 'Unauthorized', 401, 'UNAUTHORIZED');
    case 403:
      return new ApiError(message || 'Forbidden', 403, 'FORBIDDEN');
    case 404:
      return new NotFoundError(message);
    case 429:
      return new ApiError(message || 'Too many requests', 429, 'RATE_LIMIT_EXCEEDED');
    default:
      return new AppError(message || 'Server error', statusCode);
  }
} 