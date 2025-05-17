/**
 * Event Processing Service
 * 
 * Processes police events from RSS feed, matches them with geocoded locations,
 * and stores them in the database.
 */

import { fetchAndConvertRssEvents } from '../rss/parser.js';
import { geocodeLocation } from '../geocoding/nominatim.js';
import { batchGeocode, bulkReprocessGeodata } from '../geocoding/batch.js';
import { getDatabase } from '../db/database.js';

/**
 * Extract location from an event title
 * 
 * @param {string} title - Event title
 * @returns {string|null} - Extracted location or null
 */
function extractLocation(title) {
  if (!title) return null;
  
  // Common police title format: "Event type, Location"
  const commaMatch = title.match(/^.*,\s*(.+)$/);
  if (commaMatch && commaMatch[1]) {
    return commaMatch[1].trim();
  }
  
  // Alternative format: "Event type i Location"
  const inMatch = title.match(/^.*\s+i\s+(.+)$/i);
  if (inMatch && inMatch[1]) {
    return inMatch[1].trim();
  }
  
  // Alternative format: "Event type på Location"
  const onMatch = title.match(/^.*\s+på\s+(.+)$/i);
  if (onMatch && onMatch[1]) {
    return onMatch[1].trim();
  }
  
  // If no location found, return null
  return null;
}

/**
 * Process events from RSS feed and store in database
 * 
 * @returns {Promise<Object>} Processing results including counts
 */
export async function processPoliceEvents() {
  console.log('Starting police event processing...');
  
  try {
    // Get database connection
    const db = getDatabase();
    
    // Prepare statements
    const findEventStmt = db.prepare(
      'SELECT id, name, location_name, datetime FROM events WHERE id = ?'
    );
    
    const insertEventStmt = db.prepare(`
      INSERT INTO events (
        id, name, summary, location_name, datetime, type, 
        location_gps, lat, lng, url, timestamp, created_at
      ) VALUES (
        @id, @name, @summary, @location_name, @datetime, @type,
        @location_gps, @lat, @lng, @url, @timestamp, @created_at
      )
    `);
    
    const updateEventStmt = db.prepare(`
      UPDATE events SET
        name = @name,
        summary = @summary,
        location_name = @location_name,
        datetime = @datetime,
        type = @type,
        location_gps = @location_gps,
        lat = @lat,
        lng = @lng,
        url = @url,
        timestamp = @timestamp,
        last_updated = @last_updated
      WHERE id = @id
    `);
    
    // Fetch events from RSS feed
    const events = await fetchAndConvertRssEvents();
    
    // Process results
    let results = {
      total: events.length,
      new: 0,
      updated: 0,
      unchanged: 0,
      failed: 0,
      geocodingSuccess: 0
    };
    
    // Process each event
    for (const event of events) {
      try {
        // Extract location from event name if not already present
        if (!event.location_name && event.name) {
          event.location_name = extractLocation(event.name);
        }
        
        // Format location_gps
        if (event.lat && event.lng) {
          event.location_gps = `${event.lat},${event.lng}`;
        }
        
        // Check if event already exists
        const existingEvent = findEventStmt.get(event.id);
        const now = Math.floor(Date.now() / 1000);
        
        if (existingEvent) {
          // Check if event has changed
          if (
            existingEvent.name !== event.name ||
            existingEvent.location_name !== event.location_name ||
            new Date(existingEvent.datetime).getTime() !== new Date(event.datetime).getTime()
          ) {
            // Event has changed, update it
            updateEventStmt.run({
              ...event,
              last_updated: now
            });
            results.updated++;
          } else {
            // Event hasn't changed
            results.unchanged++;
          }
        } else {
          // New event, insert it
          insertEventStmt.run({
            ...event,
            created_at: now
          });
          results.new++;
        }
        
        // Count geocoding success
        if (event.lat && event.lng && event.lat !== 0 && event.lng !== 0) {
          results.geocodingSuccess++;
        }
      } catch (error) {
        console.error(`Error processing event ${event.id}:`, error);
        results.failed++;
      }
    }
    
    // Calculate geocoding success rate
    results.geocodingSuccessRate = (results.geocodingSuccess / results.total * 100).toFixed(2) + '%';
    
    console.log('Police event processing completed:', results);
    return results;
  } catch (error) {
    console.error('Event processing error:', error);
    throw error;
  }
}

