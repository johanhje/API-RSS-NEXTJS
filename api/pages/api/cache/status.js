/**
 * API Endpoint: /api/cache/status
 * 
 * Provides cache status information and management capabilities
 */

import { clearCache, purgeExpired } from '../../../lib/cache/index.js';
import { getAllCacheMetrics, resetAllMetrics, startAutoPurge, stopAutoPurge } from '../../../lib/cache/monitor.js';

export default async function handler(req, res) {
  // GET: Return cache metrics
  if (req.method === 'GET') {
    const metrics = getAllCacheMetrics();
    return res.status(200).json({
      success: true,
      metrics: metrics
    });
  }
  
  // POST: Perform cache management actions
  if (req.method === 'POST') {
    const { action } = req.body;
    
    switch (action) {
      case 'clear':
        // Clear entire cache
        clearCache();
        return res.status(200).json({
          success: true,
          message: 'Cache cleared successfully'
        });
        
      case 'purge':
        // Purge expired items only
        const purgedCount = purgeExpired();
        return res.status(200).json({
          success: true,
          message: `Purged ${purgedCount} expired cache items`
        });
        
      case 'reset-metrics':
        // Reset metrics counters
        resetAllMetrics();
        return res.status(200).json({
          success: true,
          message: 'Cache metrics reset successfully'
        });
        
      case 'start-auto-purge':
        // Start automatic purging
        const started = startAutoPurge();
        return res.status(200).json({
          success: true,
          message: started ? 'Auto-purge started' : 'Auto-purge already running'
        });
        
      case 'stop-auto-purge':
        // Stop automatic purging
        const stopped = stopAutoPurge();
        return res.status(200).json({
          success: true,
          message: stopped ? 'Auto-purge stopped' : 'Auto-purge not running'
        });
        
      default:
        return res.status(400).json({
          success: false,
          error: `Unknown action: ${action}`,
          validActions: ['clear', 'purge', 'reset-metrics', 'start-auto-purge', 'stop-auto-purge']
        });
    }
  }
  
  // Other methods not supported
  return res.status(405).json({
    success: false,
    error: 'Method not allowed',
    allowedMethods: ['GET', 'POST']
  });
} 