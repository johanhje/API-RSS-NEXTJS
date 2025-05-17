/**
 * API Endpoint: /api/v1/events/[id]
 * 
 * Returns a specific police event by ID
 */

import { getDatabase } from '../../../../lib/db/database.js';

export default async function handler(req, res) {
  try {
    // Get event ID from the URL parameter
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Event ID is required'
      });
    }
    
    // Get database connection
    const db = getDatabase();
    
    // Get the event by ID
    const event = db.prepare(`
      SELECT id, name, summary, location_name, datetime, type, 
             location_gps, lat, lng, url, timestamp, created_at
      FROM events
      WHERE id = ?
    `).get(id);
    
    // Check if event exists
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }
    
    // Format the event to match the expected structure
    const formattedEvent = {
      id: event.id,
      name: event.name,
      summary: event.summary,
      location: {
        name: event.location_name,
        gps: event.location_gps,
        latitude: event.lat,
        longitude: event.lng
      },
      datetime: event.datetime,
      type: event.type,
      url: event.url,
      timestamp: event.timestamp,
      created_at: event.created_at
    };
    
    // Return the formatted event
    return res.status(200).json({
      success: true,
      data: formattedEvent
    });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      message: error.message 
    });
  }
} 