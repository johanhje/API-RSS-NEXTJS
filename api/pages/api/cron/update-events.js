/**
 * API Endpoint: /api/cron/update-events
 * 
 * Protected endpoint for scheduled event updates
 * To be called by a cron job or scheduler
 */

import { processPoliceEvents } from '../../../lib/events/processor.js';
import { acquireLock, releaseLock } from '../../../lib/util/lock.js';

export default async function handler(req, res) {
  // Verify request method is POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed, use POST' 
    });
  }
  
  // Verify request is authorized (from a cron job or authorized source)
  const authHeader = req.headers.authorization || '';
  const cronSecret = process.env.CRON_SECRET || 'default-dev-secret';
  
  if (!authHeader.startsWith('Bearer ') || authHeader.substring(7) !== cronSecret) {
    return res.status(401).json({ 
      success: false, 
      error: 'Unauthorized access' 
    });
  }
  
  // Try to acquire lock to prevent concurrent updates
  const lockId = 'update-events';
  const lockAcquired = await acquireLock(lockId, 5 * 60 * 1000); // 5 minute lock
  
  if (!lockAcquired) {
    return res.status(409).json({ 
      success: false, 
      error: 'Another update is already in progress' 
    });
  }
  
  try {
    console.log('Starting scheduled RSS feed update...');
    
    // Process events from RSS feed
    const result = await processPoliceEvents();
    
    // Calculate statistics
    const stats = {
      total: result.total,
      new: result.new,
      updated: result.updated,
      unchanged: result.unchanged,
      failed: result.failed,
      geocodingSuccess: result.geocodingSuccess,
      geocodingSuccessRate: result.geocodingSuccessRate
    };
    
    console.log('Scheduled update completed successfully', stats);
    
    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Update completed successfully',
      stats: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Scheduled update failed:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Scheduled update failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  } finally {
    // Always release the lock
    await releaseLock(lockId);
  }
} 