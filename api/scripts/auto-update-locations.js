/**
 * Auto-Update Location Database Script
 * 
 * This script:
 * 1. Fetches problematic locations from the database
 * 2. Attempts to geocode them directly via Nominatim
 * 3. If successful, adds them to the expanded location database
 * 4. Logs results for review
 */

import fs from 'fs';
import path from 'path';
import { getDatabase } from '../lib/db/database.js';
import { geocodeAddress, extractLocation } from '../lib/geocoding/nominatim.js';
import expandedLocations from '../lib/geocoding/expanded-location-database.js';

// Configuration
const MIN_FAILURES = 3; // Only consider locations that failed at least this many times
const LOG_FILE = path.join(process.cwd(), 'logs', 'auto-location-updates.log');
const LOCATIONS_FILE = path.join(process.cwd(), 'lib', 'geocoding', 'expanded-location-database.js');

// Make sure logs directory exists
if (!fs.existsSync(path.join(process.cwd(), 'logs'))) {
  fs.mkdirSync(path.join(process.cwd(), 'logs'));
}

/**
 * Log message to file and console
 */
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  fs.appendFileSync(LOG_FILE, logMessage);
}

/**
 * Update locations database file
 */
function updateLocationsFile(newLocations) {
  // Read the current file content
  let content = fs.readFileSync(LOCATIONS_FILE, 'utf8');
  
  // Find the position where the locations array ends
  const arrayEndPos = content.lastIndexOf('];');
  
  if (arrayEndPos === -1) {
    throw new Error('Could not find location array end in file');
  }
  
  // Format the new locations as JavaScript code
  const locationsCode = newLocations.map(loc => {
    return `
  {
    name: "${loc.name.replace(/"/g, '\\"')}",
    lat: ${loc.lat},
    lon: ${loc.lon},
    source: "auto-geocode",
    date_added: "${new Date().toISOString()}"
  },`;
  }).join('');
  
  // Insert the new locations before the end of the array
  const newContent = content.slice(0, arrayEndPos) + locationsCode + content.slice(arrayEndPos);
  
  // Write the file back
  fs.writeFileSync(LOCATIONS_FILE, newContent, 'utf8');
  
  log(`Updated locations file with ${newLocations.length} new locations`);
}

/**
 * Process problematic locations
 */
async function processProblematicLocations() {
  log('Starting automated location database update process');
  
  try {
    const db = getDatabase();
    
    // Get problematic locations that occur multiple times
    const problemLocations = db.prepare(`
      SELECT location_name, COUNT(*) as count 
      FROM events 
      WHERE (lat IS NULL OR lng IS NULL OR lat = 0 OR lng = 0) 
        AND location_name IS NOT NULL
        AND location_name NOT LIKE 'Sammanfattning%'
        AND location_name NOT LIKE 'Övrigt%'
        AND location_name NOT LIKE 'Trafikkontroll%'
      GROUP BY location_name 
      HAVING COUNT(*) >= ?
      ORDER BY count DESC
    `, [MIN_FAILURES]).all();
    
    log(`Found ${problemLocations.length} problematic locations that failed ${MIN_FAILURES}+ times`);
    
    // Skip if no locations
    if (problemLocations.length === 0) {
      log('No problematic locations to process');
      return;
    }
    
    // Extract current location names for checking duplicates
    const existingLocationNames = expandedLocations.map(loc => loc.name.toLowerCase());
    
    // Process each location
    const successfulLocations = [];
    
    for (const location of problemLocations) {
      const locationName = location.location_name;
      
      // Skip if location already exists in database (case insensitive)
      if (existingLocationNames.includes(locationName.toLowerCase())) {
        log(`Skipping "${locationName}" - already exists in database`);
        continue;
      }
      
      // Extract the actual place name from the police format
      const extractedLocation = extractLocation(locationName);
      
      if (!extractedLocation) {
        log(`Could not extract location from "${locationName}"`);
        continue;
      }
      
      log(`Attempting to geocode "${extractedLocation}" (from "${locationName}")`);
      
      try {
        // Try geocoding with Nominatim
        const result = await geocodeAddress(extractedLocation);
        
        // Skip if geocoding failed
        if (!result || !result.lat || !result.lon) {
          log(`Failed to geocode "${extractedLocation}"`);
          continue;
        }
        
        // Add to successful locations
        successfulLocations.push({
          name: locationName,
          lat: result.lat,
          lon: result.lon
        });
        
        log(`Successfully geocoded "${locationName}" to ${result.lat},${result.lon}`);
      } catch (error) {
        log(`Error geocoding "${extractedLocation}": ${error.message}`);
      }
      
      // Wait a bit to prevent overloading the geocoding service
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Update the locations file if we have new locations
    if (successfulLocations.length > 0) {
      log(`Adding ${successfulLocations.length} new locations to database`);
      updateLocationsFile(successfulLocations);
    } else {
      log('No new locations were successfully geocoded');
    }
    
    log('Automated location database update completed');
  } catch (error) {
    log(`Error in location update process: ${error.message}`);
  }
}

// Run the process
processProblematicLocations().catch(err => {
  log(`Unhandled error: ${err.message}`);
  process.exit(1);
}); 