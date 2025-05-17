/**
 * API Endpoint for listing events
 */

import { getAllEvents, countEvents } from '../../../lib/db/events.js';
import { SUPPORTED_LANGUAGES } from '../../../lib/config.js';
import { withCachedHandler } from '../../../lib/cache/middleware.js';

// Define TTL for events endpoint cache - 5 minutes
const EVENTS_CACHE_TTL = 5 * 60 * 1000;

async function handler(req, res) {
  try {
    // Parse query parameters
    const limit = parseInt(req.query.limit || '100', 10);
    const offset = parseInt(req.query.offset || '0', 10);
    let language = req.query.language?.toLowerCase();
    const fullSync = req.query.full_sync === 'true';
    
    // Validate language code
    if (language && !SUPPORTED_LANGUAGES[language]) {
      return res.status(400).json({
        status: 'error',
        message: `Unsupported language. Supported languages are: ${Object.keys(SUPPORTED_LANGUAGES).join(', ')}`
      });
    }
    
    // Get events with possible translations
    const includeTranslations = !!language;
    const events = await getAllEvents({ 
      limit, 
      offset, 
      language, 
      includeTranslations 
    });
    
    // Format response according to original API
    const formattedEvents = events.map(event => {
      const result = {
        id: event.id,
        name: event.name,
        summary: event.summary,
        location_name: event.location_name,
        datetime: event.datetime,
        type: event.type,
        location_gps: event.location_gps,
        timestamp: event.timestamp,
        url: event.url,
        lat: event.lat,
        lng: event.lng
      };
      
      // Add translations if available and requested
      if (language && event.translations && Object.keys(event.translations).length > 0) {
        const translation = event.translations[language];
        if (translation) {
          result.name = translation.name;
          result.summary = translation.summary;
        }
      }
      
      return result;
    });
    
    // Get total count for pagination
    const total = await countEvents();
    
    // Set cache control headers
    res.setHeader('Cache-Control', `public, max-age=${Math.floor(EVENTS_CACHE_TTL / 1000)}`);
    
    res.status(200).json({
      status: 'ok',
      count: formattedEvents.length,
      events: formattedEvents,
      total,
      offset,
      limit,
      language: language || null,
      full_sync: fullSync,
      cached: req.headers['x-cache'] === 'HIT'
    });
    
  } catch (error) {
    console.error('API events error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    });
  }
}

// Wrap the handler with caching middleware
export default withCachedHandler(handler, EVENTS_CACHE_TTL); 