/**
 * RSS Feed Parser
 * 
 * Parses the Police RSS feed and extracts event information
 */

import Parser from 'rss-parser';
import { geocodeLocation } from '../geocoding/nominatim.js';
import { RSS_FEED_URL } from '../config.js';
import { getCachedRssFeed, cacheRssFeed, invalidateRssFeedCache, withRssCache, getRssCacheMetrics } from '../cache/rss.js';

// Create RSS parser instance
const parser = new Parser({
  customFields: {
    item: [
      ['dc:creator', 'creator'],
      ['dc:date', 'date'],
      ['content:encoded', 'contentEncoded'],
      ['guid', 'guid'],
    ],
  },
});

/**
 * Get the current status of the RSS cache
 * @returns {Object} Cache status
 */
export function getRssCacheStatus() {
  return {
    metrics: getRssCacheMetrics(),
    isCached: !!getCachedRssFeed(RSS_FEED_URL),
    default_url: RSS_FEED_URL
  };
}

/**
 * Reset the RSS cache to force a fresh fetch
 */
export function resetRssCache() {
  // Invalidate cache for the RSS feed
  invalidateRssFeedCache(RSS_FEED_URL);
  console.log('RSS feed cache has been reset');
}

/**
 * Extract the location from a title string
 * Handles various title formats found in the RSS feed
 * 
 * @param {string} title - The item title
 * @returns {string|null} - The extracted location or null if not found
 */
function extractLocation(title) {
  if (!title) return null;
  
  // Most common pattern: "Type, Location"
  const commaParts = title.split(',');
  if (commaParts.length > 1) {
    // Return everything after the first comma (handles multi-part locations)
    return commaParts.slice(1).join(',').trim();
  }
  
  // Alternative pattern: "Location - Type"
  const dashParts = title.split('-');
  if (dashParts.length > 1) {
    return dashParts[0].trim();
  }
  
  // Alternative pattern: "Location (details)"
  const parenthesisParts = title.split('(');
  if (parenthesisParts.length > 1) {
    return parenthesisParts[0].trim();
  }
  
  // If no clear delimiter, assume no location is given
  return null;
}

/**
 * Convert an RSS item to an event object
 * 
 * @param {Object} item - RSS item from the feed
 * @returns {Object} - Event object with extracted data
 */
async function rssItemToEvent(item) {
  try {
    // Extract base data
    const id = item.guid || item.link;
    const title = item.title || '';
    const description = item.contentEncoded || item.content || '';
    const link = item.link || '';
    const pubDate = item.date || item.pubDate || item.isoDate || new Date().toISOString();
    
    // Extract location from title
    const location = extractLocation(title);
    
    // Try to geocode the location
    let latitude = null;
    let longitude = null;
    
    if (location) {
      try {
        const geoResult = await geocodeLocation(location);
        if (geoResult) {
          // Parse latitude and longitude as numbers to ensure they're valid for SQLite
          latitude = geoResult.lat ? parseFloat(geoResult.lat) : null;
          longitude = geoResult.lon ? parseFloat(geoResult.lon) : null;
        } else {
          console.log(`Could not geocode location: ${location}`);
        }
      } catch (error) {
        console.error(`Error geocoding location "${location}":`, error.message);
      }
    }
    
    // Format date for database
    const publishedDate = new Date(pubDate);
    const timestamp = Math.floor(publishedDate.getTime() / 1000);
    const created_at = Math.floor(Date.now() / 1000);
    
    // Create event object with fields mapped to database schema and proper typing
    return {
      id: String(id),
      name: String(title),
      title: String(title),
      summary: String(description),
      description: String(description),
      location_name: location ? String(location) : null,
      location: location ? String(location) : null,
      link: String(link),
      url: String(link),
      datetime: publishedDate.toISOString(),
      pubDate: publishedDate.toISOString(),
      timestamp: Number(timestamp),
      created_at: Number(created_at),
      type: String(extractEventType(title)),
      latitude: latitude !== null ? Number(latitude) : null,
      lat: latitude !== null ? Number(latitude) : null,
      longitude: longitude !== null ? Number(longitude) : null,
      lng: longitude !== null ? Number(longitude) : null,
      lon: longitude !== null ? Number(longitude) : null,
      location_gps: (latitude && longitude) ? `${latitude},${longitude}` : null,
      source: 'RSS',
      translated: 0  // Using 0 (integer) for false in SQLite
    };
  } catch (error) {
    console.error('Error converting RSS item to event:', error);
    return null;
  }
}

/**
 * Extract event type from title string
 * @param {string} title - Event title
 * @returns {string} - Event type or 'Other'
 */
function extractEventType(title) {
  if (!title) return 'Other';
  
  const parts = title.split(',');
  if (parts.length > 0) {
    return parts[0].trim();
  }
  
  return 'Other';
}

/**
 * Raw function to fetch RSS feed
 * 
 * @param {string} url - URL of the RSS feed
 * @returns {Promise<Array>} - Array of RSS items from the feed
 */
async function fetchRssFeedRaw(url = RSS_FEED_URL) {
  try {
    // Fetch the RSS feed
    console.log(`Fetching RSS feed from: ${url}`);
    const feed = await parser.parseURL(url);
    
    if (!feed || !feed.items || !Array.isArray(feed.items)) {
      console.warn('Invalid RSS feed format or empty feed');
      return [];
    }
    
    console.log(`Successfully fetched ${feed.items.length} items from RSS feed`);
    return feed.items;
  } catch (error) {
    console.error('Error fetching RSS feed:', error);
    // Return empty array instead of throwing to handle errors more gracefully
    return [];
  }
}

// Create a properly wrapped RSS feed fetcher
const fetchRssFeedWithCache = withRssCache(fetchRssFeedRaw, true);

/**
 * Fetch RSS feed with caching
 * 
 * @param {string} url - URL of the RSS feed
 * @param {boolean} forceFresh - Whether to bypass cache and fetch fresh data
 * @returns {Promise<Array>} - Array of RSS items from the feed
 */
export async function fetchRssFeed(url = RSS_FEED_URL, forceFresh = false) {
  const result = await fetchRssFeedWithCache(url, forceFresh);
  // Always return an array, even if null is returned somehow
  return Array.isArray(result) ? result : [];
}

/**
 * Converts RSS items to event objects
 * 
 * @param {Array} items - RSS items from the feed
 * @returns {Promise<Array>} - Array of event objects
 */
export async function convertRssItemsToEvents(items) {
  if (!items || !Array.isArray(items)) {
    return [];
  }
  
  console.log(`Converting ${items.length} RSS items to events...`);
  
  const events = [];
  for (const item of items) {
    const event = await rssItemToEvent(item);
    if (event) {
      events.push(event);
    }
  }
  
  console.log(`Successfully converted ${events.length} items to events`);
  return events;
}

/**
 * Fetch and convert RSS feed items to events in a single operation
 * 
 * @param {string} url - RSS feed URL (optional, uses default if not provided)
 * @param {boolean} useCache - Whether to use cached results (default: true)
 * @returns {Promise<Array>} - Array of event objects
 */
export async function fetchAndConvertRssEvents(url = RSS_FEED_URL, useCache = true) {
  try {
    // Fetch RSS feed
    const feed = await fetchRssFeed(url, !useCache); // Inverting useCache to forceFresh
    
    if (!feed || feed.length === 0) {
      console.warn('No items found in RSS feed');
      return [];
    }
    
    // Convert items to events
    const events = await convertRssItemsToEvents(feed);
    return events;
  } catch (error) {
    console.error('Error in fetchAndConvertRssEvents:', error);
    throw error;
  }
} 