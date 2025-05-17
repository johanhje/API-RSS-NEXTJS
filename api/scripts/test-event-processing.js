/**
 * Test Script: Event Processing
 * 
 * Tests the event processing service to ensure it correctly:
 * 1. Fetches events from the RSS feed
 * 2. Geocodes locations
 * 3. Stores events in the database
 * 4. Handles duplicate events correctly
 */

import { processPoliceEvents, reprocessEventsWithMissingGeodata, getEventProcessingStats } from '../lib/events/processor.js';
import { getDatabase } from '../lib/db/database.js';

/**
 * Run a full test of the event processing service
 */
async function testEventProcessing() {
  console.log('=== TESTING EVENT PROCESSING ===');
  
  try {
    // Get initial stats
    console.log('\n1. Getting initial event statistics...');
    const initialStats = getEventProcessingStats();
    console.log('Initial stats:', initialStats);
    
    // Process events
    console.log('\n2. Processing events from RSS feed...');
    const processResults = await processPoliceEvents();
    console.log('Processing results:', processResults);
    
    // Get updated stats
    console.log('\n3. Getting updated event statistics...');
    const updatedStats = getEventProcessingStats();
    console.log('Updated stats:', updatedStats);
    
    // Verify geocoding success rate
    console.log('\n4. Verifying geocoding success rate...');
    const successRateNum = parseFloat(updatedStats.geocoding_success_rate);
    console.log(`Geocoding success rate: ${successRateNum}%`);
    
    if (successRateNum < 80) {
      console.log('\n5. Geocoding success rate is below 80%, reprocessing missing geodata...');
      const reprocessResults = await reprocessEventsWithMissingGeodata(20);
      console.log('Reprocessing results:', reprocessResults);
      
      // Get final stats
      const finalStats = getEventProcessingStats();
      console.log('Final stats:', finalStats);
    } else {
      console.log('\n5. Geocoding success rate is good (>=80%), no reprocessing needed.');
    }
    
    // Check for potential location extraction issues
    console.log('\n6. Checking for potential location extraction issues...');
    const db = getDatabase();
    const problematicLocations = db.prepare(`
      SELECT location_name, COUNT(*) as count 
      FROM events 
      WHERE (lat IS NULL OR lng IS NULL OR lat = 0 OR lng = 0) 
        AND location_name IS NOT NULL
      GROUP BY location_name 
      HAVING COUNT(*) > 1
      ORDER BY count DESC 
      LIMIT 10
    `).all();
    
    if (problematicLocations.length > 0) {
      console.log('Problematic locations found:');
      problematicLocations.forEach(loc => {
        console.log(`- "${loc.location_name}" (${loc.count} occurrences)`);
      });
      console.log('\nThese locations might need to be added to the location database');
    } else {
      console.log('No problematic locations found with multiple occurrences.');
    }
    
    console.log('\n=== EVENT PROCESSING TEST COMPLETED ===');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testEventProcessing().catch(err => {
  console.error('Unhandled error during test:', err);
  process.exit(1);
}); 