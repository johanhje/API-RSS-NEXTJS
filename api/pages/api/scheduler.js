/**
 * API Endpoint for controlling the RSS feed scheduler
 */

import { 
  startScheduler, 
  stopScheduler, 
  forceSyncNow, 
  getSchedulerStatus 
} from '../../lib/rss/scheduler.js';

export default async function handler(req, res) {
  try {
    // Get scheduler status (GET request)
    if (req.method === 'GET') {
      const status = getSchedulerStatus();
      return res.status(200).json({
        status: 'ok',
        scheduler: status
      });
    }
    
    // Control scheduler (POST request)
    if (req.method === 'POST') {
      const { action, interval } = req.body;
      
      // Require action parameter
      if (!action) {
        return res.status(400).json({
          status: 'error',
          message: 'Missing required parameter: action (start, stop, sync)'
        });
      }
      
      // Handle different actions
      switch (action.toLowerCase()) {
        case 'start':
          const intervalValue = interval ? parseInt(interval, 10) : undefined;
          const started = startScheduler(intervalValue);
          return res.status(200).json({
            status: 'ok',
            message: started 
              ? `Scheduler started with interval of ${intervalValue || 'default'} seconds` 
              : 'Scheduler is already running',
            scheduler: getSchedulerStatus()
          });
          
        case 'stop':
          const stopped = stopScheduler();
          return res.status(200).json({
            status: 'ok',
            message: stopped 
              ? 'Scheduler stopped' 
              : 'Scheduler was not running',
            scheduler: getSchedulerStatus()
          });
          
        case 'sync':
          const syncResult = await forceSyncNow();
          return res.status(200).json({
            status: 'ok',
            message: 'Manual sync triggered',
            result: syncResult,
            scheduler: getSchedulerStatus()
          });
          
        default:
          return res.status(400).json({
            status: 'error',
            message: `Unknown action: ${action}. Valid actions are: start, stop, sync`
          });
      }
    }
    
    // Method not allowed
    return res.status(405).json({
      status: 'error',
      message: 'Method Not Allowed. Use GET to get status or POST to control scheduler.'
    });
    
  } catch (error) {
    console.error('API scheduler error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    });
  }
} 