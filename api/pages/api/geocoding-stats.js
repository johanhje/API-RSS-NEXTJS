/**
 * API Route: /api/geocoding-stats
 * 
 * Returns statistics about geocoding success rates and problematic location patterns
 */

import { getDatabase } from '../../lib/db/database.js';
import { normalizeLocation } from '../../lib/geocoding/nominatim.js';

export default async function handler(req, res) {
  try {
    const db = getDatabase();
    
    // Get total number of events
    const totalEvents = db.prepare('SELECT COUNT(*) as count FROM events').get().count;
    
    // Get number of events with successful geocoding
    const geocodedEvents = db.prepare('SELECT COUNT(*) as count FROM events WHERE lat IS NOT NULL AND lng IS NOT NULL AND lat != 0 AND lng != 0').get().count;
    
    // Get geocoding success rate
    const successRate = totalEvents > 0 ? (geocodedEvents / totalEvents * 100).toFixed(2) : 0;
    
    // Get most common non-geocoded locations
    const problemLocations = db.prepare(`
      SELECT location_name, COUNT(*) as count 
      FROM events 
      WHERE (lat IS NULL OR lng IS NULL OR lat = 0 OR lng = 0) 
        AND location_name IS NOT NULL
      GROUP BY location_name 
      ORDER BY count DESC 
      LIMIT 20
    `).all();
    
    // Get recently failed locations
    const recentFailures = db.prepare(`
      SELECT location_name, datetime 
      FROM events 
      WHERE (lat IS NULL OR lng IS NULL OR lat = 0 OR lng = 0) 
        AND location_name IS NOT NULL
      ORDER BY datetime DESC 
      LIMIT 10
    `).all();
    
    // Get location types with highest failure rates
    const locationTypeStats = db.prepare(`
      SELECT 
        CASE 
          WHEN location_name LIKE 'Sammanfattning%' THEN 'Sammanfattning'
          WHEN location_name LIKE 'Övrigt%' THEN 'Övrigt'
          WHEN location_name LIKE 'Trafikkontroll%' THEN 'Trafikkontroll'
          WHEN location_name LIKE '%län' THEN 'Län'
          WHEN location_name LIKE '%kommun' THEN 'Kommun'
          ELSE 'Other'
        END as location_type,
        COUNT(*) as total,
        SUM(CASE WHEN (lat IS NULL OR lng IS NULL OR lat = 0 OR lng = 0) THEN 1 ELSE 0 END) as failed,
        ROUND(SUM(CASE WHEN (lat IS NULL OR lng IS NULL OR lat = 0 OR lng = 0) THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as failure_rate
      FROM events
      WHERE location_name IS NOT NULL
      GROUP BY location_type
      ORDER BY failure_rate DESC
    `).all();
    
    // Return statistics
    res.status(200).json({
      status: 'ok',
      stats: {
        total_events: totalEvents,
        geocoded_events: geocodedEvents,
        success_rate: `${successRate}%`,
        problem_locations: problemLocations,
        recent_failures: recentFailures,
        location_type_stats: locationTypeStats
      }
    });
  } catch (error) {
    console.error('Error in geocoding stats API:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
} 