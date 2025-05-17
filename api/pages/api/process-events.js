/**
 * API Route: /api/process-events
 * 
 * Processes police events from RSS feed, matches them with geocoded locations,
 * and stores them in the database.
 */

import { processPoliceEvents, reprocessEventsWithMissingGeodata } from '../../lib/events/processor.js';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }
  
  try {
    const { action = 'process', limit = 50 } = req.body;
    
    let result;
    
    // Process events based on requested action
    if (action === 'process') {
      // Process all RSS feed events
      result = await processPoliceEvents();
    } else if (action === 'reprocess') {
      // Reprocess events with missing geodata
      result = await reprocessEventsWithMissingGeodata(Number(limit));
    } else {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Invalid action. Use "process" or "reprocess".' 
      });
    }
    
    // Return success response
    return res.status(200).json({
      status: 'success',
      message: `Event processing completed successfully`,
      results: result
    });
  } catch (error) {
    console.error('Error processing events:', error);
    return res.status(500).json({ 
      status: 'error', 
      message: error.message || 'An error occurred during event processing' 
    });
  }
} 