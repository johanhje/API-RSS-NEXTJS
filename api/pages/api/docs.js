/**
 * API Documentation Endpoint
 * 
 * Serves the API documentation page
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getLocationIndexStats } from '../../lib/geocoding/location-index.js';

// Importera package.json via fs istället för import assert
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pkgPath = path.join(__dirname, '../../package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

/**
 * Generate the API documentation
 */
const getDocumentation = () => {
  return {
    api: {
      name: pkg.name,
      version: pkg.version,
      description: pkg.description,
      endpoints: [
        {
          path: '/api/status',
          method: 'GET',
          description: 'Get API status and health information',
          authentication: false
        },
        {
          path: '/api/v1/events',
          method: 'GET',
          description: 'Get events with optional filtering',
          authentication: false,
          parameters: [
            { name: 'limit', type: 'number', description: 'Maximum number of events to return' },
            { name: 'offset', type: 'number', description: 'Number of events to skip' },
            { name: 'location', type: 'string', description: 'Filter by location name' },
            { name: 'type', type: 'string', description: 'Filter by event type' },
            { name: 'lat', type: 'number', description: 'Latitude for proximity search' },
            { name: 'lon', type: 'number', description: 'Longitude for proximity search' },
            { name: 'radius', type: 'number', description: 'Radius in kilometers for proximity search' }
          ]
        },
        {
          path: '/api/v1/events/:id',
          method: 'GET',
          description: 'Get a specific event by ID',
          authentication: false
        },
        {
          path: '/api/v1/locations',
          method: 'GET',
          description: 'Get available locations',
          authentication: false,
          parameters: [
            { name: 'prefix', type: 'string', description: 'Filter locations by prefix' },
            { name: 'limit', type: 'number', description: 'Maximum number of locations to return' }
          ]
        },
        {
          path: '/api/v1/types',
          method: 'GET',
          description: 'Get available event types',
          authentication: false
        },
        {
          path: '/api/v1/stats',
          method: 'GET',
          description: 'Get statistics about events',
          authentication: false
        },
        {
          path: '/api/v1/batch-geocode',
          method: 'POST',
          description: 'Geocode multiple locations at once',
          authentication: false,
          requestBody: {
            type: 'application/json',
            example: '{"locations": ["Stockholm", "Göteborg", "Malmö"]}'
          }
        },
        {
          path: '/api/v1/problematic-locations',
          method: 'GET',
          description: 'Get locations that failed to geocode',
          authentication: false
        },
        {
          path: '/api/cache/status',
          method: 'GET',
          description: 'Get cache status and metrics',
          authentication: false
        }
      ]
    }
  };
};

/**
 * API Documentation Handler
 */
export default function handler(req, res) {
  // Generate documentation
  const docs = getDocumentation();
  
  // Add location stats to documentation
  try {
    const locationStats = getLocationIndexStats();
    docs.locationIndex = locationStats;
  } catch (error) {
    docs.locationIndex = { error: 'Location index not initialized' };
  }
  
  // Respond with documentation
  res.status(200).json(docs);
} 