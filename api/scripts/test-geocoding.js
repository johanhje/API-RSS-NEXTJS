/**
 * Test Geocoding with Expanded Database
 * 
 * This script tests the geocoding function with sample locations to verify 
 * that the expanded database provides better coverage.
 */

import { geocodeLocation } from '../lib/geocoding/nominatim.js';

// Sample Swedish locations to test
const TEST_LOCATIONS = [
  "Stockholm",
  "Göteborg",
  "Malmö",
  "Uppsala",
  "Västerås",
  "Örebro",
  "Linköping",
  "Helsingborg",
  "Norrköping",
  "Jönköping",
  "Umeå",
  "Lund",
  "Borås",
  "Sundsvall",
  "Gävle",
  "Eskilstuna",
  "Södertälje",
  "Karlstad",
  "Växjö",
  "Halmstad",
  // Add some smaller/less common locations that might have been difficult before
  "Åre",
  "Malung",
  "Sveg",
  "Arjeplog",
  "Jokkmokk",
  "Pajala",
  "Gällivare",
  "Kalix",
  "Vilhelmina",
  "Strömsund",
  // Add locations with more complex names
  "Upplands Väsby",
  "Södra Sandby",
  "Västra Frölunda",
  "Norrtälje",
  "Östra Göinge",
  "Lilla Edet",
  "Stora Höga",
  "Hammarö",
  "Älvkarleby",
  "Åtvidaberg"
];

async function testGeocoding() {
  console.log('Testing geocoding with expanded database...\n');
  
  let successCount = 0;
  let failureCount = 0;
  const startTime = performance.now();
  
  for (const location of TEST_LOCATIONS) {
    const result = await geocodeLocation(location);
    
    if (result) {
      successCount++;
      console.log(`✅ ${location}: ${result.lat}, ${result.lon}`);
    } else {
      failureCount++;
      console.error(`❌ ${location}: Failed to geocode`);
    }
  }
  
  const elapsedTime = ((performance.now() - startTime) / 1000).toFixed(2);
  const successRate = ((successCount / TEST_LOCATIONS.length) * 100).toFixed(2);
  
  console.log('\nGeocoding test results:');
  console.log(`Success: ${successCount}/${TEST_LOCATIONS.length} (${successRate}%)`);
  console.log(`Failures: ${failureCount}`);
  console.log(`Time: ${elapsedTime} seconds`);
}

// Run the test
testGeocoding(); 