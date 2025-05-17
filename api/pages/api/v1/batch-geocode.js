/**
 * Batch Geocoding API
 * 
 * Provides an API endpoint for batch geocoding multiple locations at once
 * with optimized performance.
 */

import { batchGeocode } from '../../../lib/geocoding/batch.js';

/**
 * Validate that the request body contains a valid locations array
 * @param {object} body - Request body
 * @returns {string|null} - Error message or null if valid
 */
function validateRequestBody(body) {
  if (!body) {
    return 'Request body is required';
  }
  
  if (!body.locations || !Array.isArray(body.locations)) {
    return 'Request body must contain a locations array';
  }
  
  if (body.locations.length === 0) {
    return 'Locations array cannot be empty';
  }
  
  if (body.locations.length > 100) {
    return 'Batch size cannot exceed 100 locations';
  }
  
  if (body.locations.some(loc => typeof loc !== 'string')) {
    return 'All locations must be strings';
  }
  
  return null;
}

/**
 * API handler for batch geocoding
 */
export default async function handler(req, res) {
  // Check for correct HTTP method
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }
  
  try {
    // Validate the request body
    const validationError = validateRequestBody(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError
      });
    }
    
    // Extract options from the request
    const {
      locations,
      concurrency = 5,
      delayMs = 200,
      retries = 1
    } = req.body;
    
    // Process batch geocoding request
    const geocodeResults = await batchGeocode(locations, {
      concurrency,
      delayMs,
      retries,
      timeout: 5000  // 5 second timeout
    });
    
    // Calculate statistics
    const successfulResults = geocodeResults.filter(r => r.success);
    const successRate = successfulResults.length / geocodeResults.length;
    
    // Format the response
    const formattedResults = geocodeResults.map(({ location, result, success }) => ({
      location,
      success,
      coordinates: success ? {
        lat: result.lat,
        lon: result.lon
      } : null
    }));
    
    // Return the results
    return res.status(200).json({
      success: true,
      statistics: {
        total: geocodeResults.length,
        successful: successfulResults.length,
        failed: geocodeResults.length - successfulResults.length,
        success_rate: `${(successRate * 100).toFixed(2)}%`
      },
      results: formattedResults
    });
    
  } catch (error) {
    console.error('Batch geocoding API error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
} 