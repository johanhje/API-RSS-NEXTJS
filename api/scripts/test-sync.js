/**
 * Test RSS Synchronization
 * 
 * This script tests the RSS feed synchronization process
 */

import { syncRssEvents, getDatabaseStats } from '../lib/rss/sync.js';
import { getRssCacheStatus, resetRssCache } from '../lib/rss/parser.js';

async function runTest() {
  try {
    console.log('\n=== RSS Sync Test ===\n');
    
    // Get initial database stats
    console.log('Initial database state:');
    const initialStats = await getDatabaseStats();
    console.log(initialStats);
    console.log('---');
    
    // Reset the cache to force a fresh fetch
    console.log('Resetting RSS cache...');
    resetRssCache();
    
    // Perform synchronization
    console.log('\nRunning sync operation...');
    const result = await syncRssEvents();
    
    // Display results
    console.log('\nSync results:');
    console.log(result);
    
    // Get updated database stats
    console.log('\nUpdated database state:');
    const updatedStats = await getDatabaseStats();
    console.log(updatedStats);
    
    // Show cache status
    console.log('\nRSS cache status:');
    console.log(getRssCacheStatus());
    
    console.log('\n=== Test completed ===');
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
runTest(); 