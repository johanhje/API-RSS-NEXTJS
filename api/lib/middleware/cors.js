/**
 * CORS Middleware
 * 
 * Adds CORS headers to allow cross-domain requests to the API
 */

/**
 * Default CORS options
 */
const defaultOptions = {
  allowedOrigins: ['*'], // Allow all origins by default
  allowedMethods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  allowCredentials: true,
  maxAge: 86400 // 24 hours
};

/**
 * Initialize CORS middleware with the given options
 * 
 * @param {Object} options - CORS options
 * @returns {Function} CORS middleware function
 */
export function initCors(options = {}) {
  const corsOptions = { ...defaultOptions, ...options };
  
  return function corsMiddleware(req, res, next) {
    // Get the origin from the request
    const origin = req.headers.origin;
    
    // Set CORS headers
    if (origin) {
      // Check if the origin is allowed
      const isAllowedOrigin = 
        corsOptions.allowedOrigins.includes('*') || 
        corsOptions.allowedOrigins.includes(origin);
      
      if (isAllowedOrigin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }
    } else {
      // If no origin is specified, allow all
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    
    // Set other CORS headers
    res.setHeader('Access-Control-Allow-Methods', corsOptions.allowedMethods.join(', '));
    res.setHeader('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(', '));
    
    if (corsOptions.allowCredentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    
    res.setHeader('Access-Control-Max-Age', corsOptions.maxAge.toString());
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    
    // Continue to the next middleware or handler
    if (next) {
      return next();
    }
  };
}

/**
 * Apply CORS middleware to a Next.js API handler
 * 
 * @param {Function} handler - Next.js API handler
 * @param {Object} options - CORS options
 * @returns {Function} CORS-enabled handler
 */
export function withCors(handler, options = {}) {
  const cors = initCors(options);
  
  return function corsEnabledHandler(req, res) {
    return new Promise((resolve, reject) => {
      cors(req, res, (err) => {
        if (err) {
          return reject(err);
        }
        
        // If no error, call the original handler
        const result = handler(req, res);
        
        // If the handler returns a promise, wait for it to resolve
        if (result instanceof Promise) {
          return result.then(resolve).catch(reject);
        }
        
        return resolve(result);
      });
    });
  };
} 