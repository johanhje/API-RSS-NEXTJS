/**
 * Fetch Swedish Locations
 * 
 * This script fetches official Swedish locations data including:
 * - Tätorter (Urban areas): ~1,979 locations
 * - Småorter (Small localities): ~2,034 locations
 * - Städer (Historical cities): ~133 locations
 * - Kommuner (Municipalities): ~290 locations
 * 
 * And merges them with our existing location database.
 */

import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { LOCATION_DATABASE } from '../lib/geocoding/location-database.js';

// Output file path
const OUTPUT_FILE = path.join(process.cwd(), 'lib/geocoding/expanded-location-database.js');

// Data sources
const DATA_SOURCES = {
  TATORTER: 'https://api.scb.se/OV0104/v1/doris/sv/ssd/START/MI/MI0810/MI0810A/MI0810T10',
  SMAORTER: 'https://api.scb.se/OV0104/v1/doris/sv/ssd/START/MI/MI0811/MI0811A/MI0811T10',
  KOMMUNER: 'https://api.scb.se/OV0104/v1/doris/sv/ssd/START/OE/OE0101/OE0101A/OE0101T1'
};

// Alternative sources (OpenStreetMap-based) in case SCB API fails
const OSM_OVERPASS_API = 'https://overpass-api.de/api/interpreter';

/**
 * Fetch data from SCB API
 * @param {string} url - SCB API endpoint
 * @returns {Promise<Array>} - Array of locations with coordinates
 */
async function fetchScbData(url) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        "query": [],
        "response": {
          "format": "json"
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`SCB API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return processScbData(data);
  } catch (error) {
    console.error(`Error fetching SCB data from ${url}:`, error.message);
    return [];
  }
}

/**
 * Process SCB API response data
 * @param {Object} data - SCB API response
 * @returns {Array} - Processed locations
 */
function processScbData(data) {
  // This would need to be adjusted based on the actual SCB data structure
  const locations = [];
  
  if (data && data.data) {
    for (const item of data.data) {
      // Extract location name and coordinates from the data
      // The exact structure depends on the SCB API
      if (item.key && item.values) {
        const name = item.key[0].toLowerCase();
        
        // Coordinates might be in different formats, so we need to parse them
        // This is a simplified example and would need to be adjusted
        const lat = parseFloat(item.values[0]);
        const lon = parseFloat(item.values[1]);
        
        if (!isNaN(lat) && !isNaN(lon)) {
          locations.push({
            name,
            coordinates: { lat, lon }
          });
        }
      }
    }
  }
  
  return locations;
}

/**
 * Fetch location data using OpenStreetMap Overpass API as fallback
 * @param {string} locationType - Type of location to fetch ('municipality', 'urban', 'small', 'city')
 * @returns {Promise<Array>} - Array of locations with coordinates
 */
async function fetchOsmData(locationType) {
  try {
    // Define the appropriate Overpass query based on location type
    let query;
    
    switch (locationType) {
      case 'municipality':
        query = `[out:json];area["ISO3166-1"="SE"][admin_level=2];rel(area)["admin_level"="7"]["boundary"="administrative"];out center;`;
        break;
      case 'urban':
        query = `[out:json];area["ISO3166-1"="SE"][admin_level=2];node["place"="town"]["name"]["country"="Sweden"];out;`;
        break;
      case 'small':
        query = `[out:json];area["ISO3166-1"="SE"][admin_level=2];node["place"="village"]["name"]["country"="Sweden"];out;`;
        break;
      case 'city':
        query = `[out:json];area["ISO3166-1"="SE"][admin_level=2];node["place"="city"]["name"]["country"="Sweden"];out;`;
        break;
      default:
        throw new Error(`Unknown location type: ${locationType}`);
    }
    
    const response = await fetch(OSM_OVERPASS_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `data=${encodeURIComponent(query)}`
    });
    
    if (!response.ok) {
      throw new Error(`OSM API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return processOsmData(data);
  } catch (error) {
    console.error(`Error fetching OSM data for ${locationType}:`, error.message);
    return [];
  }
}

/**
 * Process OpenStreetMap data
 * @param {Object} data - OSM API response
 * @returns {Array} - Processed locations
 */
function processOsmData(data) {
  const locations = [];
  
  if (data && data.elements) {
    for (const element of data.elements) {
      if (element.tags && element.tags.name) {
        const name = element.tags.name.toLowerCase();
        
        // Get coordinates from the element
        let lat, lon;
        
        if (element.type === 'node') {
          lat = element.lat;
          lon = element.lon;
        } else if (element.center) {
          lat = element.center.lat;
          lon = element.center.lon;
        }
        
        if (lat && lon) {
          locations.push({
            name,
            coordinates: { lat, lon }
          });
        }
      }
    }
  }
  
  return locations;
}

/**
 * Fallback to local data if API calls fail
 * This uses a static set of Swedish municipalities with coordinates
 * @returns {Array} - Array of municipalities with coordinates
 */
