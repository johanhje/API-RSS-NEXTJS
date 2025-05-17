/**
 * Cache Monitoring Module
 * 
 * Provides utilities for monitoring cache performance and status
 */

import { getCacheMetrics, purgeExpired, resetMetrics } from './index.js';
import { getGeocodingCacheMetrics } from './geocoding.js';
import { getRssCacheMetrics } from './rss.js';

// Interval for auto-purging expired cache items (5 minutes)
const PURGE_INTERVAL_MS = 5 * 60 * 1000;

// Keep track of whether auto-purge is already running
let purgeIntervalId = null;

/**
 * Start automatic purging of expired cache items
 * 
 * @returns {boolean} - Whether auto-purge was newly started
 */
export function startAutoPurge() {
  if (purgeIntervalId) {
    return false; // Already running
  }
  
  purgeIntervalId = setInterval(() => {
    const purgedCount = purgeExpired();
    if (purgedCount > 0) {
      console.log(`Auto-purged ${purgedCount} expired cache items`);
    }
  }, PURGE_INTERVAL_MS);
  
  return true;
}

/**
 * Stop automatic purging of expired cache items
 * 
 * @returns {boolean} - Whether auto-purge was stopped
 */
export function stopAutoPurge() {
  if (!purgeIntervalId) {
    return false; // Not running
  }
  
  clearInterval(purgeIntervalId);
  purgeIntervalId = null;
  
  return true;
}

/**
 * Get comprehensive cache metrics across all cache types
 * 
 * @returns {object} - Combined cache metrics
 */
export function getAllCacheMetrics() {
  const generalMetrics = getCacheMetrics();
  const geocodingMetrics = getGeocodingCacheMetrics();
  const rssMetrics = getRssCacheMetrics();
  
  return {
    general: generalMetrics,
    geocoding: geocodingMetrics,
    rss: rssMetrics,
    timestamp: new Date().toISOString(),
    autoPurgeActive: !!purgeIntervalId
  };
}

/**
 * Reset all cache metrics
 */
export function resetAllMetrics() {
  resetMetrics();
}

// Auto-start the purge interval when the module is imported
startAutoPurge(); 