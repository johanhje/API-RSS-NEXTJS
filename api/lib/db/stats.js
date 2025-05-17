/**
 * Database statistics module
 * 
 * Provides functions to retrieve statistics and metrics from the database
 */

import { getDatabase } from './database.js';
import { getCacheMetrics } from '../cache/index.js';
import { getGeocodingCacheMetrics } from '../cache/geocoding.js';
import { getRssCacheMetrics } from '../cache/rss.js';

/**
 * Get total number of events in the database
 * 
 * @returns {Promise<number>} Total number of events
 */
export async function getTotalEventCount() {
  const db = getDatabase();
  const result = await db.get('SELECT COUNT(*) as count FROM events');
  return result.count;
}

/**
 * Get number of events with successful geocoding
 * 
 * @returns {Promise<number>} Number of geocoded events
 */
export async function getGeocodedEventCount() {
  const db = getDatabase();
  const result = await db.get('SELECT COUNT(*) as count FROM events WHERE lat IS NOT NULL AND lng IS NOT NULL');
  return result.count;
}

/**
 * Get number of events with failed geocoding
 * 
 * @returns {Promise<number>} Number of events with failed geocoding
 */
export async function getFailedGeocodingCount() {
  const db = getDatabase();
  const result = await db.get('SELECT COUNT(*) as count FROM events WHERE (lat IS NULL OR lng IS NULL) AND location_name IS NOT NULL');
  return result.count;
}

/**
 * Get total number of unique locations
 * 
 * @returns {Promise<number>} Number of unique locations
 */
export async function getTotalLocationsCount() {
  const db = getDatabase();
  const result = await db.get('SELECT COUNT(DISTINCT location_name) as count FROM events WHERE location_name IS NOT NULL');
  return result.count;
}

/**
 * Get problematic locations that failed geocoding
 * 
 * @param {number} limit - Maximum number of locations to return
 * @returns {Promise<Array>} List of problematic locations with counts
 */
export async function getProblematicLocations(limit = 10) {
  const db = getDatabase();
  const query = `
    SELECT 
      location_name, 
      COUNT(*) as count 
    FROM events 
    WHERE 
      location_name IS NOT NULL AND 
      (lat IS NULL OR lng IS NULL)
    GROUP BY location_name 
    ORDER BY count DESC 
    LIMIT ?
  `;
  
  return await db.all(query, [limit]);
}

/**
 * Get the most recent update time
 * 
 * @returns {Promise<string>} ISO date string of the last update
 */
export async function getLastUpdateTime() {
  const db = getDatabase();
  const result = await db.get('SELECT MAX(created_at) as last_update FROM events');
  if (result.last_update) {
    // Convert Unix timestamp to ISO date string
    return new Date(result.last_update * 1000).toISOString();
  }
  return null;
}

/**
 * Get event distribution by type
 * 
 * @param {number} limit - Maximum number of types to return
 * @returns {Promise<Array>} List of event types with counts
 */
export async function getEventTypeDistribution(limit = 10) {
  const db = getDatabase();
  const query = `
    SELECT 
      type, 
      COUNT(*) as count 
    FROM events 
    WHERE type IS NOT NULL
    GROUP BY type 
    ORDER BY count DESC 
    LIMIT ?
  `;
  
  return await db.all(query, [limit]);
}

/**
 * Get event counts grouped by day
 * 
 * @param {number} days - Number of past days to include
 * @returns {Promise<Array>} Event counts per day
 */
export async function getEventCountsByDay(days = 7) {
  const db = getDatabase();
  const query = `
    SELECT 
      strftime('%Y-%m-%d', datetime(timestamp, 'unixepoch')) as date,
      COUNT(*) as count 
    FROM events 
    WHERE timestamp > strftime('%s', 'now', '-${days} days')
    GROUP BY date 
    ORDER BY date
  `;
  
  return await db.all(query);
}

/**
 * Get geocoding success rate
 * 
 * @returns {Promise<number>} Success rate as a percentage
 */
export async function getGeocodingSuccessRate() {
  const total = await getTotalEventCount();
  if (total === 0) return 0;
  
  const geocoded = await getGeocodedEventCount();
  return Math.round((geocoded / total) * 10000) / 100; // Round to 2 decimal places
}

/**
 * Get complete system statistics
 * 
 * @returns {Promise<Object>} Complete system statistics
 */
export async function getSystemStats() {
  const [
    totalEvents,
    geocodedEvents,
    failedGeocoding,
    totalLocations,
    problematicLocations,
    eventTypes,
    dailyCounts,
    lastUpdate,
    geocodingSuccessRate
  ] = await Promise.all([
    getTotalEventCount(),
    getGeocodedEventCount(),
    getFailedGeocodingCount(),
    getTotalLocationsCount(),
    getProblematicLocations(),
    getEventTypeDistribution(),
    getEventCountsByDay(),
    getLastUpdateTime(),
    getGeocodingSuccessRate()
  ]);
  
  // Get cache metrics
  const cacheMetrics = {
    general: getCacheMetrics(),
    geocoding: getGeocodingCacheMetrics(),
    rss: getRssCacheMetrics()
  };
  
  return {
    events: {
      total: totalEvents,
      geocoded: geocodedEvents,
      failed: failedGeocoding,
      byType: eventTypes,
      byDay: dailyCounts
    },
    locations: {
      total: totalLocations,
      problematic: problematicLocations
    },
    performance: {
      geocodingSuccessRate: `${geocodingSuccessRate}%`,
      cache: cacheMetrics
    },
    lastUpdate: lastUpdate,
    timestamp: new Date().toISOString()
  };
} 