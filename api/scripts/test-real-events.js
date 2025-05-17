/**
 * Test Geocoding with Real Police Event Locations
 * 
 * This script tests the geocoding function with real location strings
 * from police events that might have been difficult to parse before.
 */

import { geocodeLocation } from '../lib/geocoding/nominatim.js';

// Simple function to extract location from an event title
function extractLocationName(eventTitle) {
  // Extract from title: Usually follows format "Type, Location"
  const titleParts = eventTitle.split(',');
  
  if (titleParts.length > 1) {
    return titleParts.slice(1).join(',').trim();
  }
  
  return 'Unknown';
}

// Sample RSS event location strings to test
const TEST_EVENT_LOCATIONS = [
  "Vållande till kroppsskada, Karlskrona",
  "Misshandel, Staffanstorp",
  "Trafikolycka, Svedala",
  "Skadegörelse, Svalöv",
  "Stöld, Kristianstad",
  "Åldringsbrott, Södertälje",
  "Trafikbrott, Luleå",
  "Trafikkontroll, Västernorrlands län",
  "Misshandel, Lund",
  "Räddningsinsats, Skinnskatteberg",
  "Åldringsbrott, Södertälje",
  "Rattfylleri, Kramfors",
  "Åldringsbrott, Stockholm",
  "Inbrott, Luleå",
  "Åldringsbrott, Stockholm",
  "Misshandel, Skellefteå",
  "Trafikolycka, Sandviken",
  "Fylleri/LOB, Umeå",
  "Åldringsbrott, Botkyrka",
  "Åldringsbrott, Haninge",
  // More complex event locations
  "Trafikolycka, personskada, Enköping",
  "Trafikolycka, singel, Avesta",
  "Trafikolycka, vilt, Askersund",
  "Trafikolycka, personskada, Varberg",
  "Trafikolycka, personskada, Gävle",
  "Trafikolycka, personskada, Ulricehamn",
  "Trafikolycka, singel, Lekeberg",
  "Övrigt, Sigtuna",
  "Trafikolycka, Sundsvall",
  "Övrigt, Lerum",
  "Morddråp, Kramfors",
  "Brand, Västerås"
];

async function testRealEventGeocoding() {
  console.log('Testing geocoding with real police event locations...\n');
  
  let successCount = 0;
  let failureCount = 0;
  const startTime = performance.now();
  const results = [];
  
  for (const eventLocation of TEST_EVENT_LOCATIONS) {
    // Extract just the location part from the event string
    const locationName = extractLocationName(eventLocation);
    
    const result = await geocodeLocation(locationName);
    
    if (result) {
      successCount++;
      console.log(`✅ "${eventLocation}" -> ${locationName}: ${result.lat}, ${result.lon}`);
      results.push({ eventLocation, locationName, success: true, coordinates: result });
    } else {
      failureCount++;
      console.error(`❌ "${eventLocation}" -> ${locationName}: Failed to geocode`);
      results.push({ eventLocation, locationName, success: false });
    }
  }
  
  const elapsedTime = ((performance.now() - startTime) / 1000).toFixed(2);
  const successRate = ((successCount / TEST_EVENT_LOCATIONS.length) * 100).toFixed(2);
  
  console.log('\nGeocoding test results:');
  console.log(`Success: ${successCount}/${TEST_EVENT_LOCATIONS.length} (${successRate}%)`);
  console.log(`Failures: ${failureCount}`);
  console.log(`Time: ${elapsedTime} seconds`);
  console.log(`Processing speed: ${(TEST_EVENT_LOCATIONS.length / parseFloat(elapsedTime)).toFixed(2)} events/second`);
  
  return results;
}

// Run the test
testRealEventGeocoding(); 