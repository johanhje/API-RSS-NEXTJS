/**
 * Structured Logging Module
 * 
 * Provides consistent logging utilities with support for different log levels,
 * structured output, and request context tracking.
 */

// Log levels with numeric values for comparison
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
};

// Current log level (can be set via environment variable)
let currentLogLevel = LOG_LEVELS[process.env.LOG_LEVEL] ?? LOG_LEVELS.INFO;

/**
 * Set the current log level
 * 
 * @param {string} level - Log level (DEBUG, INFO, WARN, ERROR, NONE)
 */
export function setLogLevel(level) {
  if (LOG_LEVELS[level] !== undefined) {
    currentLogLevel = LOG_LEVELS[level];
  }
}

/**
 * Get the current log level
 * 
 * @returns {string} Current log level name
 */
export function getLogLevel() {
  return Object.keys(LOG_LEVELS).find(key => LOG_LEVELS[key] === currentLogLevel) || 'UNKNOWN';
}

/**
 * Create a structured log entry
 * 
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} [context={}] - Additional context data
 * @returns {Object} Structured log entry
 */
function createLogEntry(level, message, context = {}) {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
    // Add application name and version if available
    app: process.env.APP_NAME || 'swedish-police-events-api',
    version: process.env.APP_VERSION || 'dev'
  };
}

/**
 * Format log entry based on environment
 * 
 * @param {Object} entry - Log entry object
 * @returns {string} Formatted log entry
 */
function formatLogEntry(entry) {
  // In production, output JSON for log processing tools
  if (process.env.NODE_ENV === 'production') {
    return JSON.stringify(entry);
  }
  
  // In development, format for readability
  const timestamp = entry.timestamp;
  const level = entry.level.padEnd(5);
  const message = entry.message;
  
  // Remove common fields for context display
  const context = { ...entry };
  delete context.timestamp;
  delete context.level;
  delete context.message;
  delete context.app;
  delete context.version;
  
  // Only show context if it has properties
  const contextStr = Object.keys(context).length > 0
    ? `\n${JSON.stringify(context, null, 2)}`
    : '';
  
  return `${timestamp} [${level}] ${message}${contextStr}`;
}

/**
 * Output a log entry if level is enabled
 * 
 * @param {string} level - Log level name
 * @param {string} message - Log message
 * @param {Object} [context] - Additional context data
 */
function log(level, message, context) {
  // Skip if logging is disabled for this level
  if (LOG_LEVELS[level] < currentLogLevel) {
    return;
  }
  
  const entry = createLogEntry(level, message, context);
  const formatted = formatLogEntry(entry);
  
  // Output to appropriate console method
  switch (level) {
    case 'ERROR':
      console.error(formatted);
      break;
    case 'WARN':
      console.warn(formatted);
      break;
    case 'INFO':
      console.info(formatted);
      break;
    default:
      console.log(formatted);
  }
}

/**
 * Log a debug message
 * 
 * @param {string} message - Log message
 * @param {Object} [context] - Additional context data
 */
export function debug(message, context) {
  log('DEBUG', message, context);
}

/**
 * Log an info message
 * 
 * @param {string} message - Log message
 * @param {Object} [context] - Additional context data
 */
export function info(message, context) {
  log('INFO', message, context);
}

/**
 * Log a warning message
 * 
 * @param {string} message - Log message
 * @param {Object} [context] - Additional context data
 */
export function warn(message, context) {
  log('WARN', message, context);
}

/**
 * Log an error message
 * 
 * @param {string} message - Log message
 * @param {Object|Error} [contextOrError] - Error object or context data
 * @param {Object} [context] - Additional context if first param is Error
 */
export function error(message, contextOrError, context) {
  // Handle case where an Error object is passed
  if (contextOrError instanceof Error) {
    const errorContext = {
      errorName: contextOrError.name,
      errorMessage: contextOrError.message,
      stack: contextOrError.stack,
      ...context
    };
    log('ERROR', message, errorContext);
  } else {
    log('ERROR', message, contextOrError);
  }
}

/**
 * Create a logger with predefined context
 * 
 * @param {Object} defaultContext - Context to include with all logs
 * @returns {Object} Logger methods with bound context
 */
export function createLogger(defaultContext = {}) {
  return {
    debug: (message, context) => debug(message, { ...defaultContext, ...context }),
    info: (message, context) => info(message, { ...defaultContext, ...context }),
    warn: (message, context) => warn(message, { ...defaultContext, ...context }),
    error: (message, contextOrError, additionalContext) => {
      if (contextOrError instanceof Error) {
        error(message, contextOrError, { ...defaultContext, ...additionalContext });
      } else {
        error(message, { ...defaultContext, ...contextOrError });
      }
    }
  };
}

/**
 * Create request logger middleware for Next.js API routes
 * 
 * @returns {Function} Middleware function
 */
export function requestLogger() {
  return (req, res, next) => {
    // Generate unique request ID if not present
    const requestId = req.headers['x-request-id'] || generateRequestId();
    req.headers['x-request-id'] = requestId;
    
    // Log request details
    info('API Request', {
      requestId,
      method: req.method,
      url: req.url,
      query: req.query,
      userAgent: req.headers['user-agent'],
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
    });
    
    // Track response time
    const startTime = Date.now();
    
    // Log response on finish
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const level = res.statusCode >= 400 ? 'WARN' : 'INFO';
      
      log(level, 'API Response', {
        requestId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`
      });
    });
    
    // Continue to next middleware/handler
    if (typeof next === 'function') {
      next();
    }
  };
}

/**
 * Generate a unique request ID
 * 
 * @returns {string} Unique request ID
 */
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
} 