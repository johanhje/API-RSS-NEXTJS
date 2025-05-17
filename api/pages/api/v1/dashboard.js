/**
 * API Endpoint: /api/v1/dashboard
 * 
 * Returns comprehensive system statistics and performance metrics
 */

import { getSystemStats } from '../../../lib/db/stats.js';
import { withCachedHandler } from '../../../lib/cache/middleware.js';

// Use a shorter TTL for the dashboard to ensure relatively fresh data
const DASHBOARD_CACHE_TTL = 60 * 1000; // 1 minute

/**
 * Dashboard API handler
 * 
 * @param {Object} req - Next.js request object
 * @param {Object} res - Next.js response object
 */
async function handler(req, res) {
  try {
    // Get system statistics
    const stats = await getSystemStats();
    
    // Return statistics
    res.status(200).json({
      status: 'ok',
      data: stats
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    });
  }
}

// Export with caching
export default withCachedHandler(handler, DASHBOARD_CACHE_TTL); 