/**
 * Add Police-Specific Location References
 * 
 * This script adds location references that are commonly found in police reports,
 * including administrative regions, län, and police districts.
 */

import fs from 'fs';
import path from 'path';
import { EXPANDED_LOCATION_DATABASE } from '../lib/geocoding/expanded-location-database.js';

// Database file path
const DATABASE_FILE = path.join(process.cwd(), 'lib/geocoding/expanded-location-database.js');

// Police-specific locations, regions and administrative areas
const POLICE_LOCATIONS = {
  // Common administrative regions in police reports
  'stockholms län': { lat: 59.3293, lon: 18.0686 },
  'västra götalands län': { lat: 57.7089, lon: 11.9746 },
  'skåne län': { lat: 55.605, lon: 13.0038 },
  'östergötlands län': { lat: 58.4108, lon: 15.6214 },
  'södermanlands län': { lat: 59.371, lon: 16.5099 },
  'örebro län': { lat: 59.2753, lon: 15.2134 },
  'västmanlands län': { lat: 59.6099, lon: 16.5448 },
  'jönköpings län': { lat: 57.7826, lon: 14.1618 },
  'hallands län': { lat: 56.6744, lon: 12.8577 },
  'kalmar län': { lat: 56.6634, lon: 16.3566 },
  'kronobergs län': { lat: 56.879, lon: 14.8059 },
  'blekinge län': { lat: 56.1616, lon: 15.5866 },
  'dalarnas län': { lat: 60.6065, lon: 15.6355 },
  'gävleborgs län': { lat: 60.6749, lon: 17.1413 },
  'västernorrlands län': { lat: 62.3913, lon: 17.3069 },
  'jämtlands län': { lat: 63.1792, lon: 14.6357 },
  'västerbottens län': { lat: 63.8258, lon: 20.263 },
  'norrbottens län': { lat: 65.5842, lon: 22.1567 },
  'uppsala län': { lat: 59.8586, lon: 17.6389 },
  'värmlands län': { lat: 59.4022, lon: 13.5115 },
  'gotlands län': { lat: 57.6389, lon: 18.2946 },
  
  // All kommuner for police reports
  'stockholms kommun': { lat: 59.33, lon: 18.065 },
  'göteborgs kommun': { lat: 57.7, lon: 11.9667 },
  'malmö kommun': { lat: 55.6067, lon: 13 },
  'uppsala kommun': { lat: 59.8583, lon: 17.645 },
  'linköpings kommun': { lat: 58.41, lon: 15.6217 },
  'västerås kommun': { lat: 59.6167, lon: 16.55 },
  'örebro kommun': { lat: 59.275, lon: 15.2167 },
  'helsingborgs kommun': { lat: 56.05, lon: 12.7 },
  'norrköpings kommun': { lat: 58.5833, lon: 16.1833 },
  'jönköpings kommun': { lat: 57.78, lon: 14.1617 },
  'umeå kommun': { lat: 63.8333, lon: 20.25 },
  'lunds kommun': { lat: 55.7, lon: 13.1833 },
  'borås kommun': { lat: 57.7333, lon: 12.9167 },
  'sundsvalls kommun': { lat: 62.3833, lon: 17.3 },
  'gävle kommun': { lat: 60.6667, lon: 17.1667 },
  'växjö kommun': { lat: 56.879, lon: 14.8059 },
  'södertälje kommun': { lat: 59.195, lon: 17.6233 },
  'karlstads kommun': { lat: 59.4, lon: 13.5 },
  'eskilstuna kommun': { lat: 59.3717, lon: 16.51 },
  'halmstads kommun': { lat: 56.6744, lon: 12.8577 },
  
  // Police regions / districts
  'polisregion stockholm': { lat: 59.3293, lon: 18.0686 },
  'polisregion väst': { lat: 57.7089, lon: 11.9746 },
  'polisregion syd': { lat: 55.605, lon: 13.0038 },
  'polisregion öst': { lat: 58.4108, lon: 15.6214 },
  'polisregion bergslagen': { lat: 59.2753, lon: 15.2134 },
  'polisregion mitt': { lat: 59.8586, lon: 17.6389 },
  'polisregion nord': { lat: 63.8258, lon: 20.263 },
  
  // Common police report prefixes / variations
  'i närheten av stockholm': { lat: 59.3293, lon: 18.0686 },
  'vid göteborg': { lat: 57.7089, lon: 11.9746 },
  'nära malmö': { lat: 55.605, lon: 13.0038 },
  'stockholmsområdet': { lat: 59.3293, lon: 18.0686 },
  'göteborgsområdet': { lat: 57.7089, lon: 11.9746 },
  'malmöområdet': { lat: 55.605, lon: 13.0038 },
  'centrala stockholm': { lat: 59.3293, lon: 18.0686 },
  'centrala göteborg': { lat: 57.7089, lon: 11.9746 },
  'centrala malmö': { lat: 55.605, lon: 13.0038 },
  
  // Special patterns for KTH and similar places
  'kth': { lat: 59.35, lon: 18.07 },
  'kungliga tekniska högskolan': { lat: 59.35, lon: 18.07 },
  
  // Common variations/abbreviations
  'sthlm': { lat: 59.3293, lon: 18.0686 },
  'gbg': { lat: 57.7089, lon: 11.9746 },
  'sth': { lat: 59.3293, lon: 18.0686 },
  'märsta': { lat: 59.6333, lon: 17.85 },
  'upplands väsby': { lat: 59.5, lon: 17.9 },
  'upplands-väsby': { lat: 59.5, lon: 17.9 },
  'upplandsväsby': { lat: 59.5, lon: 17.9 },
  
  // Common terms in police reports with fuzzy location
  'landvetter flygplats': { lat: 57.6697, lon: 12.2958 },
  'arlanda flygplats': { lat: 59.6497, lon: 17.9237 },
  'arlanda': { lat: 59.6497, lon: 17.9237 },
  'landvetter': { lat: 57.6697, lon: 12.2958 },
  'skavsta flygplats': { lat: 58.7886, lon: 16.9029 },
  'skavsta': { lat: 58.7886, lon: 16.9029 },
  'e4': { lat: 59.3293, lon: 18.0686 }, // Default to Stockholm for highways
  'e6': { lat: 57.7089, lon: 11.9746 }, // Default to Gothenburg
  'e20': { lat: 59.3293, lon: 18.0686 }
};

// Merge with existing database and add new locations
function updateLocationDatabase() {
  // Create a merged database
  const mergedDatabase = { ...EXPANDED_LOCATION_DATABASE };
  let addedCount = 0;
  let existingCount = 0;
  let updatedCount = 0;
  
  // Add new locations if they don't already exist
  for (const [name, coords] of Object.entries(POLICE_LOCATIONS)) {
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