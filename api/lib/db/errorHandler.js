/**
 * Database Error Handler
 * 
 * Utilities for handling SQLite database errors.
 */

import { DatabaseError, NotFoundError, ValidationError } from '../errors/index.js';
import { createLogger } from '../logging/index.js';

// Create logger
const logger = createLogger({ module: 'dbErrorHandler' });

/**
 * Common SQLite error codes
 */
const SQLITE_ERROR_CODES = {
  SQLITE_CONSTRAINT: 19,  // Constraint violation
  SQLITE_BUSY: 5,         // Database locked
  SQLITE_READONLY: 8,     // Attempt to write to readonly database
  SQLITE_IOERR: 10,       // Disk I/O error
  SQLITE_CORRUPT: 11,     // Database corrupted
  SQLITE_NOTFOUND: 12,    // Table or record not found
  SQLITE_FULL: 13,        // Database is full
  SQLITE_CANTOPEN: 14,    // Can't open database file
  SQLITE_PROTOCOL: 15,    // Database protocol error
  SQLITE_SCHEMA: 17,      // Schema changed
};

/**
 * Handle SQLite database errors
 * 
 * @param {Error} err - Original SQLite error
 * @param {string} [operation='database operation'] - Description of the operation
 * @returns {Error} Converted application error
 */
export function handleDbError(err, operation = 'database operation') {
  // Log the original error for debugging
  logger.error('Database error', {
    operation,
    originalError: err.message,
    code: err.code,
    errno: err.errno,
    stack: err.stack
  });
  
  // If error is already an AppError, just return it
  if (err.isOperational) {
    return err;
  }
  
  // SQLite constraint error typically means a unique constraint violation
  if (err.errno === SQLITE_ERROR_CODES.SQLITE_CONSTRAINT) {
    if (err.message.includes('UNIQUE constraint failed')) {
      // Extract the field name from the error message if possible
      const match = err.message.match(/UNIQUE constraint failed: (.+)/);
      const field = match ? match[1].split('.').pop() : 'field';
      
      return new ValidationError(
        `A record with this ${field} already exists`,
        'UNIQUE_CONSTRAINT_VIOLATION'
      );
    }
    
    // Other constraint errors
    return new ValidationError(
      `Database constraint violation: ${err.message}`,
      'CONSTRAINT_VIOLATION'
    );
  }
  
  // Not found errors
  if (err.errno === SQLITE_ERROR_CODES.SQLITE_NOTFOUND || 
      (err.message && err.message.includes('no such table'))) {
    return new NotFoundError(`Resource not found: ${err.message}`);
  }
  
  // Database is busy/locked
  if (err.errno === SQLITE_ERROR_CODES.SQLITE_BUSY) {
    return new DatabaseError(
      `Database is busy. Please try again later.`,
      'DATABASE_BUSY'
    );
  }
  
  // Default to generic database error
  return new DatabaseError(
    `Error during ${operation}: ${err.message}`,
    'DATABASE_ERROR'
  );
}

/**
 * Wrap a database function with error handling
 * 
 * @param {Function} fn - Database function to wrap
 * @param {string} [operation] - Description of the operation
 * @returns {Function} Wrapped function with error handling
 */
export function withDbErrorHandling(fn, operation) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (err) {
      // Get operation description from function name if not provided
      const opDescription = operation || `${fn.name || 'database operation'}`;
      
      // Handle the error
      throw handleDbError(err, opDescription);
    }
  };
}

/**
 * Run a database transaction with error handling
 * 
 * @param {Object} db - Database connection
 * @param {Function} fn - Function to execute within transaction
 * @param {string} [operation='transaction'] - Description of the operation
 * @returns {Promise<any>} Result of the transaction
 */
export async function runTransaction(db, fn, operation = 'transaction') {
  // Begin transaction
  await db.run('BEGIN TRANSACTION');
  
  try {
    // Execute function with transaction
    const result = await fn(db);
    
    // Commit transaction
    await db.run('COMMIT');
    
    return result;
  } catch (err) {
    // Rollback transaction on error
    try {
      await db.run('ROLLBACK');
    } catch (rollbackErr) {
      logger.error('Error during transaction rollback', rollbackErr);
    }
    
    // Handle the original error
    throw handleDbError(err, operation);
  }
} 