/**
 * API Wrapper Module
 * 
 * Provides utilities for wrapping Next.js API routes with common middleware.
 */

import { withErrorHandling } from '../middleware/errorHandler.js';
import { requestId } from '../middleware/requestId.js';
import { publicApiRateLimit, restrictedApiRateLimit } from '../middleware/rateLimit.js';
import { createLogger } from '../logging/index.js';
import { ValidationError, NotFoundError } from '../errors/index.js';

// Create logger
const logger = createLogger({ module: 'apiWrapper' });

/**
 * Wrap a Next.js API route handler with standard middleware
 * 
 * @param {Function} handler - API route handler function
 * @param {Object} [options] - Configuration options
 * @param {boolean} [options.rateLimit=true] - Whether to apply rate limiting
 * @param {boolean} [options.restricted=false] - Whether to apply restricted rate limits
 * @returns {Function} Wrapped handler with middleware
 */
export function withApiHandler(handler, {
  rateLimit = true,
  restricted = false
} = {}) {
  // Build middleware chain
  const middlewares = [
    // Always add request ID tracking
    requestId()
  ];
  
  // Add rate limiting if enabled
  if (rateLimit) {
    middlewares.push(restricted ? restrictedApiRateLimit() : publicApiRateLimit());
  }
  
  // Apply middleware chain and error handling
  return withErrorHandling(async (req, res) => {
    // Apply middlewares sequentially
    let index = 0;
    
    // Function to proceed to next middleware or handler
    const next = async () => {
      if (index < middlewares.length) {
        const middleware = middlewares[index++];
        return new Promise((resolve) => {
          middleware(req, res, resolve);
        });
      }
    };
    
    // Execute middleware chain
    await next();
    
    // Execute handler if response not sent
    if (!res.headersSent) {
      await handler(req, res);
    }
  });
}

/**
 * Create a REST API handler with method routing
 * 
 * @param {Object} handlers - HTTP method handlers
 * @param {Function} [handlers.GET] - GET request handler
 * @param {Function} [handlers.POST] - POST request handler
 * @param {Function} [handlers.PUT] - PUT request handler
 * @param {Function} [handlers.DELETE] - DELETE request handler
 * @param {Function} [handlers.PATCH] - PATCH request handler
 * @param {Object} [options] - Configuration options
 * @returns {Function} Next.js API route handler
 */
export function createApiRoute(handlers, options = {}) {
  // Create the method router handler
  const handler = async (req, res) => {
    const method = req.method;
    
    // Check if method is supported
    if (!handlers[method]) {
      throw new NotFoundError(`Method ${method} not allowed`);
    }
    
    // Call the appropriate handler
    return handlers[method](req, res);
  };
  
  // Wrap with standard middleware
  return withApiHandler(handler, options);
}

/**
 * Parse and validate query parameters
 * 
 * @param {Object} req - Next.js request object
 * @param {Object} schema - Parameter schema {name: {type, required, defaultValue, validator}}
 * @returns {Object} Parsed and validated parameters
 * @throws {ValidationError} If validation fails
 */
export function parseQueryParams(req, schema) {
  const params = {};
  const errors = [];
  
  // Process each parameter
  for (const [name, config] of Object.entries(schema)) {
    const { 
      type = 'string',
      required = false, 
      defaultValue = undefined,
      validator = null
    } = config;
    
    // Get raw value
    let value = req.query[name];
    
    // Check if required
    if (required && (value === undefined || value === '')) {
      errors.push(`Parameter '${name}' is required`);
      continue;
    }
    
    // Use default if no value provided
    if ((value === undefined || value === '') && defaultValue !== undefined) {
      value = defaultValue;
    }
    
    // Skip if no value and not required
    if (value === undefined || value === '') {
      continue;
    }
    
    // Parse value based on type
    try {
      switch (type) {
        case 'number':
          value = Number(value);
          if (isNaN(value)) {
            throw new Error(`Invalid number format`);
          }
          break;
        case 'boolean':
          if (typeof value === 'string') {
            value = value.toLowerCase() === 'true' || value === '1';
          } else {
            value = Boolean(value);
          }
          break;
        case 'date':
          value = new Date(value);
          if (isNaN(value.getTime())) {
            throw new Error(`Invalid date format`);
          }
          break;
        case 'array':
          if (typeof value === 'string') {
            value = value.split(',').map(item => item.trim());
          } else if (!Array.isArray(value)) {
            value = [value];
          }
          break;
        case 'json':
          if (typeof value === 'string') {
            value = JSON.parse(value);
          }
          break;
        case 'string':
        default:
          // Ensure string type
          value = String(value);
      }
    } catch (err) {
      errors.push(`Parameter '${name}' has invalid format: ${err.message}`);
      continue;
    }
    
    // Validate with custom validator if provided
    if (validator && typeof validator === 'function') {
      try {
        const validationResult = validator(value);
        if (validationResult !== true) {
          errors.push(`Parameter '${name}' validation failed: ${validationResult || 'Invalid value'}`);
          continue;
        }
      } catch (err) {
        errors.push(`Parameter '${name}' validation error: ${err.message}`);
        continue;
      }
    }
    
    // Store validated value
    params[name] = value;
  }
  
  // If validation errors, throw error
  if (errors.length > 0) {
    throw new ValidationError(`Invalid request parameters: ${errors.join('; ')}`);
  }
  
  return params;
} 