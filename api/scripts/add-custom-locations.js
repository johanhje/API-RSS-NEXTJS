/**
 * Add Custom Locations to Database
 * 
 * This script adds additional Swedish locations to the expanded location database.
 */

import fs from 'fs';
import path from 'path';
import { EXPANDED_LOCATION_DATABASE } from '../lib/geocoding/expanded-location-database.js';

// Database file path
const DATABASE_FILE = path.join(process.cwd(), 'lib/geocoding/expanded-location-database.js');

// Custom locations to add (coordinates obtained from OpenStreetMap)
const CUSTOM_LOCATIONS = {
  // Requested locations
  'väckelsång': { lat: 56.6445, lon: 14.9108 },
  'urshult': { lat: 56.4985, lon: 14.7981 },
  'linneryd': { lat: 56.6482, lon: 15.1107 },
  'konga': { lat: 56.5955, lon: 15.1158 },
  'rävemåla': { lat: 56.5541, lon: 15.3113 },
  'ryd': { lat: 56.4545, lon: 14.6536 },
  
  // Additional smaller towns in Sweden
  'lessebo': { lat: 56.7511, lon: 15.2667 },
  'norrhult': { lat: 57.2148, lon: 15.6570 },
  'lenhovda': { lat: 57.0489, lon: 15.4526 },
  'kosta': { lat: 56.8389, lon: 15.4000 },
  'emmaboda': { lat: 56.6281, lon: 15.5382 },
  'vissefjärda': { lat: 56.5000, lon: 15.5833 },
  'hovmantorp': { lat: 56.7833, lon: 15.1333 },
  'skruv': { lat: 56.6706, lon: 15.3536 },
  'nybro': { lat: 56.7445, lon: 15.9075 },
  'broakulla': { lat: 56.5998, lon: 15.4193 },
  'älghult': { lat: 57.1445, lon: 15.7609 },
  'fröseke': { lat: 57.1844, lon: 15.6359 },
  'älmeboda': { lat: 56.5500, lon: 15.0333 },
  'eringsboda': { lat: 56.4333, lon: 15.3667 },
  'kallinge': { lat: 56.2459, lon: 15.2889 },
  'gullabo': { lat: 56.4833, lon: 15.7333 },
  'bergkvara': { lat: 56.3970, lon: 16.0790 },
  'torsås': { lat: 56.4167, lon: 15.8333 },
  'söderåkra': { lat: 56.4667, lon: 16.0333 },
  'halltorp': { lat: 56.5000, lon: 16.0833 },
  'långasjö': { lat: 56.5900, lon: 15.4636 },
  'alsterbro': { lat: 56.9333, lon: 15.8833 },
  'åseda': { lat: 57.1667, lon: 15.3500 },
  'högsby': { lat: 57.1664, lon: 16.0321 },
  'fågelfors': { lat: 57.2000, lon: 15.8333 },
  
  // Additional larger towns
  'växjö': { lat: 56.8790, lon: 14.8080 },
  'kalmar': { lat: 56.6634, lon: 16.3566 },
  'karlskrona': { lat: 56.1612, lon: 15.5869 },
  'karlshamn': { lat: 56.1715, lon: 14.8630 },
  'ronneby': { lat: 56.2088, lon: 15.2762 },
  'ljungby': { lat: 56.8329, lon: 13.9407 },
  'älmhult': { lat: 56.5511, lon: 14.1392 },
  'olofström': { lat: 56.2780, lon: 14.5287 },
  'sölvesborg': { lat: 56.0507, lon: 14.5872 }
};

// Merge with existing database and add new locations
function updateLocationDatabase() {
  // Create a merged database
  const mergedDatabase = { ...EXPANDED_LOCATION_DATABASE };
  let addedCount = 0;
  let existingCount = 0;
  
  // Add new locations if they don't already exist
  for (const [name, coords] of Object.entries(CUSTOM_LOCATIONS)) {
    if (mergedDatabase[name]) {
      console.log(`Location already exists: ${name}`);
      existingCount++;
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
 * - Custom locations
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
  console.log(`- ${existingCount} locations already existed`);
  console.log(`- Total locations in database: ${Object.keys(mergedDatabase).length}`);
}

// Run the update
updateLocationDatabase(); 