/**
 * Batch Geocoding Module
 * 
 * Provides efficient batch geocoding capabilities to process
 * multiple location requests in parallel with optimized performance.
 */

import { geocodeLocation } from './nominatim.js';

/**
 * Process multiple locations for geocoding in parallel
 * 
 * @param {string[]} locations - Array of location names to geocode
 * @param {Object} options - Batch processing options
 * @returns {Promise<Object[]>} - Array of geocoding results
 */
export async function batchGeocode(locations, options = {}) {
  if (!locations || !Array.isArray(locations) || locations.length === 0) {
    return [];
  }
  
  const {
    concurrency = 5,     // Number of parallel requests
    delayMs = 200,       // Delay between batches to avoid rate limiting
    retries = 1,         // Number of retries for failed requests
    retryDelayMs = 1000, // Delay before retrying
    timeout = 5000       // Timeout for each request
  } = options;
  
  // Deduplicate locations to avoid unnecessary processing
  const uniqueLocations = [...new Set(locations)];
  console.log(`Batch geocoding ${uniqueLocations.length} unique locations (${locations.length} total)`);
  
  // Process locations in batches to control concurrency
  const results = [];
  
  for (let i = 0; i < uniqueLocations.length; i += concurrency) {
    const batch = uniqueLocations.slice(i, i + concurrency);
    
    // Process this batch in parallel
    const batchPromises = batch.map(async (location) => {
      let attempts = 0;
      let result = null;
      
      // Try with retries
      while (attempts <= retries && !result) {
        try {
          // Add timeout to prevent hanging
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Geocoding timeout')), timeout)
          );
          
          result = await Promise.race([
            geocodeLocation(location),
            timeoutPromise
          ]);
        } catch (error) {
          console.warn(`Geocoding error for "${location}": ${error.message}`);
          attempts++;
          
          // Wait before retry
          if (attempts <= retries) {
            await new Promise(resolve => setTimeout(resolve, retryDelayMs));
          }
        }
      }
      
      return { 
        location, 
        result,
        success: !!result?.lat && !!result?.lon
      };
    });
    
    // Wait for all operations in this batch
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Delay before next batch to prevent rate limiting
    if (i + concurrency < uniqueLocations.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  // Calculate stats
  const successful = results.filter(r => r.success).length;
  console.log(`Batch geocoding completed: ${successful}/${results.length} successful (${Math.round(successful/results.length*100)}%)`);
  
  return results;
}

/**
 * Bulk re-geocode events with missing or problematic geocoding
 * 
 * @param {Object[]} events - Array of events to process
 * @param {Function} updateCallback - Callback to update event with new geocoding
 * @param {Object} options - Batch processing options
 * @returns {Promise<Object>} - Processing results
 */
export async function bulkReprocessGeodata(events, updateCallback, options = {}) {
  if (!events || events.length === 0) {
    return { total: 0, updated: 0, failed: 0 };
  }
  
  // Extract just the location names
  const locations = events.map(event => event.location_name).filter(Boolean);
  
  // Perform batch geocoding
  const geocodeResults = await batchGeocode(locations, options);
  
  // Create a map for quick lookup
  const geocodeMap = new Map();
  geocodeResults.forEach(result => {
    if (result.success) {
      geocodeMap.set(result.location, result.result);
    }
  });
  
  // Process each event
  let updated = 0;
  let failed = 0;
  
  for (const event of events) {
    if (!event.location_name) {
      failed++;
      continue;
    }
    
    const geoResult = geocodeMap.get(event.location_name);
    
    if (geoResult) {
      try {
        // Call the update callback with the new geocoding data
        await updateCallback(event, {
          lat: geoResult.lat,
          lng: geoResult.lon,
          location_gps: `${geoResult.lat},${geoResult.lon}`
        });
        updated++;
      } catch (error) {
        console.error(`Error updating event ${event.id}:`, error);
        failed++;
      }
    } else {
      failed++;
    }
  }
  
  return {
    total: events.length,
    updated,
    failed
  };
} 