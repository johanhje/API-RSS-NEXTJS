/**
 * Add Kronoberg County Locations to Database
 * 
 * This script adds a comprehensive list of locations in Kronoberg County (Kronobergs län)
 * to the expanded location database, including small towns and villages.
 */

import fs from 'fs';
import path from 'path';
import { EXPANDED_LOCATION_DATABASE } from '../lib/geocoding/expanded-location-database.js';

// Database file path
const DATABASE_FILE = path.join(process.cwd(), 'lib/geocoding/expanded-location-database.js');

// Locations in Kronoberg County (coordinates from OpenStreetMap)
const KRONOBERG_LOCATIONS = {
  // Huvudorter (Main municipalities)
  'växjö': { lat: 56.8790, lon: 14.8059 },
  'alvesta': { lat: 56.8989, lon: 14.5561 },
  'ljungby': { lat: 56.8333, lon: 13.9333 },
  'tingsryd': { lat: 56.5247, lon: 14.9744 },
  'lessebo': { lat: 56.7511, lon: 15.2667 },
  'uppvidinge': { lat: 56.9000, lon: 15.4500 },
  'markaryd': { lat: 56.4611, lon: 13.5958 },
  'älmhult': { lat: 56.5500, lon: 14.1333 },
  
  // Larger towns and villages in Växjö kommun
  'växjö kommun': { lat: 56.8790, lon: 14.8059 },
  'braås': { lat: 57.0925, lon: 15.0747 },
  'rottne': { lat: 57.0000, lon: 14.9000 },
  'åby': { lat: 56.9333, lon: 14.8333 },
  'gemla': { lat: 56.8500, lon: 14.6333 },
  'ingelstad': { lat: 56.7500, lon: 14.9167 },
  'åryd': { lat: 56.8333, lon: 15.0000 },
  'lamhult': { lat: 57.1333, lon: 14.5833 },
  'furuby': { lat: 56.8667, lon: 15.0833 },
  'berg': { lat: 56.9333, lon: 14.7333 },
  'sandsbro': { lat: 56.9250, lon: 14.8500 },
  'norremark': { lat: 56.9000, lon: 14.8000 },
  'tävelsås': { lat: 56.7500, lon: 14.8333 },
  'vederslöv': { lat: 56.7667, lon: 14.7667 },
  'öja': { lat: 56.7333, lon: 14.5833 },
  'öjaby': { lat: 56.9000, lon: 14.7333 },
  'tolg': { lat: 57.0500, lon: 14.8833 },
  'dädesjö': { lat: 57.0167, lon: 15.1833 },
  
  // Alvesta kommun
  'alvesta kommun': { lat: 56.9000, lon: 14.5500 },
  'moheda': { lat: 57.0000, lon: 14.5667 },
  'vislanda': { lat: 56.7833, lon: 14.4500 },
  'grimslöv': { lat: 56.7000, lon: 14.5333 },
  'hjortsberga': { lat: 56.8667, lon: 14.5833 },
  'torpsbruk': { lat: 57.0500, lon: 14.5667 },
  'lönashult': { lat: 56.6667, lon: 14.3333 },
  
  // Ljungby kommun
  'ljungby kommun': { lat: 56.8333, lon: 13.9333 },
  'lagan': { lat: 56.9000, lon: 13.9667 },
  'lidhult': { lat: 56.8000, lon: 13.4333 },
  'ryssby': { lat: 56.9833, lon: 14.0500 },
  'vittaryd': { lat: 57.0000, lon: 14.0000 },
  'bolmsö': { lat: 56.9500, lon: 13.7667 },
  'angelstad': { lat: 56.7833, lon: 13.9167 },
  'hamneda': { lat: 56.7000, lon: 13.8833 },
  'agunnaryd': { lat: 56.6500, lon: 14.0833 },
  
  // Tingsryd kommun
  'tingsryd kommun': { lat: 56.5247, lon: 14.9744 },
  'väckelsång': { lat: 56.6445, lon: 14.9108 },
  'urshult': { lat: 56.4985, lon: 14.7981 },
  'linneryd': { lat: 56.6482, lon: 15.1107 },
  'konga': { lat: 56.5955, lon: 15.1158 },
  'rävemåla': { lat: 56.5541, lon: 15.3113 },
  'ryd': { lat: 56.4545, lon: 14.6536 },
  'fridafors': { lat: 56.4333, lon: 14.6667 },
  'tingsryd-dångebo': { lat: 56.5167, lon: 14.9667 },
  'älmeboda': { lat: 56.5500, lon: 15.0333 },
  'yxnanäs': { lat: 56.6000, lon: 15.2333 },
  
  // Lessebo kommun
  'lessebo kommun': { lat: 56.7511, lon: 15.2667 },
  'hovmantorp': { lat: 56.7833, lon: 15.1333 },
  'kosta': { lat: 56.8389, lon: 15.4000 },
  'skruv': { lat: 56.6706, lon: 15.3536 },
  'bergdala': { lat: 56.8167, lon: 15.2667 },
  
  // Uppvidinge kommun
  'uppvidinge kommun': { lat: 56.9000, lon: 15.4500 },
  'åseda': { lat: 57.1667, lon: 15.3500 },
  'lenhovda': { lat: 57.0489, lon: 15.4526 },
  'norrhult': { lat: 57.2148, lon: 15.6570 },
  'alstermo': { lat: 57.0833, lon: 15.5667 },
  'älghult': { lat: 57.1444, lon: 15.7611 },
  'fröseke': { lat: 57.1844, lon: 15.6359 },
  'sävsjöström': { lat: 57.0167, lon: 15.4500 },
  
  // Markaryd kommun
  'markaryd kommun': { lat: 56.4611, lon: 13.5958 },
  'strömsnäsbruk': { lat: 56.5500, lon: 13.7333 },
  'traryd': { lat: 56.5167, lon: 13.7500 },
  'hinneryd': { lat: 56.3667, lon: 13.5667 },
  'vivljunga': { lat: 56.5000, lon: 13.6500 },
  
  // Älmhult kommun
  'älmhult kommun': { lat: 56.5500, lon: 14.1333 },
  'diö': { lat: 56.6333, lon: 14.2167 },
  'liatorp': { lat: 56.6000, lon: 14.2667 },
  'eneryda': { lat: 56.6833, lon: 14.3167 },
  'göteryd': { lat: 56.5833, lon: 14.0667 },
  'delary': { lat: 56.4833, lon: 14.0833 },
  'häradsbäck': { lat: 56.4000, lon: 14.2500 },
  'pjätteryd': { lat: 56.6333, lon: 14.1333 },
  'hallaryd': { lat: 56.4000, lon: 14.1000 },
  'virestad': { lat: 56.4167, lon: 14.2667 }
};

// Merge with existing database and add new locations
function updateLocationDatabase() {
  // Create a merged database
  const mergedDatabase = { ...EXPANDED_LOCATION_DATABASE };
  let addedCount = 0;
  let existingCount = 0;
  let updatedCount = 0;
  
  // Add new locations if they don't already exist
  for (const [name, coords] of Object.entries(KRONOBERG_LOCATIONS)) {
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