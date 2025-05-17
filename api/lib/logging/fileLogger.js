/**
 * File Logger Module
 * 
 * Provides utilities for logging to files with rotation support.
 */

import fs from 'fs';
import path from 'path';
import { createLogger } from './index.js';

// Default log directory
const DEFAULT_LOG_DIR = path.join(process.cwd(), 'logs');

// Default log file size limit (10MB)
const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;

// Default maximum number of log files to keep
const DEFAULT_MAX_FILES = 5;

// Default interval for checking file size
const DEFAULT_INTERVAL_MS = 60000; // 1 minute

// Create logger for internal use
const logger = createLogger({ module: 'fileLogger' });

/**
 * Create a file logger
 * 
 * @param {Object} options - Logger options
 * @param {string} [options.logDir=logs] - Directory to store log files
 * @param {string} [options.filename=app.log] - Base filename for log files
 * @param {number} [options.maxFileSize=10MB] - Maximum file size before rotation
 * @param {number} [options.maxFiles=5] - Maximum number of log files to keep
 * @param {Function} [options.formatter] - Custom log formatter function
 * @returns {Object} File logger instance
 */
export function createFileLogger({
  logDir = DEFAULT_LOG_DIR,
  filename = 'app.log',
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  maxFiles = DEFAULT_MAX_FILES,
  formatter = JSON.stringify
} = {}) {
  // Ensure log directory exists
  if (!fs.existsSync(logDir)) {
    try {
      fs.mkdirSync(logDir, { recursive: true });
    } catch (err) {
      logger.error('Failed to create log directory', err);
      return null;
    }
  }
  
  // Current log file path
  const logFilePath = path.join(logDir, filename);
  
  // Check if we need to rotate logs
  const checkRotation = () => {
    try {
      // Check if file exists
      if (!fs.existsSync(logFilePath)) {
        return;
      }
      
      // Check file size
      const stats = fs.statSync(logFilePath);
      if (stats.size >= maxFileSize) {
        rotateLogFiles();
      }
    } catch (err) {
      logger.error('Error checking log rotation', err);
    }
  };
  
  // Rotate log files
  const rotateLogFiles = () => {
    try {
      // Delete oldest log file if we've reached the limit
      const oldestFile = path.join(logDir, `${filename}.${maxFiles - 1}`);
      if (fs.existsSync(oldestFile)) {
        fs.unlinkSync(oldestFile);
      }
      
      // Shift log files
      for (let i = maxFiles - 2; i >= 0; i--) {
        const oldFile = path.join(logDir, `${filename}.${i}`);
        const newFile = path.join(logDir, `${filename}.${i + 1}`);
        
        if (fs.existsSync(oldFile)) {
          fs.renameSync(oldFile, newFile);
        }
      }
      
      // Rename current log file
      const newFile = path.join(logDir, `${filename}.0`);
      fs.renameSync(logFilePath, newFile);
      
      logger.info('Rotated log files', { maxFiles, currentLogFile: logFilePath });
    } catch (err) {
      logger.error('Failed to rotate log files', err);
    }
  };
  
  // Set up periodic rotation check
  const rotationInterval = setInterval(checkRotation, DEFAULT_INTERVAL_MS);
  
  // Write a log entry to file
  const writeLog = (level, message, context = {}) => {
    try {
      // Create log entry
      const entry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        ...context
      };
      
      // Format log entry
      const formatted = formatter(entry) + '\n';
      
      // Append to log file
      fs.appendFileSync(logFilePath, formatted, 'utf8');
      
      return true;
    } catch (err) {
      logger.error('Failed to write to log file', err, { level, message });
      return false;
    }
  };
  
  // Clean up resources
  const shutdown = () => {
    clearInterval(rotationInterval);
    logger.info('File logger shutdown');
  };
  
  // Return logger interface
  return {
    debug: (message, context) => writeLog('DEBUG', message, context),
    info: (message, context) => writeLog('INFO', message, context),
    warn: (message, context) => writeLog('WARN', message, context),
    error: (message, context) => writeLog('ERROR', message, context),
    shutdown,
    rotate: rotateLogFiles,
    logFilePath
  };
}

/**
 * Get all log files for a specific logger
 * 
 * @param {string} logDir - Log directory
 * @param {string} filename - Base log filename
 * @returns {Array} Array of log file paths
 */
export function getLogFiles(logDir = DEFAULT_LOG_DIR, filename = 'app.log') {
  try {
    if (!fs.existsSync(logDir)) {
      return [];
    }
    
    // Get all files in directory
    const files = fs.readdirSync(logDir);
    
    // Filter log files for this logger
    const logFiles = files.filter(file => {
      // Match base filename or rotated files (app.log, app.log.0, app.log.1, etc.)
      return file === filename || file.match(new RegExp(`^${filename}\\.\\d+$`));
    });
    
    // Sort files with most recent first
    return logFiles
      .map(file => path.join(logDir, file))
      .sort((a, b) => {
        // Sort by modification time, most recent first
        const aTime = fs.statSync(a).mtime.getTime();
        const bTime = fs.statSync(b).mtime.getTime();
        return bTime - aTime;
      });
  } catch (err) {
    logger.error('Failed to get log files', err);
    return [];
  }
} 