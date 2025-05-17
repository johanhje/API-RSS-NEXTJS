/**
 * API Endpoint for getting a specific event by ID
 */

import { getEventById } from '../../../lib/db/events.js';
import { SUPPORTED_LANGUAGES } from '../../../lib/config.js';

export default async function handler(req, res) {
  try {
    // Get event ID from path parameter
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({
        status: 'error',
        message: 'Event ID is required'
      });
    }
    
    // Parse language parameter
    let language = req.query.language?.toLowerCase();
    
    // Validate language code if provided
    if (language && !SUPPORTED_LANGUAGES[language]) {
      return res.status(400).json({
        status: 'error',
        message: `Unsupported language. Supported languages are: ${Object.keys(SUPPORTED_LANGUAGES).join(', ')}`
      });
    }
    
    // Get event with translations if language is specified
    const includeTranslations = !!language;
    const event = await getEventById(id, { language, includeTranslations });
    
    if (!event) {
      return res.status(404).json({
        status: 'error',
        message: `Event with ID '${id}' not found`
      });
    }
    
    // Format response according to original API
    const formattedEvent = {
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
    
    // Apply translation if available and requested
    if (language && event.translations && Object.keys(event.translations).length > 0) {
      const translation = event.translations[language];
      if (translation) {
        formattedEvent.name = translation.name;
        formattedEvent.summary = translation.summary;
      }
    }
    
    res.status(200).json({
      status: 'ok',
      event: formattedEvent
    });
    
  } catch (error) {
    console.error(`API event/${req.query.id} error:`, error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    });
  }
} 