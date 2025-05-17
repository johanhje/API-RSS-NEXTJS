/**
 * Event Backfill Module
 * 
 * Provides functionality to backfill missed events by detecting gaps in the database
 */

import { getDatabase } from '../db/database.js';
import { fetchAndConvertRssEvents } from '../rss/parser.js';
import { isWithinTimeframe, formatISODate } from '../util/date.js';

/**
 * Backfill missing events by comparing RSS feed with database
 * 
 * @param {number} daysBack - Number of days to look back
 * @param {number} maxEvents - Maximum number of events to backfill
 * @returns {Promise<Object>} Backfill statistics
 */
export async function backfillEvents(daysBack = 7, maxEvents = 100) {
  console.log(`Backfilling events (daysBack: ${daysBack}, maxEvents: ${maxEvents})...`);
  
  try {
    // Get database connection
    const db = getDatabase();
    
    // Calculate date range
    const now = new Date();
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
    
    console.log(`Looking for events between ${startDate.toISOString()} and ${now.toISOString()}`);
    
    // Get all events from RSS feed
    const allRssEvents = await fetchAndConvertRssEvents(undefined, false); // Force fresh fetch
    
    // Filter events within the timeframe
    const recentRssEvents = allRssEvents.filter(event => {
      const eventDate = new Date(event.datetime);
      return isWithinTimeframe(eventDate, daysBack);
    });
    
    console.log(`Found ${recentRssEvents.length} events in RSS feed within timeframe`);
    
    // Get existing event IDs from the database
    const existingEventIds = db
      .prepare(`
        SELECT id 
        FROM events 
        WHERE datetime >= ? AND datetime <= ?
      `)
      .all(startDate.toISOString(), now.toISOString())
      .map(row => row.id);
    
    console.log(`Found ${existingEventIds.length} events in database within timeframe`);
    
    // Find missing events
    const missingEvents = recentRssEvents.filter(event => !existingEventIds.includes(event.id));
    
    console.log(`Found ${missingEvents.length} missing events to backfill`);
    
    // Limit number of events to backfill
    const eventsToBackfill = missingEvents.slice(0, maxEvents);
    
    // Prepare statements
    const insertEventStmt = db.prepare(`
      INSERT INTO events (
        id, name, summary, location_name, datetime, type, 
        location_gps, lat, lng, url, timestamp, created_at
      ) VALUES (
        @id, @name, @summary, @location_name, @datetime, @type,
        @location_gps, @lat, @lng, @url, @timestamp, @created_at
      )
    `);
    
    // Insert missing events
    const results = {
      total: eventsToBackfill.length,
      inserted: 0,
      skipped: 0,
      failed: 0,
      details: []
    };
    
    for (const event of eventsToBackfill) {
      try {
        // Add current timestamp
        const now = Math.floor(Date.now() / 1000);
        event.created_at = now;
        
        // Format location_gps
        if (event.lat && event.lng) {
          event.location_gps = `${event.lat},${event.lng}`;
        }
        
        // Insert into database
        insertEventStmt.run(event);
        
        results.inserted++;
        results.details.push({
          id: event.id,
          datetime: event.datetime,
          status: 'inserted'
        });
      } catch (error) {
        console.error(`Error backfilling event ${event.id}:`, error);
        results.failed++;
        results.details.push({
          id: event.id,
          datetime: event.datetime,
          status: 'failed',
          error: error.message
        });
      }
    }
    
    console.log(`Backfill completed: ${results.inserted} inserted, ${results.failed} failed`);
    return results;
  } catch (error) {
    console.error('Backfill error:', error);
    throw error;
  }
} 