/**
 * Add Major Swedish Locations to Database
 * 
 * This script adds all major Swedish cities, towns, and municipalities to the expanded location database
 */

import fs from 'fs';
import path from 'path';
import { EXPANDED_LOCATION_DATABASE } from '../lib/geocoding/expanded-location-database.js';

// Database file path
const DATABASE_FILE = path.join(process.cwd(), 'lib/geocoding/expanded-location-database.js');

// Major Swedish cities and towns (coordinates from OpenStreetMap)
const MAJOR_SWEDISH_LOCATIONS = {
  // Major cities (Sveriges största städer)
  'stockholm': { lat: 59.3293, lon: 18.0686 },
  'göteborg': { lat: 57.7089, lon: 11.9746 },
  'malmö': { lat: 55.6050, lon: 13.0038 },
  'uppsala': { lat: 59.8586, lon: 17.6389 },
  'västerås': { lat: 59.6099, lon: 16.5448 },
  'örebro': { lat: 59.2753, lon: 15.2134 },
  'linköping': { lat: 58.4108, lon: 15.6214 },
  'helsingborg': { lat: 56.0465, lon: 12.6945 },
  'jönköping': { lat: 57.7826, lon: 14.1618 },
  'norrköping': { lat: 58.5877, lon: 16.1924 },
  'lund': { lat: 55.7047, lon: 13.1910 },
  'umeå': { lat: 63.8258, lon: 20.2630 },
  'gävle': { lat: 60.6749, lon: 17.1413 },
  'borås': { lat: 57.7210, lon: 12.9401 },
  'södertälje': { lat: 59.1956, lon: 17.6259 },
  'eskilstuna': { lat: 59.3710, lon: 16.5099 },
  'halmstad': { lat: 56.6744, lon: 12.8577 },
  'växjö': { lat: 56.8790, lon: 14.8059 },
  'sundsvall': { lat: 62.3913, lon: 17.3069 },
  'karlstad': { lat: 59.4022, lon: 13.5115 },
  
  // Regional centers (Större regionstäder)
  'luleå': { lat: 65.5842, lon: 22.1567 },
  'östersund': { lat: 63.1792, lon: 14.6357 },
  'falun': { lat: 60.6065, lon: 15.6355 },
  'skellefteå': { lat: 64.7507, lon: 20.9528 },
  'trollhättan': { lat: 58.2829, lon: 12.2853 },
  'kalmar': { lat: 56.6634, lon: 16.3566 },
  'karlskrona': { lat: 56.1616, lon: 15.5866 },
  'kristianstad': { lat: 56.0294, lon: 14.1567 },
  'visby': { lat: 57.6389, lon: 18.2946 },
  'nyköping': { lat: 58.7527, lon: 17.0146 },
  'karlskoga': { lat: 59.3264, lon: 14.5241 },
  'kiruna': { lat: 67.8558, lon: 20.2253 },
  
  // Popular tourist destinations (Kända turistorter)
  'marstrand': { lat: 57.8858, lon: 11.5902 },
  'mölle': { lat: 56.2826, lon: 12.4977 },
  'granna': { lat: 58.0252, lon: 14.4700 },
  'sigtuna': { lat: 59.6172, lon: 17.7244 },
  'ystad': { lat: 55.4295, lon: 13.8201 },
  'båstad': { lat: 56.4268, lon: 12.8509 },
  'åre': { lat: 63.3987, lon: 13.0815 },
  'sälen': { lat: 61.1557, lon: 13.2622 },
  'abisko': { lat: 68.3500, lon: 18.8300 },
  'mora': { lat: 61.0043, lon: 14.5364 },
  'gotland': { lat: 57.4747, lon: 18.4850 },
  'öland': { lat: 56.7568, lon: 16.6290 },
  'smögen': { lat: 58.3530, lon: 11.2259 },
  'fjällbacka': { lat: 58.5986, lon: 11.2876 },
  'tylösand': { lat: 56.6499, lon: 12.7281 },
  'idre': { lat: 61.8581, lon: 12.7103 },
  'vimmerby': { lat: 57.6664, lon: 15.8582 }, // Astrid Lindgrens Värld
  'kolmården': { lat: 58.6744, lon: 16.4280 }, // Kolmårdens djurpark
  
  // University towns (Universitetsstäder)
  'luleå tekniska universitet': { lat: 65.6178, lon: 22.1401 },
  'karlstad universitet': { lat: 59.4066, lon: 13.5769 },
  'chalmers': { lat: 57.6897, lon: 11.9761 },
  'handelshögskolan stockholm': { lat: 59.3401, lon: 18.0579 },
  'kth': { lat: 59.3500, lon: 18.0700 },
  'lunds universitet': { lat: 55.7116, lon: 13.2035 },
  'stockholms universitet': { lat: 59.3639, lon: 18.0582 },
  'uppsala universitet': { lat: 59.8539, lon: 17.6310 },
  'göteborgs universitet': { lat: 57.6882, lon: 11.9710 },
  'linköpings universitet': { lat: 58.3970, lon: 15.5762 },
  'umeå universitet': { lat: 63.8200, lon: 20.3060 },
  'örebro universitet': { lat: 59.2539, lon: 15.2482 },
  
  // Major islands (Större öar)
  'gotland': { lat: 57.4684, lon: 18.4867 },
  'öland': { lat: 56.7568, lon: 16.6290 },
  'orust': { lat: 58.1667, lon: 11.7500 },
  'tjörn': { lat: 58.0333, lon: 11.6667 },
  'värmdö': { lat: 59.3000, lon: 18.5167 },
  'ljusterö': { lat: 59.4917, lon: 18.6250 },
  
  // Popular ski resorts (Skidorter)
  'åre': { lat: 63.3987, lon: 13.0815 },
  'sälen': { lat: 61.1557, lon: 13.2622 },
  'idre fjäll': { lat: 61.8889, lon: 12.8522 },
  'vemdalen': { lat: 62.4333, lon: 13.8667 },
  'romme alpin': { lat: 60.5139, lon: 15.3833 },
  'branäs': { lat: 60.4798, lon: 12.7868 },
  'dundret': { lat: 67.1667, lon: 20.6667 },
  'kläppen': { lat: 61.0333, lon: 13.1833 },
  
  // Popular summer destinations (Sommardestinationer)
  'öland': { lat: 56.7568, lon: 16.6290 },
  'gotland': { lat: 57.4684, lon: 18.4867 },
  'smögen': { lat: 58.3530, lon: 11.2259 },
  'tylösand': { lat: 56.6499, lon: 12.7281 },
  'marstrand': { lat: 57.8858, lon: 11.5902 },
  'mölle': { lat: 56.2826, lon: 12.4977 },
  'borgholm': { lat: 56.8797, lon: 16.6559 },
  'båstad': { lat: 56.4268, lon: 12.8509 },
  'torekov': { lat: 56.3954, lon: 12.6350 },
  'fiskebäckskil': { lat: 58.2500, lon: 11.4667 },
  'varberg': { lat: 57.1069, lon: 12.2498 },
  
  // Major lakes (Större sjöar)
  'vänern': { lat: 58.8833, lon: 13.2167 },
  'vättern': { lat: 58.3333, lon: 14.5000 },
  'mälaren': { lat: 59.4000, lon: 17.2000 },
  'hjälmaren': { lat: 59.2333, lon: 15.7667 },
  'storsjön': { lat: 63.1500, lon: 14.3667 },
  'siljan': { lat: 60.8833, lon: 14.8333 },
  'torneträsk': { lat: 68.2333, lon: 19.7167 },
  
  // Industrial cities (Industristäder)
  'oxelösund': { lat: 58.6667, lon: 17.1333 }, // SSAB
  'sandviken': { lat: 60.6167, lon: 16.7667 }, // Sandvik
  'olofström': { lat: 56.2833, lon: 14.5333 }, // Volvo
  'trollhättan': { lat: 58.2833, lon: 12.2833 }, // SAAB
  'luleå': { lat: 65.5833, lon: 22.1500 }, // SSAB
  'borlänge': { lat: 60.4833, lon: 15.4167 }, // SSAB
  'ludvika': { lat: 60.1500, lon: 15.1833 }, // ABB
  
  // Historical cities (Historiska städer)
  'sigtuna': { lat: 59.6172, lon: 17.7244 }, // Sveriges äldsta stad
  'vadstena': { lat: 58.4489, lon: 14.8911 }, // Klosterkyrkan
  'visby': { lat: 57.6389, lon: 18.2946 }, // Ringmuren
  'skara': { lat: 58.3833, lon: 13.4333 }, // Domkyrkan
  'gamla uppsala': { lat: 59.8972, lon: 17.6333 }, // Kungshögarna
  'kalmar': { lat: 56.6634, lon: 16.3566 }, // Kalmar slott
  'lund': { lat: 55.7047, lon: 13.1910 } // Domkyrkan
};

// Merge with existing database and add new locations
function updateLocationDatabase() {
  // Create a merged database
  const mergedDatabase = { ...EXPANDED_LOCATION_DATABASE };
  let addedCount = 0;
  let existingCount = 0;
  let updatedCount = 0;
  
  // Add new locations if they don't already exist
  for (const [name, coords] of Object.entries(MAJOR_SWEDISH_LOCATIONS)) {
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