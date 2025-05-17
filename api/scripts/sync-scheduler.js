/**
 * RSS Feed Synchronization Scheduler
 * 
 * This script can be run as a standalone process to periodically
 * sync the RSS feed with the database.
 */

import { syncRssEvents } from '../lib/rss/sync.js';
import { RSS_FETCH_INTERVAL } from '../lib/config.js';
import { closeDatabase } from '../lib/db/database.js';

// Convert interval from seconds to milliseconds
const intervalMs = RSS_FETCH_INTERVAL * 1000;

// Flag to track if sync is in progress
let isSyncing = false;

/**
 * Perform a single sync operation
 */
async function performSync() {
  if (isSyncing) {
    console.log('Sync already in progress, skipping this interval');
    return;
  }
  
  isSyncing = true;
  
  try {
    const result = await syncRssEvents();
    console.log(`Sync completed at ${new Date().toISOString()}`);
    console.log(`Stats: ${result.inserted} inserted, ${result.updated} updated, ${result.unchanged} unchanged`);
  } catch (error) {
    console.error('Sync error:', error);
  } finally {
    isSyncing = false;
  }
}

/**
 * Start the scheduler
 */
function startScheduler() {
  console.log(`Starting RSS sync scheduler with interval: ${RSS_FETCH_INTERVAL} seconds`);
  
  // Perform initial sync
  performSync();
  
  // Set up recurring sync
  const intervalId = setInterval(performSync, intervalMs);
  
  // Handle graceful shutdown
  const handleShutdown = async () => {
    console.log('Shutting down RSS sync scheduler...');
    clearInterval(intervalId);
    
    // Wait for any in-progress sync to complete
    if (isSyncing) {
      console.log('Waiting for in-progress sync to complete...');
      const checkInterval = setInterval(() => {
        if (!isSyncing) {
          clearInterval(checkInterval);
          closeDatabase();
          console.log('Shutdown complete');
          process.exit(0);
        }
      }, 500);
    } else {
      closeDatabase();
      console.log('Shutdown complete');
      process.exit(0);
    }
  };
  
  // Register shutdown handlers
  process.on('SIGINT', handleShutdown);
  process.on('SIGTERM', handleShutdown);
  
  return intervalId;
}

// Start the scheduler if this script is run directly
if (process.argv[1].includes('sync-scheduler.js')) {
  startScheduler();
}

export { startScheduler, performSync }; 