/**
 * Reprocess events with missing geocoding using optimized batch processing
 * 
 * @param {number} limit Maximum number of events to reprocess
 * @returns {Promise<Object>} Processing results
 */
export async function reprocessEventsWithMissingGeodata(limit = 50) {
  console.log(`Reprocessing up to ${limit} events with missing geodata...`);
  
  try {
    // Get database connection
    const db = getDatabase();
    
    // Get events with missing geocoding
    const eventsWithMissingGeodata = db.prepare(`
      SELECT id, name, location_name 
      FROM events 
      WHERE (lat IS NULL OR lng IS NULL OR lat = 0 OR lng = 0) 
        AND location_name IS NOT NULL
      ORDER BY datetime DESC
      LIMIT ?
    `).all(limit);
    
    if (eventsWithMissingGeodata.length === 0) {
      console.log('No events found with missing geodata.');
      return { total: 0, updated: 0, failed: 0 };
    }
    
    const updateGeoStmt = db.prepare(`
      UPDATE events 
      SET lat = ?, lng = ?, location_gps = ?, last_updated = ?
      WHERE id = ?
    `);
    
    // Callback to update an event in the database
    const updateEventCallback = async (event, geoData) => {
      const now = Math.floor(Date.now() / 1000);
      updateGeoStmt.run(
        geoData.lat,
        geoData.lng,
        geoData.location_gps,
        now,
        event.id
      );
    };
    
    // Process all events in bulk with batch geocoding
    const results = await bulkReprocessGeodata(
      eventsWithMissingGeodata, 
      updateEventCallback,
      {
        concurrency: 5,
        delayMs: 200,
        retries: 1
      }
    );
    
    console.log('Reprocessing of events with missing geodata completed:', results);
    return results;
  } catch (error) {
    console.error('Error reprocessing events:', error);
    throw error;
  }
}

/**
 * Get event processing statistics
 * 
 * @returns {Object} Statistics about events and geocoding
 */
export function getEventProcessingStats() {
  try {
    const db = getDatabase();
    
    // Get total events
    const totalEvents = db.prepare('SELECT COUNT(*) as count FROM events').get().count;
    
    // Get geocoded events count
    const geocodedEvents = db.prepare(`
      SELECT COUNT(*) as count 
      FROM events 
      WHERE lat IS NOT NULL AND lng IS NOT NULL AND lat != 0 AND lng != 0
    `).get().count;
    
    // Calculate success rate
    const successRate = totalEvents > 0 
      ? (geocodedEvents / totalEvents * 100).toFixed(2) 
      : 0;
    
    // Get most recent events
    const recentEvents = db.prepare(`
      SELECT id, name, location_name, datetime, lat, lng
      FROM events
      ORDER BY datetime DESC
      LIMIT 10
    `).all();
    
    // Get problematic locations (missing geocoding)
    const problematicLocations = db.prepare(`
      SELECT location_name, COUNT(*) as count
      FROM events
      WHERE (lat IS NULL OR lng IS NULL OR lat = 0 OR lng = 0)
        AND location_name IS NOT NULL
      GROUP BY location_name
      ORDER BY count DESC
      LIMIT 10
    `).all();
    
    return {
      total_events: totalEvents,
      geocoded_events: geocodedEvents,
      geocoding_success_rate: `${successRate}%`,
      recent_events: recentEvents,
      problematic_locations: problematicLocations
    };
  } catch (error) {
    console.error('Error getting event processing stats:', error);
    throw error;
  }
} 