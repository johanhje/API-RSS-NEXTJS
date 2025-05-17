/**
 * Extract Locations from Database
 * 
 * This script extracts all unique locations from the database,
 * geocodes them, and saves their coordinates for future use.
 */

import fs from 'fs';
import path from 'path';
import { query } from '../lib/db/database.js';
import { geocodeLocation, normalizeLocationName } from '../lib/geocoding/nominatim.js';

// Output file for the extracted locations
const OUTPUT_FILE = path.join(process.cwd(), 'lib/geocoding/location-database.js');

/**
 * Get all unique locations from the database
 * @returns {Promise<string[]>} - Array of location names
 */
async function getAllLocations() {
  const sql = "SELECT DISTINCT location_name FROM events WHERE location_name IS NOT NULL AND location_name <> ''";
  const results = await query(sql);
  return results.map(item => item.location_name);
}

/**
 * Geocode a single location with delay to respect API limits
 * @param {string} location - Location name
 * @param {number} index - Index for logging progress
 * @param {number} total - Total number of locations for progress calculation
 * @returns {Promise<{name: string, coordinates: {lat: number, lon: number}|null}>} - Location with coordinates
 */
async function geocodeWithDelay(location, index, total) {
  // Log progress every 10 items
  if (index % 10 === 0) {
    const progress = ((index / total) * 100).toFixed(1);
    console.log(`Progress: ${progress}% - Processing location ${index}/${total}: "${location}"`);
  }
  
  try {
    // Respect API limits with a delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const coordinates = await geocodeLocation(location);
    
    if (coordinates) {
      console.log(`✅ Found coordinates for "${location}": ${coordinates.lat}, ${coordinates.lon}`);
      return {
        name: normalizeLocationName(location).replace(', sweden', ''),
        coordinates
      };
    } else {
      console.log(`❌ Could not geocode "${location}"`);
      return {
        name: normalizeLocationName(location).replace(', sweden', ''),
        coordinates: null
      };
    }
  } catch (error) {
    console.error(`Error geocoding "${location}":`, error.message);
    return {
      name: normalizeLocationName(location).replace(', sweden', ''),
      coordinates: null
    };
  }
}

/**
 * Generate JavaScript code for the locations database
 * @param {Array} results - Array of geocoded locations
 * @returns {string} - JavaScript code
 */
function generateLocationsCode(results) {
  // Filter out locations without coordinates
  const validResults = results.filter(result => result.coordinates !== null);
  
  // Create JavaScript object entries
  const locationEntries = validResults.map(result => {
    const { name, coordinates } = result;
    return `  '${name}': { lat: ${coordinates.lat}, lon: ${coordinates.lon} }`;
  }).join(',\n');
  
  // Create the full JavaScript code
  return `/**
 * Database of pre-defined coordinates for Swedish locations
 * Auto-generated from the events database
 * Total locations: ${validResults.length}
 */

export const LOCATION_DATABASE = {
${locationEntries}
};
`;
}

/**
 * Main function to extract and geocode locations
 */
async function extractLocations() {
  try {
    console.log('Extracting unique locations from database...');
    
    // Get all unique locations from database
    const locations = await getAllLocations();
    console.log(`Found ${locations.length} unique locations in the database.`);
    
    // Process locations in batches to avoid overwhelming geocoding API
    const results = [];
    
    for (let i = 0; i < locations.length; i++) {
      const result = await geocodeWithDelay(locations[i], i, locations.length);
      results.push(result);
    }
    
    // Count successful geocoding attempts
    const successful = results.filter(result => result.coordinates !== null).length;
    console.log(`\nGeocoding complete: ${successful}/${locations.length} locations successfully geocoded (${((successful/locations.length)*100).toFixed(1)}%)`);
    
    // Generate JavaScript code
    const code = generateLocationsCode(results);
    
    // Save to file
    fs.writeFileSync(OUTPUT_FILE, code);
    console.log(`\nLocation database saved to: ${OUTPUT_FILE}`);
    
  } catch (error) {
    console.error('Error extracting locations:', error);
  }
}

// Run the extraction process
extractLocations(); 