/**
 * Test RSS Synchronization Performance
 * 
 * This script measures the performance of RSS synchronization
 * with the enhanced geocoding system
 */

import { syncRssEvents } from '../lib/rss/sync.js';
import { resetRssCache } from '../lib/rss/parser.js';

async function runPerformanceTest() {
  console.log('\n=== RSS Sync Performance Test ===\n');
  
  // Reset the cache to force a fresh fetch
  console.log('Resetting RSS cache...');
  resetRssCache();
  
  // Measure performance
  const startTime = Date.now();
  
  // Perform synchronization
  console.log('\nRunning sync operation...');
  const result = await syncRssEvents();
  
  // Calculate total time
  const totalTime = (Date.now() - startTime) / 1000;
  const eventsPerSecond = result.totalEvents / totalTime;
  
  // Display results
  console.log('\n=== Performance Results ===');
  console.log(`Total events processed: ${result.totalEvents}`);
  console.log(`Total time: ${totalTime.toFixed(2)} seconds`);
  console.log(`Processing speed: ${eventsPerSecond.toFixed(2)} events/second`);
  console.log(`Events inserted: ${result.inserted}`);
  console.log(`Events updated: ${result.updated}`);
  console.log(`Events unchanged: ${result.unchanged}`);
  
  console.log('\n=== Test completed ===');
}

// Run the performance test
runPerformanceTest(); 