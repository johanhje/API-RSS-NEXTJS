/**
 * RSS Feed Scheduler
 * 
 * Provides functionality to automatically sync RSS feed on a schedule
 */

import { syncRssEvents, getDatabaseStats } from './sync.js';
import { getRssCacheStatus, resetRssCache } from './parser.js';
import { RSS_FETCH_INTERVAL } from '../config.js';

// Default interval is from config (in seconds)
const DEFAULT_INTERVAL = RSS_FETCH_INTERVAL;

// Track active timer
let syncTimer = null;
let isRunning = false;

// Store sync stats
const stats = {
  lastRunTime: 0,
  lastRunDuration: 0,
  totalRuns: 0,
  successfulRuns: 0,
  failedRuns: 0,
  lastError: null,
  lastResult: null
};

/**
 * Run a sync operation and update stats
 * @returns {Promise<Object>} - Sync results
 */
async function runSync() {
  if (isRunning) {
    console.log('Sync already in progress, skipping');
    return null;
  }
  
  isRunning = true;
  const startTime = Date.now();
  stats.lastRunTime = startTime;
  
  try {
    console.log('Running scheduled RSS sync...');
    const result = await syncRssEvents();
    
    // Update stats
    stats.lastRunDuration = Date.now() - startTime;
    stats.totalRuns++;
    stats.successfulRuns++;
    stats.lastError = null;
    stats.lastResult = result;
    
    console.log(`Scheduled sync completed in ${stats.lastRunDuration}ms`);
    return result;
  } catch (error) {
    stats.lastRunDuration = Date.now() - startTime;
    stats.totalRuns++;
    stats.failedRuns++;
    stats.lastError = error.message;
    
    console.error('Scheduled sync failed:', error);
    return null;
  } finally {
    isRunning = false;
  }
}

/**
 * Start the scheduler
 * @param {number} intervalSeconds - Sync interval in seconds
 * @returns {boolean} - Success flag
 */
export function startScheduler(intervalSeconds = DEFAULT_INTERVAL) {
  if (syncTimer) {
    console.log('Scheduler is already running. Stop it first to restart with new interval.');
    return false;
  }
  
  const interval = Math.max(30, intervalSeconds) * 1000; // Minimum 30 seconds
  
  console.log(`Starting RSS sync scheduler, interval: ${intervalSeconds} seconds`);
  
  // Run once immediately
  runSync();
  
  // Then set up recurring timer
  syncTimer = setInterval(runSync, interval);
  
  return true;
}

/**
 * Stop the scheduler
 * @returns {boolean} - Success flag
 */
export function stopScheduler() {
  if (!syncTimer) {
    console.log('Scheduler is not running');
    return false;
  }
  
  clearInterval(syncTimer);
  syncTimer = null;
  console.log('RSS sync scheduler stopped');
  
  return true;
}

/**
 * Force a sync run now
 * @returns {Promise<Object>} - Sync results
 */
export function forceSyncNow() {
  console.log('Forcing RSS sync now');
  resetRssCache(); // Clear cache to ensure fresh data
  return runSync();
}

/**
 * Get scheduler status
 * @returns {Object} - Scheduler status
 */
export function getSchedulerStatus() {
  return {
    isRunning: !!syncTimer,
    currentInterval: syncTimer ? DEFAULT_INTERVAL : null,
    stats,
    cache: getRssCacheStatus(),
    database: syncTimer ? getDatabaseStats() : null
  };
}

// Automatically start scheduler when module is imported
// if (process.env.NODE_ENV !== 'test') {
//   startScheduler();
// } 