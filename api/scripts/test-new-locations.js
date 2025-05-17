/**
 * Test Geocoding for New Locations
 * 
 * This script tests the geocoding function with the newly added locations
 */

import { geocodeLocation } from '../lib/geocoding/nominatim.js';

// Test the newly added locations
const NEW_LOCATIONS = [
  "Väckelsång",
  "Urshult",
  "Linneryd",
  "Tingsryd",
  "Konga",
  "Rävemåla",
  "Ryd",
  "Norrhult",
  "Lenhovda",
  "Kosta",
  "Vissefjärda",
  "Hovmantorp",
  "Skruv"
];

// Test police event strings containing these locations
const TEST_EVENT_LOCATIONS = [
  "Trafikolycka, Väckelsång",
  "Brand, Urshult",
  "Stöld, Linneryd",
  "Trafikolycka personskada, Tingsryd",
  "Misshandel, Konga",
  "Rån, Rävemåla",
  "Inbrott, Ryd"
];

async function testNewLocations() {
  console.log('Testing geocoding for new locations...\n');
  
  let successCount = 0;
  let failureCount = 0;
  const startTime = performance.now();
  
  // Test simple location names
  console.log('=== Testing simple location names ===\n');
  for (const location of NEW_LOCATIONS) {
    const result = await geocodeLocation(location);
    
    if (result) {
      successCount++;
      console.log(`✅ ${location}: ${result.lat}, ${result.lon}`);
    } else {
      failureCount++;
      console.error(`❌ ${location}: Failed to geocode`);
    }
  }
  
  // Test event location strings
  console.log('\n=== Testing event location strings ===\n');
  for (const eventLocation of TEST_EVENT_LOCATIONS) {
    // Extract just the location part
    const parts = eventLocation.split(',');
    const locationName = parts.length > 1 ? parts[parts.length - 1].trim() : eventLocation;
    
    const result = await geocodeLocation(locationName);
    
    if (result) {
      successCount++;
      console.log(`✅ "${eventLocation}" -> ${locationName}: ${result.lat}, ${result.lon}`);
    } else {
      failureCount++;
      console.error(`❌ "${eventLocation}" -> ${locationName}: Failed to geocode`);
    }
  }
  
  const elapsedTime = ((performance.now() - startTime) / 1000).toFixed(2);
  const totalTests = NEW_LOCATIONS.length + TEST_EVENT_LOCATIONS.length;
  const successRate = ((successCount / totalTests) * 100).toFixed(2);
  
  console.log('\nGeocoding test results:');
  console.log(`Success: ${successCount}/${totalTests} (${successRate}%)`);
  console.log(`Failures: ${failureCount}`);
  console.log(`Time: ${elapsedTime} seconds`);
}

// Run the test
testNewLocations(); 