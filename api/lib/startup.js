/**
 * API Startup Script
 * 
 * Initializes services and schedulers when the API server starts
 */

import { startScheduler } from './rss/scheduler.js';
import { RSS_FETCH_INTERVAL } from './config.js';

/**
 * Initialize the API services
 */
export function initializeServices() {
  console.log('Initializing API services...');
  
  // Start the RSS scheduler if enabled
  if (process.env.ENABLE_RSS_SCHEDULER !== 'false') {
    console.log(`Starting RSS scheduler with ${RSS_FETCH_INTERVAL} second interval`);
    startScheduler();
  } else {
    console.log('RSS scheduler disabled by environment variable');
  }
  
  console.log('API services initialized');
}

// Auto-initialize when imported in production
if (process.env.NODE_ENV === 'production' && process.env.DISABLE_AUTO_INIT !== 'true') {
  console.log('Production environment detected, auto-initializing services');
  initializeServices();
} 