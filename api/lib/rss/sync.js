/**
 * RSS data synchronization with database
 */

import { fetchAndConvertRssEvents } from './parser.js';
import { 
  getEventByUrl, 
  getEventById, 
  insertEvent, 
  updateEvent, 
  countEvents,
  getLatestEventTimestamp
} from '../db/events.js';

/**
 * Compare RSS event with existing database event to detect changes
 * @param {Object} rssEvent - Event from RSS
 * @param {Object} dbEvent - Event from database
 * @returns {boolean} - True if event has changed
 */
function hasEventChanged(rssEvent, dbEvent) {
  // Check for any differences in core fields
  if (rssEvent.name !== dbEvent.name ||
      rssEvent.summary !== dbEvent.summary ||
      rssEvent.location_name !== dbEvent.location_name ||
      rssEvent.datetime !== dbEvent.datetime ||
      rssEvent.type !== dbEvent.type) {
    return true;
  }
  
  // Check if coordinates have been added/changed
  if ((!dbEvent.location_gps && rssEvent.location_gps) ||
      (dbEvent.location_gps !== rssEvent.location_gps)) {
    return true;
  }
  
  return false;
}

/**
 * Synchronize RSS events with database
 * @returns {Promise<Object>} - Sync results
 */
export async function syncRssEvents() {
  console.log('Starting RSS feed synchronization...');
  
  const startTime = Date.now();
  const rssEvents = await fetchAndConvertRssEvents();
  
  console.log(`Fetched ${rssEvents.length} events from RSS feed`);
  
  let inserted = 0;
  let updated = 0;
  let unchanged = 0;
  
  for (const rssEvent of rssEvents) {
    try {
      // Check if event already exists by URL
      let existingEvent = await getEventByUrl(rssEvent.url);
      
      // Also check by ID in case URL changed but ID is the same
      if (!existingEvent) {
        existingEvent = await getEventById(rssEvent.id);
      }
      
      if (!existingEvent) {
        // New event, insert it
        await insertEvent(rssEvent);
        inserted++;
      } else if (hasEventChanged(rssEvent, existingEvent)) {
        // Event exists but has changed, update it
        // Preserve the original created_at timestamp
        const updatedEvent = {
          ...rssEvent,
          created_at: existingEvent.created_at
        };
        
        await updateEvent(existingEvent.id, updatedEvent);
        updated++;
      } else {
        // Event exists and has not changed
        unchanged++;
      }
    } catch (error) {
      console.error(`Error processing event ${rssEvent.id}:`, error);
    }
  }
  
  const totalTime = (Date.now() - startTime) / 1000;
  
  const result = {
    totalEvents: rssEvents.length,
    inserted,
    updated,
    unchanged,
    totalTime,
    timestamp: Math.floor(Date.now() / 1000)
  };
  
  console.log(`Sync complete: ${inserted} inserted, ${updated} updated, ${unchanged} unchanged (${totalTime.toFixed(2)}s)`);
  
  return result;
}

/**
 * Get database statistics
 * @returns {Promise<Object>} - Database stats
 */
export async function getDatabaseStats() {
  const totalEvents = await countEvents();
  const latestEventTimestamp = await getLatestEventTimestamp();
  
  let latestEventDate = null;
  if (latestEventTimestamp) {
    latestEventDate = new Date(latestEventTimestamp * 1000).toISOString();
  }
  
  return {
    totalEvents,
    latestEventTimestamp,
    latestEventDate,
    currentTimestamp: Math.floor(Date.now() / 1000)
  };
} 