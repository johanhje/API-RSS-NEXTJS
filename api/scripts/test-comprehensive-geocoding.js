/**
 * Test Comprehensive Geocoding
 * 
 * This script tests the geocoding function with a wide variety of Swedish locations
 * to ensure the expanded database provides excellent coverage.
 */

import { geocodeLocation } from '../lib/geocoding/nominatim.js';
import { EXPANDED_LOCATION_DATABASE } from '../lib/geocoding/expanded-location-database.js';

// Sample location categories for testing
const TEST_LOCATIONS = {
  // Major cities
  'Större städer': [
    'Stockholm', 'Göteborg', 'Malmö', 'Uppsala', 'Linköping',
    'Västerås', 'Örebro', 'Helsingborg', 'Norrköping'
  ],
  
  // Medium sized cities
  'Mellanstora städer': [
    'Lund', 'Borås', 'Umeå', 'Gävle', 'Eskilstuna',
    'Södertälje', 'Karlstad', 'Halmstad', 'Växjö'
  ],
  
  // Smaller towns
  'Mindre städer': [
    'Visby', 'Kiruna', 'Arvika', 'Falkenberg', 'Ludvika',
    'Motala', 'Sala', 'Skövde', 'Piteå'
  ],
  
  // Kronoberg locations
  'Kronobergs län': [
    'Växjö', 'Alvesta', 'Ljungby', 'Tingsryd', 'Lessebo',
    'Uppvidinge', 'Markaryd', 'Älmhult', 'Braås', 'Rottne',
    'Väckelsång', 'Urshult', 'Ryd', 'Konga', 'Lenhovda'
  ],
  
  // Tourist destinations
  'Turistorter': [
    'Åre', 'Sälen', 'Marstrand', 'Smögen', 'Tylösand',
    'Mölle', 'Borgholm', 'Båstad', 'Abisko'
  ],
  
  // Municipalities
  'Kommuner': [
    'Stockholms kommun', 'Göteborgs kommun', 'Malmö kommun',
    'Växjö kommun', 'Ljungby kommun', 'Tingsryd kommun',
    'Örebro kommun', 'Karlskoga kommun', 'Kiruna kommun'
  ],
  
  // Complex names
  'Komplexa namn': [
    'Luleå tekniska universitet', 'Stockholms universitet',
    'Göteborgs universitet', 'Gamla Uppsala', 'Upplands-Väsby',
    'Kungliga Tekniska Högskolan', 'Södra Sandby'
  ],
  
  // Police event location strings
  'Polishändelser': [
    'Trafikolycka, Stockholm',
    'Brand, Upplands-Väsby',
    'Stöld, Göteborgs kommun',
    'Misshandel, Växjö',
    'Trafikolycka personskada, Tingsryd',
    'Rån, Väckelsång',
    'Skadegörelse, Sälen'
  ]
};

// Extract just the location part from an event string
function extractLocationFromEvent(eventString) {
  const parts = eventString.split(',');
  return parts.length > 1 ? parts[parts.length - 1].trim() : eventString;
}

async function testGeocoding() {
  console.log('Testing comprehensive geocoding with expanded database...\n');
  console.log(`Total locations in database: ${Object.keys(EXPANDED_LOCATION_DATABASE).length}\n`);
  
  let totalSuccessCount = 0;
  let totalFailureCount = 0;
  let totalTests = 0;
  
  const startTime = performance.now();
  
  // Test each category
  for (const [category, locations] of Object.entries(TEST_LOCATIONS)) {
    console.log(`=== Testing ${category} ===\n`);
    
    let categorySuccessCount = 0;
    let categoryFailureCount = 0;
    
    for (const location of locations) {
      totalTests++;
      
      // Handle police event strings differently
      let locationToTest = location;
      let displayLocation = location;
      
      if (category === 'Polishändelser') {
        locationToTest = extractLocationFromEvent(location);
        displayLocation = `"${location}" -> ${locationToTest}`;
      }
      
      // Test geocoding
      const result = await geocodeLocation(locationToTest);
      
      if (result) {
        categorySuccessCount++;
        totalSuccessCount++;
        console.log(`✅ ${displayLocation}: ${result.lat}, ${result.lon}`);
      } else {
        categoryFailureCount++;
        totalFailureCount++;
        console.error(`❌ ${displayLocation}: Failed to geocode`);
      }
    }
    
    // Show category summary
    const categoryTotal = locations.length;
    const categorySuccessRate = ((categorySuccessCount / categoryTotal) * 100).toFixed(2);
    console.log(`\n${category} result: ${categorySuccessCount}/${categoryTotal} (${categorySuccessRate}%)\n`);
  }
  
  const elapsedTime = ((performance.now() - startTime) / 1000).toFixed(2);
  const successRate = ((totalSuccessCount / totalTests) * 100).toFixed(2);
  
  console.log('\n=== Comprehensive Geocoding Test Results ===');
  console.log(`Total Success: ${totalSuccessCount}/${totalTests} (${successRate}%)`);
  console.log(`Total Failures: ${totalFailureCount}`);
  console.log(`Time: ${elapsedTime} seconds`);
  
  if (totalFailureCount > 0) {
    console.log('\nFailed locations might require adding to the database or improving the location extraction logic');
  } else {
    console.log('\n🎉 Perfect score! All locations were successfully geocoded');
  }
}

// Run the test
testGeocoding(); 