/**
 * API Endpoint for manually triggering RSS feed synchronization
 */

import { syncRssEvents } from '../../lib/rss/sync.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({
        status: 'error',
        message: 'Method Not Allowed. Use POST to trigger sync.'
      });
    }
    
    // Perform synchronization
    console.log('Manual sync triggered via API');
    const syncResult = await syncRssEvents();
    
    // Return results
    res.status(200).json({
      status: 'ok',
      message: 'RSS feed synchronization completed successfully',
      result: syncResult
    });
    
  } catch (error) {
    console.error('API sync error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Synchronization failed',
      error: error.message
    });
  }
} 