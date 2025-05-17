/**
 * Add or Fix Specific Locations
 * 
 * This script adds or updates specific locations that failed in the comprehensive testing.
 */

import fs from 'fs';
import path from 'path';
import { EXPANDED_LOCATION_DATABASE } from '../lib/geocoding/expanded-location-database.js';

// Database file path
const DATABASE_FILE = path.join(process.cwd(), 'lib/geocoding/expanded-location-database.js');

// Add or fix specific locations
const FIXED_LOCATIONS = {
  // Fix locations that failed in testing
  'upplands-väsby': { lat: 59.5, lon: 17.9 }, // Match for Upplands-Väsby (with hyphen)
  'upplands väsby': { lat: 59.5, lon: 17.9 }, // Already exists but add variation without hyphen
  'södra sandby': { lat: 55.7172, lon: 13.3474 },
  
  // Add variations for common misspellings or alternative formats
  'sthlm': { lat: 59.3293, lon: 18.0686 }, // Short for Stockholm
  'gbg': { lat: 57.7089, lon: 11.9746 }, // Short for Göteborg
  'vaxjo': { lat: 56.879, lon: 14.8059 }, // Without umlauts
  'malmo': { lat: 55.605, lon: 13.0038 }, // Without umlauts
  'vaeckelsaang': { lat: 56.6445, lon: 14.9108 }, // Alternative spelling
  'vaexjoe': { lat: 56.879, lon: 14.8059 }, // Alternative spelling
  
  // Handle region names often used in police reports
  'stockholms län': { lat: 59.3293, lon: 18.0686 },
  'västra götalands län': { lat: 57.7089, lon: 11.9746 },
  'skåne län': { lat: 55.605, lon: 13.0038 },
  'kronobergs län': { lat: 56.879, lon: 14.8059 },
  'västernorrlands län': { lat: 62.3913, lon: 17.3069 },
  'jämtlands län': { lat: 63.1792, lon: 14.6357 },
  'norrbottens län': { lat: 65.5842, lon: 22.1567 },
  
  // Location names with "i"/"på" prefixes sometimes found in police reports
  'i stockholm': { lat: 59.3293, lon: 18.0686 },
  'i göteborg': { lat: 57.7089, lon: 11.9746 },
  'i malmö': { lat: 55.605, lon: 13.0038 },
  'på gotland': { lat: 57.4684, lon: 18.4867 },
  'i västerås': { lat: 59.6099, lon: 16.5448 }
};

// Merge with existing database and add new locations
function updateLocationDatabase() {
  // Create a merged database
  const mergedDatabase = { ...EXPANDED_LOCATION_DATABASE };
  let addedCount = 0;
  let existingCount = 0;
  let updatedCount = 0;
  
  // Add new locations if they don't already exist
  for (const [name, coords] of Object.entries(FIXED_LOCATIONS)) {
    if (mergedDatabase[name]) {
      // Check if coordinates are different
      if (mergedDatabase[name].lat !== coords.lat || mergedDatabase[name].lon !== coords.lon) {
        console.log(`Updating location: ${name} (${mergedDatabase[name].lat}, ${mergedDatabase[name].lon}) -> (${coords.lat}, ${coords.lon})`);
        mergedDatabase[name] = coords;
        updatedCount++;
      } else {
        console.log(`Location already exists: ${name}`);
        existingCount++;
      }
    } else {
      mergedDatabase[name] = coords;
      console.log(`Added new location: ${name} (${coords.lat}, ${coords.lon})`);
      addedCount++;
    }
  }
  
  // Generate the database code
  const entries = Object.entries(mergedDatabase)
    .sort((a, b) => a[0].localeCompare(b[0])) // Sort alphabetically
    .map(([name, coords]) => `  '${name}': { lat: ${coords.lat}, lon: ${coords.lon} }`)
    .join(',\n');
  
  const databaseCode = `/**
 * Expanded Database of pre-defined coordinates for Swedish locations
 * Auto-generated with data from SCB/OSM APIs and custom additions
 * 
 * Includes:
 * - Urban areas (tätorter)
 * - Small localities (småorter)
 * - Historical cities (städer)
 * - Municipalities (kommuner)
 * - Tourist destinations
 * - Major islands and lakes
 * - University towns
 * - Industrial cities
 * - Custom locations
 * - Kronoberg county comprehensive coverage
 * - Location variations and misspellings
 * 
 * Total locations: ${Object.keys(mergedDatabase).length}
 */

export const EXPANDED_LOCATION_DATABASE = {
${entries}
};
`;

  // Write to file
  fs.writeFileSync(DATABASE_FILE, databaseCode);
  
  console.log(`\nLocation database updated successfully:`);
  console.log(`- Added ${addedCount} new locations`);
  console.log(`- Updated ${updatedCount} existing locations`);
  console.log(`- ${existingCount} locations already existed (unchanged)`);
  console.log(`- Total locations in database: ${Object.keys(mergedDatabase).length}`);
}

// Run the update
updateLocationDatabase(); 