function getLocalMunicipalityData() {
  // Swedish municipalities with coordinates
  // This is a smaller subset for demonstration purposes
  return [
    { name: "stockholm", coordinates: { lat: 59.32938, lon: 18.06871 } },
    { name: "göteborg", coordinates: { lat: 57.70887, lon: 11.97456 } },
    { name: "malmö", coordinates: { lat: 55.60587, lon: 13.00073 } },
    { name: "uppsala", coordinates: { lat: 59.85882, lon: 17.63889 } },
    { name: "linköping", coordinates: { lat: 58.41086, lon: 15.62157 } },
    { name: "västerås", coordinates: { lat: 59.61617, lon: 16.55276 } },
    { name: "örebro", coordinates: { lat: 59.27412, lon: 15.2066 } },
    { name: "norrköping", coordinates: { lat: 58.59419, lon: 16.1826 } },
    { name: "helsingborg", coordinates: { lat: 56.04673, lon: 12.69437 } },
    { name: "jönköping", coordinates: { lat: 57.78145, lon: 14.15618 } },
    { name: "umeå", coordinates: { lat: 63.82842, lon: 20.25972 } },
    { name: "lund", coordinates: { lat: 55.70584, lon: 13.19321 } },
    { name: "borås", coordinates: { lat: 57.72101, lon: 12.9401 } },
    { name: "gävle", coordinates: { lat: 60.67452, lon: 17.14174 } },
    { name: "södertälje", coordinates: { lat: 59.19554, lon: 17.62525 } },
    { name: "eskilstuna", coordinates: { lat: 59.37107, lon: 16.5099 } },
    { name: "halmstad", coordinates: { lat: 56.67446, lon: 12.85676 } },
    { name: "växjö", coordinates: { lat: 56.87767, lon: 14.80906 } },
    { name: "karlstad", coordinates: { lat: 59.4022, lon: 13.51149 } },
    { name: "sundsvall", coordinates: { lat: 62.39129, lon: 17.3063 } },
    { name: "östersund", coordinates: { lat: 63.17824, lon: 14.63566 } },
    { name: "trollhättan", coordinates: { lat: 58.28331, lon: 12.28864 } },
    { name: "luleå", coordinates: { lat: 65.58415, lon: 22.15465 } },
    { name: "borlänge", coordinates: { lat: 60.4856426, lon: 15.4234561 } },
    { name: "kristianstad", coordinates: { lat: 56.0294, lon: 14.15242 } },
    { name: "kalmar", coordinates: { lat: 56.66157, lon: 16.36163 } },
    { name: "falun", coordinates: { lat: 60.60357, lon: 15.62597 } },
    { name: "skellefteå", coordinates: { lat: 64.75067, lon: 20.95279 } },
    { name: "karlskrona", coordinates: { lat: 56.16156, lon: 15.58661 } },
    { name: "varberg", coordinates: { lat: 57.10557, lon: 12.25099 } }
  ];
}

/**
 * Generate the expanded location database JavaScript code
 * @param {Object} locationDatabase - Combined location database
 * @returns {string} - JavaScript code
 */
function generateLocationDatabaseCode(locationDatabase) {
  const entries = Object.entries(locationDatabase)
    .map(([name, coords]) => `  '${name}': { lat: ${coords.lat}, lon: ${coords.lon} }`)
    .join(',\n');
  
  return `/**
 * Expanded Database of pre-defined coordinates for Swedish locations
 * Auto-generated with data from SCB/OSM APIs
 * 
 * Includes:
 * - Urban areas (tätorter)
 * - Small localities (småorter)
 * - Historical cities (städer)
 * - Municipalities (kommuner)
 * - Custom locations from database
 * 
 * Total locations: ${Object.keys(locationDatabase).length}
 */

export const EXPANDED_LOCATION_DATABASE = {
${entries}
};
`;
}

/**
 * Main function to fetch all location data
 */
async function fetchAllLocations() {
  console.log('Fetching Swedish location data...');
  
  // Start with existing database
  const combinedDatabase = { ...LOCATION_DATABASE };
  let totalNewLocations = 0;
  
  try {
    // Try using SCB API first
    console.log('Fetching urban areas (tätorter)...');
    const urbanAreas = await fetchScbData(DATA_SOURCES.TATORTER);
    
    console.log('Fetching small localities (småorter)...');
    const smallLocalities = await fetchScbData(DATA_SOURCES.SMAORTER);
    
    console.log('Fetching municipalities (kommuner)...');
    const municipalities = await fetchScbData(DATA_SOURCES.KOMMUNER);
    
    // If SCB API fails, fall back to OSM
    let fetchedData = [...urbanAreas, ...smallLocalities, ...municipalities];
    
    // If we didn't get much data from SCB, try OSM
    if (fetchedData.length < 100) {
      console.log('Not enough data from SCB API, falling back to OSM...');
      
      console.log('Fetching cities from OSM...');
      const osmCities = await fetchOsmData('city');
      
      console.log('Fetching urban areas from OSM...');
      const osmUrban = await fetchOsmData('urban');
      
      console.log('Fetching small localities from OSM...');
      const osmSmall = await fetchOsmData('small');
      
      console.log('Fetching municipalities from OSM...');
      const osmMunicipalities = await fetchOsmData('municipality');
      
      fetchedData = [...osmCities, ...osmUrban, ...osmSmall, ...osmMunicipalities];
    }
    
    // If still not enough data, use local fallback
    if (fetchedData.length < 100) {
      console.log('Not enough data from APIs, using local fallback data...');
      fetchedData = getLocalMunicipalityData();
    }
    
    // Add to combined database
    for (const item of fetchedData) {
      if (!combinedDatabase[item.name] && item.coordinates) {
        combinedDatabase[item.name] = item.coordinates;
        totalNewLocations++;
      }
    }
    
    console.log(`Added ${totalNewLocations} new locations to the database.`);
    console.log(`Total locations in expanded database: ${Object.keys(combinedDatabase).length}`);
    
    // Generate code
    const code = generateLocationDatabaseCode(combinedDatabase);
    
    // Save to file
    fs.writeFileSync(OUTPUT_FILE, code);
    console.log(`\nExpanded location database saved to: ${OUTPUT_FILE}`);
    
  } catch (error) {
    console.error('Error fetching location data:', error);
  }
}

// Run the function
fetchAllLocations(); 