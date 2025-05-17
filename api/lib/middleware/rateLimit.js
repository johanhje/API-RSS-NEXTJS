/**
 * Rate Limiting Middleware
 * 
 * Provides rate limiting for API routes based on IP address or custom keys.
 */

import { ApiError } from '../errors/index.js';

// Store request counts in memory (will reset on server restart)
// For production, consider using Redis or another persistent store
const requestCounts = new Map();

/**
 * Create a rate limiting middleware
 * 
 * @param {Object} options - Rate limiting options
 * @param {number} [options.limit=100] - Maximum requests per window
 * @param {number} [options.windowMs=60000] - Time window in milliseconds (default: 1 minute)
 * @param {Function} [options.keyGenerator] - Function to generate a unique key for the request
 * @param {Function} [options.handler] - Custom handler for rate limit exceeded
 * @param {boolean} [options.skipSuccessfulRequests=false] - Whether to skip counting successful requests
 * @returns {Function} Express/Next.js middleware function
 */
export function rateLimit({
  limit = 100,
  windowMs = 60 * 1000,
  keyGenerator = (req) => req.headers['x-forwarded-for'] || req.connection.remoteAddress,
  handler = null,
  skipSuccessfulRequests = false
} = {}) {
  // Schedule cleanup of old request counts
  const cleanup = setInterval(() => {
    const now = Date.now();
    requestCounts.forEach((counter, key) => {
      // Clean up expired counters
      if (now - counter.resetTime > windowMs) {
        requestCounts.delete(key);
      }
    });
  }, windowMs);
  
  // Keep cleanup running even during idle periods
  cleanup.unref();
  
  // Create middleware function
  return (req, res, next) => {
    // Generate key for this request
    const key = keyGenerator(req);
    const now = Date.now();
    
    // Get or create counter for this key
    let counter = requestCounts.get(key);
    if (!counter) {
      counter = {
        count: 0,
        resetTime: now
      };
      requestCounts.set(key, counter);
    } else if (now - counter.resetTime > windowMs) {
      // Reset counter if window has passed
      counter.count = 0;
      counter.resetTime = now;
    }
    
    // Check if rate limit is exceeded
    if (counter.count >= limit) {
      const error = new ApiError('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED');
      
      // Add rate limit headers to the response
      const resetTime = counter.resetTime + windowMs;
      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000));
      res.setHeader('Retry-After', Math.ceil((resetTime - now) / 1000));
      
      // Use custom handler or default
      if (handler) {
        return handler(req, res, error);
      } else {
        throw error;
      }
    }
    
    // Increment request count
    counter.count++;
    
    // Add rate limit headers to the response
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - counter.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil((counter.resetTime + windowMs) / 1000));
    
    // Skip counting successful requests if enabled
    if (skipSuccessfulRequests) {
      const originalEnd = res.end;
      res.end = function(...args) {
        // Decrement counter for successful responses
        if (res.statusCode < 400) {
          counter.count = Math.max(0, counter.count - 1);
        }
        originalEnd.apply(this, args);
      };
    }
    
    // Continue to next middleware/handler
    if (typeof next === 'function') {
      next();
    }
  };
}

/**
 * Create a rate limiter with default settings for public API routes
 * 
 * @returns {Function} Rate limiting middleware
 */
export function publicApiRateLimit() {
  return rateLimit({
    limit: 60, // 60 requests per minute (1 per second on average)
    windowMs: 60 * 1000
  });
}

/**
 * Create a more restrictive rate limiter for sensitive operations
 * 
 * @returns {Function} Rate limiting middleware
 */
export function restrictedApiRateLimit() {
  return rateLimit({
    limit: 10, // 10 requests per minute
    windowMs: 60 * 1000
  });
} 