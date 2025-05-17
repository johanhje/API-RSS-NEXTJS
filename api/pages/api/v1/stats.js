/**
 * API Endpoint: /api/v1/stats
 * 
 * Returns system statistics including event counts, geocoding rates, etc.
 */

import { getDatabase } from '../../../lib/db/database.js';
import { getEventProcessingStats } from '../../../lib/events/processor.js';

export default async function handler(req, res) {
  try {
    // Get database connection
    const db = getDatabase();
    
    // Get basic system stats
    const totalEvents = db.prepare('SELECT COUNT(*) as count FROM events').get().count;
    
    // Get geocoded events count
    const geocodedEvents = db.prepare(`
      SELECT COUNT(*) as count 
      FROM events 
      WHERE lat IS NOT NULL AND lng IS NOT NULL AND lat != 0 AND lng != 0
    `).get().count;
    
    // Calculate success rate
    const geocodingSuccessRate = totalEvents > 0 
      ? (geocodedEvents / totalEvents * 100).toFixed(2) 
      : 0;
    
    // Get unique locations count
    const uniqueLocations = db.prepare(`
      SELECT COUNT(DISTINCT location_name) as count 
      FROM events 
      WHERE location_name IS NOT NULL
    `).get().count;
    
    // Get event type distribution
    const eventTypes = db.prepare(`
      SELECT type, COUNT(*) as count 
      FROM events 
      WHERE type IS NOT NULL 
      GROUP BY type 
      ORDER BY count DESC 
      LIMIT 10
    `).all();
    
    // Get events per day for the last 7 days
    const eventsPerDay = db.prepare(`
      SELECT 
        date(datetime) as date, 
        COUNT(*) as count 
      FROM events 
      WHERE datetime >= date('now', '-7 days') 
      GROUP BY date(datetime) 
      ORDER BY date DESC
    `).all();
    
    // Get most recent events timestamp
    const lastUpdated = db.prepare(`
      SELECT MAX(datetime) as last_updated 
      FROM events
    `).get().last_updated;
    
    // Return formatted response
    return res.status(200).json({
      success: true,
      data: {
        total_events: totalEvents,
        geocoded_events: geocodedEvents,
        geocoding_success_rate: `${geocodingSuccessRate}%`,
        unique_locations: uniqueLocations,
        event_types: eventTypes,
        events_per_day: eventsPerDay,
        last_updated: lastUpdated
      }
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