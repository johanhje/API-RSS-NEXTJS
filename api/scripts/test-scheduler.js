/**
 * Test RSS Scheduler
 * 
 * This script tests the RSS scheduler functionality directly
 */

import { startScheduler, stopScheduler, getSchedulerStatus } from '../lib/rss/scheduler.js';

async function testScheduler() {
  try {
    console.log('\n=== RSS Scheduler Test ===\n');
    
    // Get initial scheduler status
    console.log('Initial scheduler status:');
    console.log(getSchedulerStatus());
    
    // Start the scheduler with a 30-second interval
    console.log('\nStarting scheduler...');
    const started = startScheduler(30);
    console.log(`Scheduler started: ${started}`);
    
    // Wait for the initial sync to complete (should take a few seconds)
    console.log('\nWaiting for initial sync to complete...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Get updated status
    console.log('\nScheduler status after starting:');
    console.log(getSchedulerStatus());
    
    // Stop the scheduler
    console.log('\nStopping scheduler...');
    const stopped = stopScheduler();
    console.log(`Scheduler stopped: ${stopped}`);
    
    // Get final status
    console.log('\nFinal scheduler status:');
    console.log(getSchedulerStatus());
    
    console.log('\n=== Test completed ===');
  } catch (error) {
    console.error('Error during scheduler test:', error);
  }
}

// Run the test
testScheduler(); 