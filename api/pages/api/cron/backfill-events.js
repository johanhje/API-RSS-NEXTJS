/**
 * API Endpoint: /api/cron/backfill-events
 * 
 * Protected endpoint for backfilling missing events
 * To be called manually or by a scheduler when gaps are detected
 */

import { backfillEvents } from '../../../lib/events/backfill.js';
import { acquireLock, releaseLock } from '../../../lib/util/lock.js';

export default async function handler(req, res) {
  // Verify request method is POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed, use POST' 
    });
  }
  
  // Verify request is authorized
  const authHeader = req.headers.authorization || '';
  const cronSecret = process.env.CRON_SECRET || 'default-dev-secret';
  
  if (!authHeader.startsWith('Bearer ') || authHeader.substring(7) !== cronSecret) {
    return res.status(401).json({ 
      success: false, 
      error: 'Unauthorized access' 
    });
  }
  
  // Extract parameters from request body
  const { daysBack = 7, maxEvents = 100 } = req.body;
  
  // Validate parameters
  if (daysBack < 1 || daysBack > 30) {
    return res.status(400).json({
      success: false,
      error: 'Invalid daysBack parameter (must be between 1 and 30)'
    });
  }
  
  if (maxEvents < 1 || maxEvents > 1000) {
    return res.status(400).json({
      success: false,
      error: 'Invalid maxEvents parameter (must be between 1 and 1000)'
    });
  }
  
  // Try to acquire lock to prevent concurrent backfills
  const lockId = 'backfill-events';
  const lockAcquired = await acquireLock(lockId, 15 * 60 * 1000); // 15 minute lock
  
  if (!lockAcquired) {
    return res.status(409).json({ 
      success: false, 
      error: 'Another backfill operation is already in progress' 
    });
  }
  
  try {
    console.log(`Starting event backfill (days: ${daysBack}, max: ${maxEvents})...`);
    
    // Perform backfill
    const result = await backfillEvents(daysBack, maxEvents);
    
    console.log('Backfill completed successfully', result);
    
    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Backfill completed successfully',
      stats: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Backfill failed:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Backfill failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  } finally {
    // Always release the lock
    await releaseLock(lockId);
  }
} 