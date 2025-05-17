/**
 * Request ID Middleware
 * 
 * Provides a middleware to generate and track request IDs for correlation.
 */

import { createLogger } from '../logging/index.js';

// Create logger
const logger = createLogger({ module: 'requestId' });

/**
 * Generate a unique request ID
 * 
 * @returns {string} Unique request ID
 */
export function generateRequestId() {
  // Generate a unique request ID using timestamp and random value
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `req_${timestamp}_${random}`;
}

/**
 * Middleware to add a request ID to each request
 * 
 * @param {Object} options - Request ID options
 * @param {string} [options.header='x-request-id'] - Header name for the request ID
 * @param {Function} [options.generator=generateRequestId] - Function to generate a request ID
 * @param {boolean} [options.setHeader=true] - Whether to set the request ID header in the response
 * @returns {Function} Middleware function
 */
export function requestId({
  header = 'x-request-id',
  generator = generateRequestId,
  setHeader = true
} = {}) {
  return (req, res, next) => {
    // Use existing request ID from header or generate a new one
    req.id = req.headers[header] || generator();
    
    // Store the request ID in headers for logging and other middlewares
    req.headers[header] = req.id;
    
    // Add request ID to response headers if enabled
    if (setHeader) {
      res.setHeader(header, req.id);
    }
    
    // Log with request ID for traceability
    logger.debug('Request ID assigned', { requestId: req.id, url: req.url });
    
    // Continue to next middleware/handler
    if (typeof next === 'function') {
      next();
    }
  };
}

/**
 * Get request ID from request object
 * 
 * @param {Object} req - Request object
 * @param {string} [header='x-request-id'] - Header name for the request ID
 * @returns {string|null} Request ID or null if not found
 */
export function getRequestId(req, header = 'x-request-id') {
  if (!req) return null;
  
  // Try to get from explicitly set property first
  if (req.id) return req.id;
  
  // Then try to get from headers
  if (req.headers && req.headers[header]) {
    return req.headers[header];
  }
  
  return null;
}

/**
 * Create a logger with request ID context
 * 
 * @param {Object} req - Request object
 * @returns {Object} Logger with request ID context
 */
export function createRequestLogger(req) {
  const requestId = getRequestId(req);
  return createLogger({ requestId });
} 