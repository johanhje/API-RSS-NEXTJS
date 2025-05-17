/**
 * API Cache Middleware
 * 
 * Provides Next.js API route middleware for caching responses
 */

import { getCached, setCached } from './index.js';

/**
 * Generate a cache key from request information
 * 
 * @param {object} req - Next.js request object
 * @returns {string} - Cache key
 */
function generateCacheKey(req) {
  // Create key from URL path and query parameters
  // Handle both URL object and string URL
  let url;
  try {
    if (typeof req.url === 'string') {
      url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    } else {
      url = req.url;
    }
  } catch (err) {
    // Fallback if URL parsing fails
    return req.url || '';
  }
  
  const path = url.pathname;
  const queryParams = url.searchParams.toString();
  
  return `${path}${queryParams ? `?${queryParams}` : ''}`;
}

/**
 * Middleware for caching API responses
 * 
 * @param {number} ttlMs - Cache TTL in milliseconds
 * @returns {Function} - Next.js API middleware function
 */
export function withCache(ttlMs = 60000) {
  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    // Generate cache key
    const cacheKey = generateCacheKey(req);
    
    // Check if response is in cache
    const cachedResponse = getCached(cacheKey, ttlMs);
    
    if (cachedResponse) {
      // Set appropriate cache headers
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Cache-Control', `public, max-age=${Math.floor(ttlMs / 1000)}`);
      
      // Return cached response
      res.status(cachedResponse.status).json(cachedResponse.data);
      return;
    }
    
    // Set header to indicate cache miss
    res.setHeader('X-Cache', 'MISS');
    
    // Intercept the json method to cache the response
    const originalJson = res.json;
    res.json = function(data) {
      // Cache the response
      setCached(cacheKey, {
        status: res.statusCode,
        data: data
      }, ttlMs);
      
      // Set cache control headers for browser caching
      if (!res.getHeader('Cache-Control')) {
        res.setHeader('Cache-Control', `public, max-age=${Math.floor(ttlMs / 1000)}`);
      }
      
      // Call the original json method
      return originalJson.call(this, data);
    };
    
    // Continue to the actual handler
    return next();
  };
}

/**
 * Higher-order function that adds caching to a Next.js API handler
 * 
 * @param {Function} handler - Next.js API handler function
 * @param {number} ttlMs - Cache TTL in milliseconds
 * @returns {Function} - Wrapped handler with caching
 */
export function withCachedHandler(handler, ttlMs = 60000) {
  return async (req, res) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return handler(req, res);
    }
    
    // Generate cache key
    const cacheKey = generateCacheKey(req);
    
    // Check if response is in cache
    const cachedResponse = getCached(cacheKey, ttlMs);
    
    if (cachedResponse) {
      // Set appropriate cache headers
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Cache-Control', `public, max-age=${Math.floor(ttlMs / 1000)}`);
      
      // Return cached response
      return res.status(cachedResponse.status).json(cachedResponse.data);
    }
    
    // Set header to indicate cache miss
    res.setHeader('X-Cache', 'MISS');
    
    // Create a custom json method that caches the response
    const originalJson = res.json;
    res.json = function(data) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Cache the response
        setCached(cacheKey, {
          status: res.statusCode,
          data: data
        }, ttlMs);
      }
      
      // Set cache control headers for browser caching
      if (!res.getHeader('Cache-Control')) {
        res.setHeader('Cache-Control', `public, max-age=${Math.floor(ttlMs / 1000)}`);
      }
      
      // Call the original json method
      return originalJson.call(this, data);
    };
    
    // Call the original handler
    return handler(req, res);
  };
} 