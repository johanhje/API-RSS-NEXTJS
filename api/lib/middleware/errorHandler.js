/**
 * Error Handling Middleware
 * 
 * Provides middleware for Next.js API routes to handle errors and request logging.
 */

import { handleError } from '../errors/index.js';
import { requestLogger } from '../logging/index.js';

/**
 * Create a wrapped API handler with error handling and logging
 * 
 * @param {Function} handler - Next.js API route handler
 * @returns {Function} - Wrapped handler with error handling
 */
export function withErrorHandling(handler) {
  return async (req, res) => {
    try {
      // Apply request logging middleware
      await new Promise((resolve) => {
        requestLogger()(req, res, resolve);
      });
      
      // Execute the original handler
      await handler(req, res);
    } catch (err) {
      // Handle any errors
      handleError(err, req, res);
    }
  };
}

/**
 * Create a Next.js API middleware chain
 * 
 * @param {...Function} middlewares - Middleware functions to apply
 * @returns {Function} - Function that wraps a handler with the middleware chain
 */
export function createMiddlewareChain(...middlewares) {
  return (handler) => {
    return async (req, res) => {
      let index = 0;
      
      // Create a next function to proceed through the chain
      const next = async () => {
        if (index < middlewares.length) {
          const middleware = middlewares[index++];
          await middleware(req, res, next);
        } else {
          await handler(req, res);
        }
      };
      
      // Start the chain
      try {
        await next();
      } catch (err) {
        handleError(err, req, res);
      }
    };
  };
}

/**
 * Create a combined middleware for common use cases
 * 
 * @param {...Function} additionalMiddlewares - Additional middlewares to include
 * @returns {Function} - Function that wraps a handler with all middlewares
 */
export function withApiMiddleware(...additionalMiddlewares) {
  // Include request logging as the first middleware
  const allMiddlewares = [requestLogger(), ...additionalMiddlewares];
  
  return (handler) => {
    return withErrorHandling(
      async (req, res) => {
        let index = 0;
        
        // Create a next function that proceeds through additional middlewares
        const next = async () => {
          if (index < allMiddlewares.length) {
            const middleware = allMiddlewares[index++];
            await middleware(req, res, next);
          } else {
            await handler(req, res);
          }
        };
        
        await next();
      }
    );
  };
} 