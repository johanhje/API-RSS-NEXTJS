/**
 * API Endpoint: /api/v1/problematic-locations
 * 
 * Returns locations that failed geocoding, for troubleshooting
 */

import { getProblematicLocations } from '../../../lib/db/stats.js';
import { withCachedHandler } from '../../../lib/cache/middleware.js';

// Cache TTL for problematic locations endpoint
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Problematic locations API handler
 * 
 * @param {Object} req - Next.js request object
 * @param {Object} res - Next.js response object
 */
async function handler(req, res) {
  try {
    // Parse limit parameter
    const limit = parseInt(req.query.limit || '25', 10);
    
    // Get problematic locations
    const locations = await getProblematicLocations(limit);
    
    // Return locations
    res.status(200).json({
      status: 'ok',
      count: locations.length,
      locations: locations
    });
  } catch (error) {
    console.error('Problematic locations API error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    });
  }
}

// Export with caching
export default withCachedHandler(handler, CACHE_TTL); 