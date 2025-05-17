/**
 * View Error Logs Script
 * 
 * A utility script to view and analyze error logs.
 * 
 * Usage: node scripts/view-error-logs.js [options]
 * Options:
 *   --last=N        Show last N errors (default: 10)
 *   --level=LEVEL   Filter by log level: ERROR, WARN, INFO, DEBUG (default: ERROR)
 *   --module=NAME   Filter by module name
 *   --since=DATE    Show errors since date (ISO format)
 *   --format=FMT    Output format: json, table (default: table)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getLogFiles } from '../lib/logging/fileLogger.js';

// Get directory of current file
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Path to logs directory
const LOG_DIR = path.join(__dirname, '..', 'logs');

// Default options
const DEFAULT_OPTIONS = {
  last: 10,
  level: 'ERROR',
  module: null,
  since: null,
  format: 'table'
};

/**
 * Parse command line arguments
 * 
 * @returns {Object} Parsed options
 */
function parseArgs() {
  const options = { ...DEFAULT_OPTIONS };
  
  process.argv.slice(2).forEach(arg => {
    const [key, value] = arg.startsWith('--') 
      ? [arg.slice(2).split('=')[0], arg.includes('=') ? arg.split('=')[1] : true]
      : [null, null];
    
    if (key === 'last') options.last = parseInt(value, 10);
    if (key === 'level') options.level = value.toUpperCase();
    if (key === 'module') options.module = value;
    if (key === 'since') options.since = new Date(value);
    if (key === 'format') options.format = value.toLowerCase();
    if (key === 'help') showHelp();
  });
  
  return options;
}

/**
 * Show help text and exit
 */
function showHelp() {
  console.log(`
Usage: node scripts/view-error-logs.js [options]
Options:
  --last=N        Show last N errors (default: 10)
  --level=LEVEL   Filter by log level: ERROR, WARN, INFO, DEBUG (default: ERROR)
  --module=NAME   Filter by module name
  --since=DATE    Show errors since date (ISO format)
  --format=FMT    Output format: json, table (default: table)
  --help          Show this help text
  `);
  process.exit(0);
}

/**
 * Read and parse log files
 * 
 * @param {string} logDir - Path to logs directory
 * @returns {Array} Array of log entries
 */
function readLogs(logDir) {
  // Get all log files
  const files = getLogFiles(logDir, 'app.log');
  
  if (files.length === 0) {
    console.log('No log files found');
    return [];
  }
  
  // Array to store all log entries
  const logs = [];
  
  // Read each log file
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      
      // Parse each line
      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          logs.push(entry);
        } catch (err) {
          // Skip unparseable lines
          console.error(`Error parsing log entry: ${line}`);
        }
      }
    } catch (err) {
      console.error(`Error reading log file ${file}: ${err.message}`);
    }
  }
  
  return logs;
}

/**
 * Filter logs by options
 * 
 * @param {Array} logs - Array of log entries
 * @param {Object} options - Filter options
 * @returns {Array} Filtered log entries
 */
function filterLogs(logs, options) {
  // Define log level priority for filtering
  const levelPriority = {
    'ERROR': 0,
    'WARN': 1,
    'INFO': 2,
    'DEBUG': 3
  };
  
  // Get numeric priority for the selected level
  const selectedLevelPriority = levelPriority[options.level] || 0;
  
  // Filter logs
  return logs.filter(log => {
    // Filter by level
    if (levelPriority[log.level] > selectedLevelPriority) {
      return false;
    }
    
    // Filter by module
    if (options.module && log.module !== options.module) {
      return false;
    }
    
    // Filter by date
    if (options.since && new Date(log.timestamp) < options.since) {
      return false;
    }
    
    return true;
  });
}

/**
 * Format logs for display
 * 
 * @param {Array} logs - Array of log entries
 * @param {string} format - Output format
 * @returns {string} Formatted output
 */
function formatLogs(logs, format) {
  if (format === 'json') {
    return JSON.stringify(logs, null, 2);
  }
  
  // Table format (default)
  if (logs.length === 0) {
    return 'No logs found matching criteria';
  }
  
  // Format as table
  const rows = logs.map(log => {
    // Format timestamp
    const timestamp = new Date(log.timestamp).toLocaleString();
    
    // Format level with color
    let level = log.level;
    if (process.stdout.isTTY) {
      if (level === 'ERROR') level = `\x1b[31m${level}\x1b[0m`; // Red
      if (level === 'WARN') level = `\x1b[33m${level}\x1b[0m`;  // Yellow
      if (level === 'INFO') level = `\x1b[32m${level}\x1b[0m`;  // Green
      if (level === 'DEBUG') level = `\x1b[36m${level}\x1b[0m`; // Cyan
    }
    
    // Format module
    const module = log.module || '';
    
    // Format message (truncate if too long)
    const maxMsgLength = process.stdout.columns ? process.stdout.columns - 60 : 40;
    let message = log.message || '';
    if (message.length > maxMsgLength) {
      message = message.substring(0, maxMsgLength - 3) + '...';
    }
    
    // Format request ID
    const requestId = log.requestId || '-';
    
    return { timestamp, level, module, message, requestId };
  });
  
  // Get column widths
  const colWidths = {
    timestamp: Math.max(...rows.map(r => r.timestamp.length), 'TIMESTAMP'.length),
    level: Math.max(...rows.map(r => r.level.replace(/\x1b\[\d+m/g, '').length), 'LEVEL'.length),
    module: Math.max(...rows.map(r => r.module.length), 'MODULE'.length),
    message: Math.max(...rows.map(r => r.message.length), 'MESSAGE'.length),
    requestId: Math.max(...rows.map(r => r.requestId.length), 'REQUEST ID'.length)
  };
  
  // Create header
  const header = [
    'TIMESTAMP'.padEnd(colWidths.timestamp),
    'LEVEL'.padEnd(colWidths.level),
    'MODULE'.padEnd(colWidths.module),
    'REQUEST ID'.padEnd(colWidths.requestId),
    'MESSAGE'
  ].join(' | ');
  
  // Create separator
  const separator = [
    '-'.repeat(colWidths.timestamp),
    '-'.repeat(colWidths.level),
    '-'.repeat(colWidths.module),
    '-'.repeat(colWidths.requestId),
    '-'.repeat(colWidths.message)
  ].join('-+-');
  
  // Create rows
  const tableRows = rows.map(row => [
    row.timestamp.padEnd(colWidths.timestamp),
    row.level.padEnd(colWidths.level + 10).replace(/\x1b\[\d+m/g, ''),
    row.module.padEnd(colWidths.module),
    row.requestId.padEnd(colWidths.requestId),
    row.message
  ].join(' | '));
  
  // Return formatted table
  return [header, separator, ...tableRows].join('\n');
}

/**
 * Main function
 */
function main() {
  // Parse options
  const options = parseArgs();
  
  // Read logs
  const logs = readLogs(LOG_DIR);
  
  // Filter logs
  const filteredLogs = filterLogs(logs, options)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, options.last);
  
  // Format logs
  const output = formatLogs(filteredLogs, options.format);
  
  // Print logs
  console.log(output);
  
  // Print summary
  if (options.format !== 'json') {
    console.log(`\nShowing ${filteredLogs.length} of ${logs.length} logs`);
  }
}

// Run the script
main(); 