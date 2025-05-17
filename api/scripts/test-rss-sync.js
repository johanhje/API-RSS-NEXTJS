/**
 * Test RSS Synchronization Performance
 * 
 * This script tests the performance of the RSS synchronization process
 * with the improved geocoding database.
 */

import { syncRssEvents, getDatabaseStats } from '../lib/rss/sync.js';
import { resetRssCache } from '../lib/rss/parser.js';

async function testRssSync() {
  console.log('Testing RSS synchronization performance...\n');
  
  // Get initial database stats
  const initialStats = await getDatabaseStats();
  console.log('Initial database stats:');
  console.log(`- Total events: ${initialStats.totalEvents}`);
  console.log(`- Latest event: ${initialStats.latestEventDate || 'None'}`);
  
  // Reset cache to ensure fresh data
  resetRssCache();
  console.log('\nCache reset, starting sync...');
  
  // Measure performance
  const startTime = performance.now();
  
  // Run the sync process
  const syncResult = await syncRssEvents();
  
  // Calculate metrics
  const elapsedTime = ((performance.now() - startTime) / 1000).toFixed(2);
  const totalProcessed = syncResult.totalEvents;
  const eventsPerSecond = (totalProcessed / parseFloat(elapsedTime)).toFixed(2);
  
  // Get final stats
  const finalStats = await getDatabaseStats();
  
  // Print results
  console.log('\nRSS sync completed successfully!');
  console.log('\nSync results:');
  console.log(`- Total events processed: ${totalProcessed}`);
  console.log(`- New events: ${syncResult.inserted}`);
  console.log(`- Updated events: ${syncResult.updated}`);
  console.log(`- Unchanged events: ${syncResult.unchanged}`);
  
  console.log('\nPerformance metrics:');
  console.log(`- Total time: ${elapsedTime} seconds`);
  console.log(`- Processing speed: ${eventsPerSecond} events/second`);
  
  console.log('\nFinal database stats:');
  console.log(`- Total events: ${finalStats.totalEvents}`);
  console.log(`- Latest event: ${finalStats.latestEventDate || 'None'}`);
  console.log(`- Net change: ${finalStats.totalEvents - initialStats.totalEvents} events`);
  
  return {
    initialStats,
    syncResult,
    finalStats,
    performance: {
      totalTime: elapsedTime,
      eventsPerSecond
    }
  };
}

// Run the test
testRssSync()
  .then(result => {
    console.log('\nTest completed successfully.');
  })
  .catch(error => {
    console.error('Error running test:', error);
  }); 