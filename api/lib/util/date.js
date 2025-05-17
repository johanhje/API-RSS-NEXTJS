/**
 * Date Utility Module
 * 
 * Provides helper functions for date operations
 */

/**
 * Check if a date is within a specified timeframe
 * @param {Date|string|number} date - The date to check
 * @param {number} days - Number of days in the past to check against
 * @returns {boolean} - True if the date is within the timeframe
 */
export function isWithinTimeframe(date, days = 7) {
  if (!date) return false;
  
  // Convert the input date to a Date object if it's not already
  const dateObj = date instanceof Date 
    ? date 
    : new Date(typeof date === 'number' ? date * 1000 : date);
  
  // Calculate the cutoff date (days ago from now)
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  // Check if the date is after the cutoff date
  return dateObj >= cutoffDate;
}

/**
 * Format a date as an ISO string
 * @param {Date|string|number} date - The date to format
 * @returns {string} - ISO formatted date string
 */
export function formatISODate(date) {
  if (!date) return '';
  
  const dateObj = date instanceof Date 
    ? date 
    : new Date(typeof date === 'number' ? date * 1000 : date);
  
  return dateObj.toISOString();
}

/**
 * Convert a date to a Unix timestamp (seconds)
 * @param {Date|string} date - The date to convert
 * @returns {number} - Unix timestamp in seconds
 */
export function toUnixTimestamp(date) {
  if (!date) return 0;
  
  const dateObj = date instanceof Date ? date : new Date(date);
  return Math.floor(dateObj.getTime() / 1000);
}

/**
 * Format a date for display
 * @param {Date|string|number} date - The date to format
 * @returns {string} - Formatted date string
 */
export function formatDate(date) {
  if (!date) return '';
  
  const dateObj = date instanceof Date 
    ? date 
    : new Date(typeof date === 'number' ? date * 1000 : date);
  
  return dateObj.toLocaleString('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get a date from N days ago
 * 
 * @param {number} days - Number of days ago
 * @returns {Date} - Date object for N days ago
 */
export function getDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

/**
 * Check if a date is older than N days
 * 
 * @param {Date} date - Date to check
 * @param {number} days - Number of days
 * @returns {boolean} - Whether the date is older than N days
 */
export function isOlderThan(date, days) {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return false;
  }
  
  const now = new Date();
  const daysAgo = getDaysAgo(days);
  
  return date.getTime() < daysAgo.getTime();
}

/**
 * Get the current timestamp in seconds
 * 
 * @returns {number} - Current timestamp in seconds
 */
export function getCurrentTimestamp() {
  return Math.floor(Date.now() / 1000);
} 