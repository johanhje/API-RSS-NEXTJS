/**
 * Add Special Case Locations
 * 
 * This script adds special case locations that appeared in the RSS test
 * but couldn't be geocoded with the standard database.
 */

import fs from 'fs';
import path from 'path';
import { EXPANDED_LOCATION_DATABASE } from '../lib/geocoding/expanded-location-database.js';

// Database file path
const DATABASE_FILE = path.join(process.cwd(), 'lib/geocoding/expanded-location-database.js');

// Special case locations from RSS feed
const SPECIAL_CASE_LOCATIONS = {
  // Common report types that include län without specific location
  'övrigt, västra götalands län': { lat: 57.7089, lon: 11.9746 },
  'övrigt, hallands län': { lat: 56.6744, lon: 12.8577 },
  'övrigt, dalarnas län': { lat: 60.6065, lon: 15.6355 },
  'övrigt, värmlands län': { lat: 59.4022, lon: 13.5115 },
  'övrigt, skåne län': { lat: 55.605, lon: 13.0038 },
  'övrigt, blekinge län': { lat: 56.1616, lon: 15.5866 },
  'övrigt, kronobergs län': { lat: 56.879, lon: 14.8059 },
  
  // Trafikkontroll reports often include län without specific location
  'trafikkontroll, jämtlands län': { lat: 63.1792, lon: 14.6357 },
  'trafikkontroll, västerbottens län': { lat: 63.8258, lon: 20.263 },
  'trafikkontroll, norrbottens län': { lat: 65.5842, lon: 22.1567 },
  'trafikkontroll, västernorrlands län': { lat: 62.3913, lon: 17.3069 },
  
  // Nightly summaries for regions
  'sammanfattning natt, östergötlands län': { lat: 58.4108, lon: 15.6214 },
  'sammanfattning natt, jönköpings län': { lat: 57.7826, lon: 14.1618 },
  'sammanfattning natt, södermanlands län': { lat: 59.371, lon: 16.5099 },
  'sammanfattning natt, norrbottens län': { lat: 65.5842, lon: 22.1567 },
  'sammanfattning natt, västerbottens län': { lat: 63.8258, lon: 20.263 },
  'sammanfattning natt, västernorrlands län': { lat: 62.3913, lon: 17.3069 },
  'sammanfattning natt, jämtlands län': { lat: 63.1792, lon: 14.6357 },
  'sammanfattning natt, västra götalands län': { lat: 57.7089, lon: 11.9746 },
  'sammanfattning natt, hallands län': { lat: 56.6744, lon: 12.8577 },
  'sammanfattning natt, värmlands län': { lat: 59.4022, lon: 13.5115 },
  'sammanfattning natt, dalarnas län': { lat: 60.6065, lon: 15.6355 },
  
  // Evening and night summaries
  'sammanfattning kväll och natt, västra götalands län': { lat: 57.7089, lon: 11.9746 },
  'sammanfattning kväll och natt, hallands län': { lat: 56.6744, lon: 12.8577 },
  'sammanfattning kväll och natt, kronobergs län': { lat: 56.879, lon: 14.8059 },
  'sammanfattning kväll och natt, blekinge län': { lat: 56.1616, lon: 15.5866 },
  'sammanfattning kväll och natt, skåne län': { lat: 55.605, lon: 13.0038 },
  
  // Specific locations that were problematic
  'upplands-bro': { lat: 59.5333, lon: 17.6333 },
  'upplandsbro': { lat: 59.5333, lon: 17.6333 },
  'upplands bro': { lat: 59.5333, lon: 17.6333 },
  
  // Specific event types
  'bedrägeri, östergötlands län': { lat: 58.4108, lon: 15.6214 },

  // Handle variations of location strings
  'sammanfattning dag, stockholms län': { lat: 59.3293, lon: 18.0686 },
  'sammanfattning helg, stockholms län': { lat: 59.3293, lon: 18.0686 },
  'sammanfattning dag, västra götalands län': { lat: 57.7089, lon: 11.9746 },
  'sammanfattning helg, västra götalands län': { lat: 57.7089, lon: 11.9746 },
  'sammanfattning förmiddag, stockholms län': { lat: 59.3293, lon: 18.0686 },
  'sammanfattning eftermiddag, stockholms län': { lat: 59.3293, lon: 18.0686 }
};

// Merge with existing database and add new locations
function updateLocationDatabase() {
  // Create a merged database
  const mergedDatabase = { ...EXPANDED_LOCATION_DATABASE };
  let addedCount = 0;
  let existingCount = 0;
  let updatedCount = 0;
  
  // Add new locations if they don't already exist
  for (const [name, coords] of Object.entries(SPECIAL_CASE_LOCATIONS)) {
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
 * - Police-specific administrative regions
 * - Special case locations for RSS feeds
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