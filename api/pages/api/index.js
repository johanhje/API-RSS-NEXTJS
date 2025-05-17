/**
 * API Root Endpoint
 */

import { getDatabaseStats } from '../../lib/rss/sync.js';
import { getSchedulerStatus } from '../../lib/rss/scheduler.js';

export default async function handler(req, res) {
  try {
    const dbStats = await getDatabaseStats();
    const schedulerStats = getSchedulerStatus();
    
    res.status(200).json({
      status: 'ok',
      name: 'Polis API',
      description: 'API for police events in Sweden',
      endpoints: [
        { path: '/api', description: 'This endpoint - API information' },
        { path: '/api/events', description: 'List all events with optional filtering' },
        { path: '/api/events/:id', description: 'Get a specific event by ID' },
        { path: '/api/sync', description: 'Manually trigger RSS feed synchronization' },
        { path: '/api/scheduler', description: 'Control the RSS feed scheduler' }
      ],
      stats: {
        database: dbStats,
        scheduler: schedulerStats
      }
    });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    });
  }
} 